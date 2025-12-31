import { GoogleGenAI, Type } from "@google/genai";
import { MathOperation, Language } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize safe client even if key is missing to avoid crash, but calls will fail gracefully
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface StoryResponse {
  text: string;
  primaryEmoji: string;
  secondaryEmoji?: string;
}

/**
 * Generates a short, playful context for a math problem with emojis.
 */
export const generateMathStory = async (
  op: MathOperation,
  a: number,
  b: number,
  result: number,
  lang: Language = 'zh-TW'
): Promise<StoryResponse> => {
  if (!ai) return getDefaultStory(op, a, b, lang);

  try {
    const langName = lang === 'zh-TW' ? "Traditional Chinese (Taiwan)" : "English";
    
    const prompt = `
      Create a very short (max 15 words), funny, whimsical sentence in ${langName} for a 9-year-old girl to visualize this math problem: ${a} ${getOpSymbol(op, lang)} ${b} = ${result}.
      
      Requirements:
      1. Use themes like unicorns, space, candy, or cute animals.
      2. Do not state the answer in the sentence, just set the scene.
      3. **Important**: Always place a relevant emoji immediately after the noun it represents (e.g., "3 cats 🐱").
      4. For division, mention sharing.
      5. Identify the "primaryEmoji" (representing the first number ${a}) and "secondaryEmoji" (representing the second number ${b}, if different).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            story: { type: Type.STRING },
            primaryEmoji: { type: Type.STRING },
            secondaryEmoji: { type: Type.STRING }
          },
          required: ['story', 'primaryEmoji']
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    
    return {
      text: json.story || getDefaultStory(op, a, b, lang).text,
      primaryEmoji: json.primaryEmoji || '⭐',
      secondaryEmoji: json.secondaryEmoji || '🌟'
    };
  } catch (error) {
    console.error("Gemini story generation failed", error);
    return getDefaultStory(op, a, b, lang);
  }
};

/**
 * Generates an encouraging message after a correct answer.
 */
export const generateEncouragement = async (streak: number, lang: Language = 'zh-TW'): Promise<string> => {
  const defaultMsg = lang === 'zh-TW' ? "你太棒了！繼續發光！✨" : "You are amazing! Keep shining! ✨";
  
  if (!ai) return defaultMsg;

  try {
    const langName = lang === 'zh-TW' ? "Traditional Chinese (Taiwan)" : "English";
    const prompt = `
      Give a super enthusiastic, short (max 10 words) compliment in ${langName} to a 9-year-old girl who just solved a math problem. 
      Her current winning streak is ${streak}. 
      Use emojis.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || defaultMsg;
  } catch (error) {
    return lang === 'zh-TW' ? "超級明星！🌟" : "Superstar! 🌟";
  }
};

const getOpSymbol = (op: MathOperation, lang: Language) => {
  const isZh = lang === 'zh-TW';
  switch (op) {
    case MathOperation.ADDITION: return isZh ? '加上' : 'plus';
    case MathOperation.SUBTRACTION: return isZh ? '減去' : 'minus';
    case MathOperation.MULTIPLICATION: return isZh ? '乘以' : 'times';
    case MathOperation.DIVISION: return isZh ? '除以' : 'divided by';
  }
};

const getDefaultStory = (op: MathOperation, a: number, b: number, lang: Language): StoryResponse => {
  const isZh = lang === 'zh-TW';
  
  switch (op) {
    case MathOperation.ADDITION: 
      return { 
        text: isZh ? `想像一下把 ${a} 顆星星 ⭐ 和 ${b} 顆愛心 💖 放在一起。` : `Imagine putting ${a} stars ⭐ and ${b} hearts 💖 together.`,
        primaryEmoji: '⭐', 
        secondaryEmoji: '💖' 
      };
    case MathOperation.SUBTRACTION: 
      return { 
        text: isZh ? `如果你有 ${a} 塊餅乾 🍪，吃掉了 ${b} 塊...` : `If you have ${a} cookies 🍪 and eat ${b} of them...`,
        primaryEmoji: '🍪', 
        secondaryEmoji: '🍪' 
      };
    case MathOperation.MULTIPLICATION: 
      return { 
        text: isZh ? `想像 ${a} 組，每組有 ${b} 隻可愛的小貓 🐱。` : `Imagine ${a} groups, with ${b} cute kittens 🐱 in each.`,
        primaryEmoji: '🐱', 
        secondaryEmoji: '🐱' 
      };
    case MathOperation.DIVISION: 
      return { 
        text: isZh ? `把 ${a} 顆糖果 🍬 平均分給 ${b} 個朋友 👶。` : `Share ${a} candies 🍬 equally among ${b} friends 👶.`,
        primaryEmoji: '🍬', 
        secondaryEmoji: '🍬' 
      };
  }
  return { text: isZh ? "讓我們來解決這個問題！" : "Let's solve this problem!", primaryEmoji: '✨', secondaryEmoji: '✨' };
};