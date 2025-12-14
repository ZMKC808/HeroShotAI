
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ViralLayout, ToolMode } from "../types";

const getLayoutInstruction = (layout: ViralLayout): string => {
  switch (layout) {
    case ViralLayout.SPLIT:
      return "COMPOSITION: Split composition. Place the main subject/details on the LEFT 60% of the image. Keep the RIGHT 40% extremely clean, solid color, or blurred for text overlay.";
    case ViralLayout.DIAGONAL:
      return "COMPOSITION: Dynamic angle. Creates a sense of movement. Ensure the center area has a clear diagonal path for text.";
    case ViralLayout.BIG_TYPE:
      return "COMPOSITION: Background must be low-contrast and uncluttered to support massive typography overlay. Darken or lighten the center significantly.";
    default:
      return "COMPOSITION: Standard commercial layout. Leave empty space at top (30%) and bottom (20%) for text.";
  }
};

const buildPrompt = (
  activePrompt: string, 
  hasSubject: boolean, 
  mode: ToolMode,
  viralLayout: ViralLayout
): string => {
  const baseInstruction = mode === ToolMode.VIRAL_COVER 
    ? getLayoutInstruction(viralLayout)
    : "COMPOSITION RULES: The top 30% and bottom 20% of the image MUST be relatively empty (negative space).";

  return `
    Create a high-quality, 8k resolution image.
    
    VISUAL STYLE DESCRIPTION: 
    ${activePrompt}
    
    ${hasSubject ? "IMPORTANT: Integrate the provided subject image into this scene naturally as the main hero product." : ""}
    
    ${baseInstruction}
    
    AESTHETIC: Photorealistic, commercial photography, high-end studio lighting, trending on social media.
    NO TEXT: Do not generate any text inside the image itself.
  `.trim();
};

export const generateCoverImage = async (
  apiKey: string,
  promptParams: {
    activePrompt: string;
    aspectRatio: AspectRatio;
    subjectImage?: string | null;
    referenceImage?: string | null;
    toolMode: ToolMode;
    viralLayout: ViralLayout;
  }
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const { activePrompt, aspectRatio, subjectImage, referenceImage, toolMode, viralLayout } = promptParams;
  const prompt = buildPrompt(activePrompt, !!subjectImage, toolMode, viralLayout);
  const modelId = 'gemini-3-pro-image-preview'; 

  const config = {
    imageConfig: {
      aspectRatio: aspectRatio, 
    }
  };

  try {
    const parts: any[] = [];
    
    if (referenceImage) {
       const cleanRef = referenceImage.split(',')[1] || referenceImage;
       parts.push({
         inlineData: { data: cleanRef, mimeType: 'image/jpeg' }
       });
       parts.push({ text: "Follow the visual style, lighting, and color palette of this reference image." });
    }

    if (subjectImage) {
        const cleanSub = subjectImage.split(',')[1] || subjectImage;
        parts.push({
            inlineData: { data: cleanSub, mimeType: 'image/png' }
        });
        parts.push({ text: "Use this specific object/product in the generation. Keep its details accurate." });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated.");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const polishTitle = async (apiKey: string, currentTitle: string): Promise<string> => {
  if (!apiKey) return currentTitle;
  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-2.5-flash';
  const prompt = `
    You are a viral social media expert (Little Red Book/Douyin/TikTok).
    Rewrite the following product title to be more "clickbaity", emotional, and attractive to young audiences.
    Keep it under 10 words. Use emojis sparingly if appropriate.
    Make it punchy.
    
    Current Title: "${currentTitle}"
    
    Return ONLY the rewritten title string. No quotes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text?.trim() || currentTitle;
  } catch (e) {
    console.error("Polish error", e);
    return currentTitle;
  }
};

export interface EditResult {
  action: 'UPDATE_STYLE' | 'REGENERATE' | 'NONE';
  updates?: {
    textScale?: number;
    newPrompt?: string;
  };
}

export const interpretEditCommand = async (
  apiKey: string,
  command: string,
  currentPrompt: string,
  currentScale: number
): Promise<EditResult> => {
  if (!apiKey) return { action: 'NONE' };
  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-2.5-flash';
  
  const systemPrompt = `
    You are an AI assistant for a graphic design tool. The user wants to change the current design.
    
    Current State:
    - Image Prompt: "${currentPrompt}"
    - Text Scale: ${currentScale}

    User Command: "${command}"

    Determine if the user wants to:
    1. MODIFY TEXT SIZE: Return action 'UPDATE_STYLE'.
       - Return 'textScale' (e.g., "bigger" -> current * 1.2, "smaller" -> current * 0.8).
    2. MODIFY IMAGE CONTENT (Background, Objects, Vibe): Return action 'REGENERATE'.
       - Return 'newPrompt': A rewritten full prompt incorporating the user's change.
    
    Return strictly JSON.
    Example 1: {"action": "UPDATE_STYLE", "updates": {"textScale": 1.5}}
    Example 2: {"action": "REGENERATE", "updates": {"newPrompt": "white minimalist background with a coffee cup"}}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: systemPrompt,
      config: { responseMimeType: 'application/json' }
    });
    
    const text = response.text || "{}";
    return JSON.parse(text) as EditResult;
  } catch (e) {
    console.error("Interpreter failed", e);
    return { action: 'NONE' };
  }
}
