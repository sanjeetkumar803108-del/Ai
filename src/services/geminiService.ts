import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const analyzeForm = async (imageBase64: string, mimeType: string) => {
  if (!ai) throw new Error("AI not initialized. Check your API key.");

  const prompt = `
    You are 'Form Mitra AI', an expert assistant for Indian government procedures.
    Analyze this photo of a form and provide a detailed guide in JSON format.
    
    Explanations must be in simple Hinglish (Hindi + English) as used in common conversation.
    
    Response MUST be a valid JSON object with this structure:
    {
      "formName": "Official name of the form",
      "summary": "Simple 1-line explanation in Hinglish of what this form is for",
      "fields": [
        {
          "field": "Name of the field in the form",
          "explanation": "Simple explanation in Hinglish of what to fill here",
          "isCritical": true/false,
          "commonMistake": "Mention a common mistake people make here in Hinglish"
        }
      ],
      "pitfalls": [
        "Major reason for rejection 1",
        "Major reason for rejection 2"
      ],
      "mitraTip": "A friendly advice from Mitra in Hinglish"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      }],
      config: {
        responseMimeType: "application/json"
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const getAIResponse = async (userMessage: string, chatHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = []) => {
  if (!ai) throw new Error("AI not initialized. Check your API key.");

  const systemInstruction = `
    You are 'Form Mitra AI', a helpful assistant for Indian citizens. 
    CURRENT DATE: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
    
    Your goal is to explain government schemes (like PM Kisan, Ayushman Bharat, etc.) 
    and provide guidance on filling out forms.
    
    RULES:
    1. Language: Use simple Hinglish (a mix of Hindi and simple English).
    2. Tone: Helpful, patient, and friendly.
    3. Keep it simple: Avoid complex bureaucratic jargon.
    4. Structured: Use bullet points for steps.
    5. Disclaimer: Always mention that users should verify details on the official government website.
    6. Specifics: If asked about a scheme, provide eligibility, benefits, and required documents.
    7. Web Access & Freshness: You have access to Google Search. ALWAYS use it if the user asks for the latest updates, dates, or new schemes. 
    8. Thinking: If the model provides a "thought" or "reasoning" part, ensure it is helpful to understand the logic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...chatHistory.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    // Extracting text and potentially thought from parts
    const text = response.text || "";
    // In some SDK versions, the reasoning might be in a different part or field.
    // We'll return the text for now but ensure we handle potential empty cases.
    if (!text && response.candidates?.[0]?.content?.parts) {
       const parts = response.candidates[0].content.parts;
       const thoughtPart = parts.find((p: any) => p.thought === true || p.text?.includes("<thought>"));
       const textPart = parts.find((p: any) => !p.thought && p.text);
       return { 
         text: textPart?.text || text || "Maafi chahta hoon, response generate nahi ho paya.", 
         thought: thoughtPart?.text || null 
       };
    }

    return { text, thought: null };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};
