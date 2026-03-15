import { NextResponse } from "next/server";
import { analyzeSelfieWithGemini } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // When called from the SelfieUploader, we'll receive multipart/form-data with the image file.
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: "No image file found in request." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || "image/jpeg";

      const { suggestions } = await analyzeSelfieWithGemini(buffer, mimeType);

      return NextResponse.json({
        suggestions,
        selfie: {
          data: buffer.toString("base64"),
          mimeType,
        },
      });
    }

    return NextResponse.json(
      { error: "Image file is required." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in /api/analyze-selfie:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze selfie.",
        suggestions: [],
      },
      { status: 500 }
    );
  }
}
