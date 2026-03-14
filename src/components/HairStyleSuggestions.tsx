import type { HairstyleSuggestion } from "../lib/types";

type Props = {
  suggestions: HairstyleSuggestion[];
  onChoose: (hairstyle: string) => void;
};

export default function HairstyleSuggestions({ suggestions, onChoose }: Props) {
  if (suggestions.length === 0) {
    return (
      <p className="mt-8 text-sm text-gray-500">
        No suggestions available. Please upload a selfie to analyze.
      </p>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-2xl font-semibold">Suggested Hairstyles</h2>
      <div className="space-y-4">
        {suggestions.map((style) => (
          <div
            key={style.name}
            className="rounded-xl border p-4 shadow-sm cursor-pointer hover:bg-gray-100"
            onClick={() => onChoose(style.name)}
          >
            <h3 className="text-lg font-medium text-gray-800">{style.name}</h3>
            <p className="mt-1 text-sm text-gray-600">{style.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}