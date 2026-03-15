"use client";

import { useState, useEffect } from "react";

type Suggestion = {
  name: string;
  reason: string;
};

type Props = {
  onResults?: (payload: {
    suggestions: Suggestion[];
    imageUrl: string;
    selfieBase64: string;
    mimeType: string;
  }) => void;
};

export default function SelfieUploader({ onResults }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [chosenHairstyle, setChosenHairstyle] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setSuggestions([]);
      setChosenHairstyle(null);
    }
  };

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert("Please upload a selfie first.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/analyze-selfie", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setSuggestions(data.suggestions);
      if (previewUrl && data.suggestions && data.selfie?.data) {
        onResults?.({
          suggestions: data.suggestions,
          imageUrl: previewUrl,
          selfieBase64: data.selfie.data,
          mimeType: data.selfie.mimeType || "image/jpeg",
        });
      }
    } catch (error) {
      console.error("Error analyzing selfie:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChooseHairstyle = (hairstyle: string) => {
    setChosenHairstyle(hairstyle);
    alert(`You have chosen: ${hairstyle}`);
  };

  return (
    <section className="rounded-xl border p-6 shadow-sm">
      <h2 className="mb-2 text-2xl font-semibold">Upload Selfie</h2>
      <p className="mb-4 text-sm text-gray-600">
        Upload a clear front-facing photo. We&apos;ll send it to Gemini to
        analyze your face shape and suggest styles.
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4 block w-full text-sm text-gray-500"
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze Selfie"}
      </button>

      {previewUrl && (
        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="overflow-hidden rounded-xl border bg-slate-900/30">
            <img
              src={previewUrl}
              alt="Uploaded selfie preview"
              className="h-40 w-32 object-cover"
            />
          </div>
          <p className="text-xs text-gray-500">
            This is the image we&apos;ll use to preview your hairstyles.
          </p>
        </div>
      )}
    </section>
  );
}