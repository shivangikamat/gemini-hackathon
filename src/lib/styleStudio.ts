import type {
  HairColorName,
  HairOverlayConfig,
  HairstyleSuggestion,
  StyleAgentTurn,
  StyleAgentResponse,
} from "./types";

type OverlayPalette = {
  base: string;
  mid: string;
  shine: string;
  shadow: string;
};

const COLOR_KEYWORDS: Array<{ keywords: string[]; color: HairColorName }> = [
  { keywords: ["black", "inky", "jet"], color: "soft-black" },
  { keywords: ["espresso", "dark brown", "rich brown"], color: "espresso" },
  { keywords: ["brown", "brunette", "chocolate"], color: "chestnut" },
  { keywords: ["copper", "red", "auburn"], color: "copper" },
  { keywords: ["blonde", "gold", "honey"], color: "golden-blonde" },
];

const PALETTES: Record<HairColorName, OverlayPalette> = {
  "soft-black": {
    base: "#1f232b",
    mid: "#313845",
    shine: "#667084",
    shadow: "#0f1217",
  },
  espresso: {
    base: "#2a211d",
    mid: "#4f3b33",
    shine: "#8f7365",
    shadow: "#17110f",
  },
  chestnut: {
    base: "#553328",
    mid: "#7b4a38",
    shine: "#b7846d",
    shadow: "#2f1b15",
  },
  copper: {
    base: "#7a3823",
    mid: "#b25531",
    shine: "#eb9a64",
    shadow: "#3d1b13",
  },
  "golden-blonde": {
    base: "#9a7334",
    mid: "#c79a49",
    shine: "#f0cf8b",
    shadow: "#5c4522",
  },
};

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectStyleFamily(styleName: string): HairOverlayConfig["silhouette"] {
  const normalized = styleName.toLowerCase();

  if (normalized.includes("bob")) {
    return "bob";
  }

  if (normalized.includes("shag")) {
    return "shag";
  }

  return "curtain";
}

function inferColor(preferences: string): HairColorName {
  const normalized = preferences.toLowerCase();
  const matched = COLOR_KEYWORDS.find(({ keywords }) =>
    includesAny(normalized, keywords)
  );

  return matched?.color || "espresso";
}

function baseOverlayForStyle(styleName: string): HairOverlayConfig {
  const silhouette = detectStyleFamily(styleName);

  if (silhouette === "bob") {
    return {
      silhouette,
      colorName: "espresso",
      part: "side",
      texture: "sleek",
      volume: "low",
      fringe: "wispy",
      length: "short",
    };
  }

  if (silhouette === "shag") {
    return {
      silhouette,
      colorName: "soft-black",
      part: "center",
      texture: "piecey",
      volume: "high",
      fringe: "wispy",
      length: "medium",
    };
  }

  return {
    silhouette,
    colorName: "chestnut",
    part: "center",
    texture: "airy",
    volume: "medium",
    fringe: "curtain",
    length: "long",
  };
}

export function createOverlayFromStyle(
  styleName: string,
  preferences = ""
): HairOverlayConfig {
  const overlay = baseOverlayForStyle(styleName);
  const normalized = preferences.toLowerCase();

  overlay.colorName = inferColor(preferences);

  if (includesAny(normalized, ["side part", "deep part"])) {
    overlay.part = "side";
  } else if (includesAny(normalized, ["center part", "middle part"])) {
    overlay.part = "center";
  }

  if (includesAny(normalized, ["sleek", "clean", "polished", "glassy"])) {
    overlay.texture = "sleek";
    overlay.volume = "low";
  } else if (includesAny(normalized, ["soft", "airy", "romantic", "light"])) {
    overlay.texture = "airy";
  } else if (includesAny(normalized, ["wavy", "wave", "bouncy"])) {
    overlay.texture = "wavy";
  } else if (includesAny(normalized, ["edgy", "piecey", "textured", "rock"])) {
    overlay.texture = "piecey";
  }

  if (includesAny(normalized, ["volume", "full", "bigger", "dramatic"])) {
    overlay.volume = "high";
  } else if (includesAny(normalized, ["minimal", "sleek", "flat", "tame"])) {
    overlay.volume = "low";
  }

  if (includesAny(normalized, ["no bangs", "no fringe", "open forehead"])) {
    overlay.fringe = "none";
  } else if (includesAny(normalized, ["full fringe", "blunt bangs"])) {
    overlay.fringe = "full";
  } else if (includesAny(normalized, ["curtain", "face framing"])) {
    overlay.fringe = "curtain";
  } else if (includesAny(normalized, ["wispy", "soft bangs"])) {
    overlay.fringe = "wispy";
  }

  if (includesAny(normalized, ["short", "chin length", "low maintenance"])) {
    overlay.length = "short";
  } else if (includesAny(normalized, ["shoulder", "medium"])) {
    overlay.length = "medium";
  } else if (includesAny(normalized, ["long", "longer", "keep length"])) {
    overlay.length = "long";
  }

  return overlay;
}

