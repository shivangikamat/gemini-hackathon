import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FaceProfile, HairstyleSuggestion } from "./types";

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

function getClient() {
  const apiKey = "AIzaSyCqsaGaq-sR07vxa5UGQdc3CUNXnCfF1fQ";

  if (!apiKey) {
    console.warn(
      "GEMINI_API_KEY is not set. Falling back to mock hairstyle suggestions."
    );
    return null;
  }

  return new GoogleGenerativeAI(apiKey);
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
    model: "gemini-pro-vision",
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

  let parsed: GeminiFaceResponse | null = null;

  try {
    const result = await model.generateContent([
      { text: prompt },
      imagePart,
    ]);

    const text = result.response.text();

    try {
      parsed = JSON.parse(text) as GeminiFaceResponse;
    } catch (error) {
      console.error("Failed to parse Gemini JSON response:", error, text);
    }
  } catch (error) {
    // If the model ID is unavailable for this key / API version (404) or any
    // other error occurs, fall back to safe defaults so the UI keeps working.
    console.error("Error calling Gemini for selfie analysis:", error);
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

