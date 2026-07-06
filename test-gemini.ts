import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: "Find vivo scholarship details in json" }] }],
      config: { tools: [{ googleSearch: {} }] }
    });
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}
test();
