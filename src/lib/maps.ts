import type { Salon } from "./types";

type StyleProfile = {
  tokens: string[];
  matchedServices: string[];
};

type SalonSeed = {
  id: string;
  name: string;
  district: string;
  rating: number;
  vibe: string;
  priceBand: "$" | "$$" | "$$$";
  website: string;
  strengths: string[];
};

const SALON_DIRECTORY: SalonSeed[] = [
  {
    id: "glasshouse-atelier",
    name: "Glasshouse Atelier",
    district: "City Center",
    rating: 4.9,
    vibe: "Editorial, polished finishes with extra time spent on face framing.",
    priceBand: "$$$",
    website: "https://example.com/glasshouse-atelier",
    strengths: ["precision", "bob", "sleek", "gloss", "face framing", "consultation"],
  },
  {
    id: "fringe-theory-studio",
    name: "Fringe Theory Studio",
    district: "Arts District",
    rating: 4.8,
    vibe: "Soft fringe work, airy layering, and lived-in styling.",
    priceBand: "$$",
    website: "https://example.com/fringe-theory-studio",
    strengths: ["fringe", "bangs", "soft layers", "face framing", "movement", "texture"],
  },
  {
    id: "halo-texture-lab",
    name: "Halo Texture Lab",
    district: "Riverside",
    rating: 4.9,
    vibe: "Texture-forward cuts with shape that grows out beautifully.",
    priceBand: "$$$",
    website: "https://example.com/halo-texture-lab",
    strengths: ["texture", "shag", "layers", "movement", "volume", "curls"],
  },
  {
    id: "meridian-cut-club",
    name: "Meridian Cut Club",
    district: "West End",
    rating: 4.7,
    vibe: "Sharp structure, clean silhouettes, and technical cutting.",
    priceBand: "$$",
    website: "https://example.com/meridian-cut-club",
    strengths: ["precision", "blunt", "short cut", "bob", "consultation", "shape"],
  },
  {
    id: "soft-motion-salon",
    name: "Soft Motion Salon",
    district: "Uptown",
    rating: 4.8,
    vibe: "Volume, movement, and effortless styling for everyday wear.",
    priceBand: "$$",
    website: "https://example.com/soft-motion-salon",
    strengths: ["layers", "curtain", "blowout", "movement", "texture", "soft fringe"],
  },
  {
    id: "crown-craft-house",
    name: "Crown Craft House",
    district: "Market Quarter",
    rating: 4.7,
    vibe: "Consultation-led sessions tailored to hair density and maintenance goals.",
    priceBand: "$$",
    website: "https://example.com/crown-craft-house",
    strengths: ["consultation", "face framing", "long layers", "gloss", "texture", "finish"],
  },
];

function buildStyleProfile(styleName: string): StyleProfile {
  const normalized = styleName.trim().toLowerCase();

  if (normalized.includes("bob")) {
    return {
      tokens: ["bob", "precision", "shape", "sleek", "gloss", "blunt"],
      matchedServices: [
        "Precision bob shaping",
        "Glass-finish blowout",
        "Jawline-balancing consultation",
      ],
    };
  }

  if (normalized.includes("fringe") || normalized.includes("bang")) {
    return {
      tokens: ["fringe", "bangs", "soft fringe", "face framing", "movement"],
      matchedServices: [
        "Soft fringe refinement",
        "Face-framing layering",
        "Texture-led styling finish",
      ],
    };
  }

  if (normalized.includes("shag")) {
    return {
      tokens: ["shag", "texture", "movement", "volume", "layers"],
      matchedServices: [
        "Razor-texture shaping",
        "Lived-in layering",
        "Movement styling session",
      ],
    };
  }

  if (normalized.includes("layer")) {
    return {
      tokens: ["layers", "curtain", "face framing", "movement", "blowout"],
      matchedServices: [
        "Curtain layer blend",
        "Face-framing cut map",
        "Soft volume blowout",
      ],
    };
  }

  return {
    tokens: Array.from(
      new Set(
        normalized
          .split(/\s+/)
          .filter(Boolean)
          .concat(["consultation", "shape", "texture"])
      )
    ),
    matchedServices: [
      "Style consultation",
      "Shape refinement cut",
      "Finish styling session",
    ],
  };
}

function countMatches(strengths: string[], tokens: string[]) {
  return strengths.reduce((score, strength) => {
    const normalizedStrength = strength.toLowerCase();
    return score + (tokens.some((token) => normalizedStrength.includes(token) || token.includes(normalizedStrength)) ? 1 : 0);
  }, 0);
}

export function findSalonMatches(styleName: string, location: string): Salon[] {
  const profile = buildStyleProfile(styleName);
  const cleanedLocation = location.trim();

  return SALON_DIRECTORY.map((salon) => {
    const overlap = salon.strengths.filter((strength) =>
      profile.tokens.some((token) => strength.includes(token) || token.includes(strength))
    );
    const matchedServices =
      overlap.length > 0
        ? profile.matchedServices.filter((service) =>
            overlap.some((strength) => service.toLowerCase().includes(strength))
          )
        : [];

    const score = countMatches(salon.strengths, profile.tokens) + salon.rating;
    const highlightedStrengths = overlap.slice(0, 2);
    const reason =
      highlightedStrengths.length > 0
        ? `Strong fit for ${styleName} thanks to its focus on ${highlightedStrengths.join(" and ")}.`
        : `Solid match for ${styleName} with a consultation-first approach and consistent finishing work.`;

    return {
      score,
      salon: {
        id: salon.id,
        name: salon.name,
        address: `${salon.district}, ${cleanedLocation}`,
        rating: salon.rating,
        reason,
        vibe: salon.vibe,
        priceBand: salon.priceBand,
        website: salon.website,
        matchedServices:
          matchedServices.length > 0
            ? matchedServices
            : profile.matchedServices.slice(0, 2),
      },
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ salon }) => salon);
}
