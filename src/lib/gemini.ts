import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  FaceProfile,
  HairOverlayConfig,
  HairstyleSuggestion,
  StyleAgentTurn,
  StyleAgentResponse,
} from "./types";
import {
  buildLivePreferenceContext,
  createFallbackStyleAgentResponse,
} from "./styleStudio";

type GeminiFaceResponse = {
  faceProfile: FaceProfile;
  suggestions: HairstyleSuggestion[];
};

const DEFAULT_SUGGESTIONS: HairstyleSuggestion[] = [
  {
    name: "Textured Bob",
    reason: "Adds movement and volume while softly framing most face shapes.",
  },
  {
    name: "Curtain Layers",
    reason:
      "Long, face-framing layers that balance wide cheeks and soften sharp jawlines.",
  },
  {
    name: "Modern Shag",
    reason:
      "Works well for wavy or straight hair, adding lift at the crown and definition around the eyes.",
  },
];

const DEFAULT_FACE_PROFILE: FaceProfile = {
  faceShape: "oval",
  hairTexture: "unknown",
  skinTone: "unknown",
};

const VALID_SILHOUETTES: HairOverlayConfig["silhouette"][] = [
  "bob",
  "curtain",
  "shag",
];
const VALID_COLORS: HairOverlayConfig["colorName"][] = [
  "soft-black",
  "espresso",
  "chestnut",
  "copper",
  "golden-blonde",
];
const VALID_PARTS: HairOverlayConfig["part"][] = ["center", "side"];
const VALID_TEXTURES: HairOverlayConfig["texture"][] = [
  "sleek",
  "airy",
  "piecey",
  "wavy",
];
const VALID_VOLUMES: HairOverlayConfig["volume"][] = ["low", "medium", "high"];
const VALID_FRINGES: HairOverlayConfig["fringe"][] = [
  "none",
  "curtain",
  "wispy",
  "full",
];
const VALID_LENGTHS: HairOverlayConfig["length"][] = [
  "short",
  "medium",
  "long",
];

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn(
      "GEMINI_API_KEY is not set. Falling back to mock hairstyle suggestions."
    );
    return null;
  }

  return new GoogleGenerativeAI(apiKey);
}

function isOneOf<T extends string>(value: unknown, items: readonly T[]): value is T {
  return typeof value === "string" && items.includes(value as T);
}

function sanitizeAgentResponse(
  candidate: unknown,
  preferences: string,
  suggestions: HairstyleSuggestion[],
  currentStyle?: string | null,
  conversationHistory: StyleAgentTurn[] = []
): StyleAgentResponse {
  const fallback = createFallbackStyleAgentResponse(
    preferences,
    suggestions,
    currentStyle,
    conversationHistory
  );

  if (!candidate || typeof candidate !== "object") {
    return fallback;
  }

  const parsed = candidate as Record<string, unknown>;
  const suggestionNames = suggestions.map((suggestion) => suggestion.name);
  const selectedStyle =
    typeof parsed.selectedStyle === "string" &&
    suggestionNames.includes(parsed.selectedStyle)
      ? parsed.selectedStyle
      : fallback.selectedStyle;

  const overlayCandidate =
    parsed.overlay && typeof parsed.overlay === "object"
      ? (parsed.overlay as Record<string, unknown>)
      : {};

  return {
    selectedStyle,
    mashupName:
      typeof parsed.mashupName === "string" && parsed.mashupName.trim()
        ? parsed.mashupName.trim()
        : fallback.mashupName,
    agentReply:
      typeof parsed.agentReply === "string" && parsed.agentReply.trim()
        ? parsed.agentReply.trim()
        : fallback.agentReply,
    preferencesSummary:
      typeof parsed.preferencesSummary === "string" &&
      parsed.preferencesSummary.trim()
        ? parsed.preferencesSummary.trim()
        : fallback.preferencesSummary,
    overlay: {
      silhouette: isOneOf(overlayCandidate.silhouette, VALID_SILHOUETTES)
        ? overlayCandidate.silhouette
        : fallback.overlay.silhouette,
      colorName: isOneOf(overlayCandidate.colorName, VALID_COLORS)
        ? overlayCandidate.colorName
        : fallback.overlay.colorName,
      part: isOneOf(overlayCandidate.part, VALID_PARTS)
        ? overlayCandidate.part
        : fallback.overlay.part,
      texture: isOneOf(overlayCandidate.texture, VALID_TEXTURES)
        ? overlayCandidate.texture
        : fallback.overlay.texture,
      volume: isOneOf(overlayCandidate.volume, VALID_VOLUMES)
        ? overlayCandidate.volume
        : fallback.overlay.volume,
      fringe: isOneOf(overlayCandidate.fringe, VALID_FRINGES)
        ? overlayCandidate.fringe
        : fallback.overlay.fringe,
      length: isOneOf(overlayCandidate.length, VALID_LENGTHS)
        ? overlayCandidate.length
        : fallback.overlay.length,
    },
  };
}