export function getOverlayPalette(colorName: HairColorName): OverlayPalette {
  return PALETTES[colorName];
}

export function buildLivePreferenceContext(
  preferences: string,
  conversationHistory: StyleAgentTurn[] = []
) {
  const priorUserTurns = conversationHistory
    .filter((turn) => turn.speaker === "user")
    .map((turn) => turn.text.trim())
    .filter(Boolean)
    .slice(-2);

  return [...priorUserTurns, preferences.trim()].filter(Boolean).join(" ").trim();
}

function scoreStyleMatch(style: HairstyleSuggestion, preferences: string) {
  const styleName = style.name.toLowerCase();
  const text = preferences.toLowerCase();
  let score = 0;

  if (styleName.includes("bob")) {
    if (
      includesAny(text, [
        "short",
        "polished",
        "clean",
        "sharp",
        "professional",
        "low maintenance",
      ])
    ) {
      score += 4;
    }
  }

  if (styleName.includes("curtain") || styleName.includes("layer")) {
    if (
      includesAny(text, [
        "soft",
        "romantic",
        "face framing",
        "versatile",
        "long",
        "flowy",
      ])
    ) {
      score += 4;
    }
  }

  if (styleName.includes("shag")) {
    if (
      includesAny(text, [
        "edgy",
        "texture",
        "volum",
        "bold",
        "cool",
        "rock",
        "lived in",
      ])
    ) {
      score += 4;
    }
  }

  if (includesAny(text, styleName.split(/\s+/))) {
    score += 3;
  }

  return score;
}

function buildMashupName(styleName: string, overlay: HairOverlayConfig) {
  const descriptor =
    overlay.texture === "sleek"
      ? "Gloss"
      : overlay.texture === "wavy"
        ? "Wave"
        : overlay.texture === "piecey"
          ? "Edge"
          : "Soft";

  if (overlay.silhouette === "bob") {
    return `${descriptor} Bob Halo`;
  }

  if (overlay.silhouette === "shag") {
    return `${descriptor} Shag Remix`;
  }

  return `${descriptor} Curtain Flow`;
}

function summarizePreferences(preferences: string) {
  const trimmed = preferences.trim();

  if (!trimmed) {
    return "You want a flattering live preview that still feels wearable in real life.";
  }

  if (trimmed.length <= 160) {
    return trimmed;
  }

  return `${trimmed.slice(0, 157)}...`;
}

export function createFallbackStyleAgentResponse(
  preferences: string,
  suggestions: HairstyleSuggestion[],
  currentStyle?: string | null,
  conversationHistory: StyleAgentTurn[] = []
): StyleAgentResponse {
  const effectivePreferences = buildLivePreferenceContext(
    preferences,
    conversationHistory
  );
  const safeSuggestions =
    suggestions.length > 0
      ? suggestions
      : [
          {
            name: "Curtain Layers",
            reason: "A soft, wearable option with movement around the face.",
          },
        ];

  const selected =
    safeSuggestions
      .map((suggestion) => ({
        suggestion,
        score:
          scoreStyleMatch(suggestion, effectivePreferences) +
          (suggestion.name === currentStyle ? 2 : 0),
      }))
      .sort((a, b) => b.score - a.score)[0]?.suggestion || safeSuggestions[0];

  const overlay = createOverlayFromStyle(selected.name, effectivePreferences);
  const summary = summarizePreferences(effectivePreferences);

  return {
    selectedStyle: selected.name,
    mashupName: buildMashupName(selected.name, overlay),
    preferencesSummary: summary,
    agentReply: `I’d steer you toward ${selected.name} for this live preview. It keeps the vibe aligned with “${summary}” while staying believable on camera and easy to pitch as a stylist-ready cut.`,
    overlay,
  };
}
