
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ThemeMode } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildPrompt = (activePrompt: string, hasSubject: boolean, themeMode: ThemeMode): string => {
  return `
    Create a high-quality, 8k resolution product advertising background.
    
    VISUAL DESCRIPTION: 
    ${activePrompt}
    
    BACKGROUND COLOR:
    ${themeMode === 'DARK' ? 'STRICTLY use a BLACK / Dark background.' : 'STRICTLY use a WHITE / Light high-key background.'}

    ${hasSubject ? "IMPORTANT: Integrate the provided subject image into this scene naturally as the main hero product." : ""}
    
    COMPOSITION RULES:
    1. LEAVE EMPTY SPACE: The top 30% and bottom 20% of the image MUST be relatively empty (negative space) or have very low detail. This is where text will be overlaid.
    2. AESTHETIC: Photorealistic, commercial photography, high-end studio lighting.
    3. NO TEXT: Do not generate any text inside the image itself.
  `.trim();
};

export const generateCoverImage = async (
  promptParams: {
    activePrompt: string;
    aspectRatio: AspectRatio;
    subjectImage?: string | null;
    referenceImage?: string | null;
    themeMode: ThemeMode;
  }
): Promise<string> => {
  const { activePrompt, aspectRatio, subjectImage, referenceImage, themeMode } = promptParams;
  const prompt = buildPrompt(activePrompt, !!subjectImage, themeMode);
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

export interface EditResult {
  action: 'UPDATE_STYLE' | 'REGENERATE' | 'NONE';
  updates?: {
    textScale?: number;
    textColor?: string;
    newPrompt?: string;
  };
}

export const interpretEditCommand = async (
  command: string,
  currentPrompt: string,
  currentScale: number
): Promise<EditResult> => {
  const modelId = 'gemini-2.5-flash';
  
  const systemPrompt = `
    You are an AI assistant for a graphic design tool. The user wants to change the current design.
    
    Current State:
    - Image Prompt: "${currentPrompt}"
    - Text Scale: ${currentScale}

    User Command: "${command}"

    Determine if the user wants to:
    1. MODIFY TEXT STYLE (Size, Color): Return action 'UPDATE_STYLE'.
       - For size: return 'textScale' (e.g., "bigger" -> current * 1.2, "smaller" -> current * 0.8).
       - For color: return 'textColor' as a HEX string (e.g., "#ff0000").
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