export async function analyzeSelfieWithGemini(
  imageBytes: Buffer,
  mimeType: string
): Promise<GeminiFaceResponse> {
  const client = getClient();

  if (!client) {
    return {
      faceProfile: DEFAULT_FACE_PROFILE,
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = `
You are a world-class hairstylist and face-shape analyst.

Look closely at this selfie and:
1) Infer the person's face shape, hair texture, and skin tone category.
2) Recommend 3 specific hairstyles that would be very flattering.

Respond with STRICT JSON that matches this TypeScript type:

type Response = {
  faceProfile: {
    faceShape:
      | "round"
      | "oval"
      | "square"
      | "heart"
      | "diamond"
      | "oblong";
    hairTexture: string; // e.g. "straight", "wavy", "coily"
    skinTone: string; // e.g. "cool fair", "warm medium", "deep neutral"
  };
  suggestions: {
    name: string;   // concise hairstyle name
    reason: string; // 1–2 sentence explanation tailored to this face
  }[];
};

Return ONLY valid JSON. Do not include markdown, backticks, or any extra text.
`.trim();

  const imagePart = {
    inlineData: {
      data: imageBytes.toString("base64"),
      mimeType,
    },
  };

  const requestParts =
    imageBytes.length > 0 && mimeType.startsWith("image/")
      ? [{ text: prompt }, imagePart]
      : [prompt];

  const result = await model.generateContent(requestParts);

  const text = result.response.text();

  let parsed: GeminiFaceResponse | null = null;

  try {
    parsed = JSON.parse(text) as GeminiFaceResponse;
  } catch (error) {
    console.error("Failed to parse Gemini JSON response:", error, text);
  }

  if (
    !parsed ||
    !parsed.suggestions ||
    !Array.isArray(parsed.suggestions) ||
    parsed.suggestions.length === 0
  ) {
    return {
      faceProfile: DEFAULT_FACE_PROFILE,
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  return parsed;
}

export async function generateStyleMashupWithGemini(params: {
  preferences: string;
  suggestions: HairstyleSuggestion[];
  currentStyle?: string | null;
  conversationHistory?: StyleAgentTurn[];
}): Promise<StyleAgentResponse> {
  const { preferences, suggestions, currentStyle, conversationHistory = [] } =
    params;
  const livePreferenceContext = buildLivePreferenceContext(
    preferences,
    conversationHistory
  );
  const fallback = createFallbackStyleAgentResponse(
    livePreferenceContext,
    suggestions,
    currentStyle,
    conversationHistory
  );
  const client = getClient();

  if (!client) {
    return fallback;
  }

  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = `
You are a live celebrity hair stylist agent for a Gemini hackathon demo.

The user is talking to a webcam preview and wants a hairstyle mashup recommendation.
You must pick exactly one base style from this available list:
${suggestions
  .map(
    (suggestion) => `- ${suggestion.name}: ${suggestion.reason}`
  )
  .join("\n")}

Current selected style: ${currentStyle || "none"}
Recent conversation:
${
  conversationHistory.length > 0
    ? conversationHistory
        .map(
          (turn) =>
            `${turn.speaker === "user" ? "User" : "Agent"}: ${turn.text}`
        )
        .join("\n")
    : "No prior conversation yet."
}

Newest preferences transcript:
${preferences || "No specific preferences given."}

Cumulative preference direction:
${livePreferenceContext || "No specific preferences given."}

Respond with STRICT JSON only. Use this shape exactly:
{
  "selectedStyle": "one of the available style names exactly",
  "mashupName": "short memorable demo name",
  "agentReply": "2-3 sentence stylist response in a warm, decisive tone",
  "preferencesSummary": "one sentence summary of what the user asked for",
  "overlay": {
    "silhouette": "bob" | "curtain" | "shag",
    "colorName": "soft-black" | "espresso" | "chestnut" | "copper" | "golden-blonde",
    "part": "center" | "side",
    "texture": "sleek" | "airy" | "piecey" | "wavy",
    "volume": "low" | "medium" | "high",
    "fringe": "none" | "curtain" | "wispy" | "full",
    "length": "short" | "medium" | "long"
  }
}

Keep the output practical for a live overlay preview. Do not include markdown or extra text.
`.trim();

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return sanitizeAgentResponse(
      JSON.parse(text),
      livePreferenceContext,
      suggestions,
      currentStyle,
      conversationHistory
    );
  } catch (error) {
    console.error("Failed to generate style mashup:", error);
    return fallback;
  }
}
