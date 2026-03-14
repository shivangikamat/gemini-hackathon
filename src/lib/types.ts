export type FaceProfile = {
  faceShape: string;
  hairTexture: string;
  skinTone: string;
};

export type HairstyleSuggestion = {
  name: string;
  reason: string;
};

export type Salon = {
  id: string;
  name: string;
  address: string;
  rating: number;
  reason: string;
  vibe: string;
  priceBand: "$" | "$$" | "$$$";
  website?: string;
  matchedServices: string[];
};

export type SalonSearchResponse = {
  demo: true;
  location: string;
  selectedStyle: string;
  salons: Salon[];
};

export type HairSilhouette = "bob" | "curtain" | "shag";
export type HairColorName =
  | "soft-black"
  | "espresso"
  | "chestnut"
  | "copper"
  | "golden-blonde";
export type HairPart = "center" | "side";
export type HairTextureMode = "sleek" | "airy" | "piecey" | "wavy";
export type HairVolume = "low" | "medium" | "high";
export type HairFringe = "none" | "curtain" | "wispy" | "full";
export type HairLength = "short" | "medium" | "long";

export type HairOverlayConfig = {
  silhouette: HairSilhouette;
  colorName: HairColorName;
  part: HairPart;
  texture: HairTextureMode;
  volume: HairVolume;
  fringe: HairFringe;
  length: HairLength;
};

export type StyleAgentResponse = {
  selectedStyle: string;
  mashupName: string;
  agentReply: string;
  preferencesSummary: string;
  overlay: HairOverlayConfig;
};
