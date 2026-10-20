"use server";

import { GoogleGenAI, Type, Schema } from "@google/genai";

// Initialize Google Gen AI client with your API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export interface GeneratedBlogMetadata {
  suggestedTitle: string;
  slug: string;
  metaDescription: string;
  summary: string;
  tags: string[];
}

export async function generateBlogMetadata(
  content: string,
): Promise<GeneratedBlogMetadata> {
  if (!content || content.trim().length < 20) {
    throw new Error(
      "Please provide more content (at least 20 characters) for the AI to analyze.",
    );
  }

  // Define JSON schema for structured response
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      suggestedTitle: {
        type: Type.STRING,
        description: "A catchy, SEO-optimized title for the blog post.",
      },
      slug: {
        type: Type.STRING,
        description:
          "A URL-friendly hyphenated slug based on the title (e.g. my-first-post).",
      },
      metaDescription: {
        type: Type.STRING,
        description:
          "A compelling meta description under 160 characters for search engines.",
      },
      summary: {
        type: Type.STRING,
        description: "A 2-3 sentence executive summary of the post.",
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 to 5 relevant topic tags for indexing.",
      },
    },
    required: ["suggestedTitle", "slug", "metaDescription", "summary", "tags"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Analyze the following blog draft content and auto-generate SEO metadata, tags, a title, a slug, and a summary:\n\n${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response received from Gemini AI.");
    }

    return JSON.parse(responseText) as GeneratedBlogMetadata;
  } catch (error) {
    console.error("Gemini Metadata Generation Error:", error);
    throw new Error("Failed to generate metadata using Gemini AI.");
  }
}
