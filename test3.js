const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hi",
      config: { tools: [{ googleSearch: {} }] }
    });
    console.log("2.0-flash success");
  } catch (e) { console.error("2.0-flash error:", e.message); }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hi",
      config: { tools: [{ googleSearch: {} }] }
    });
    console.log("3.5-flash success");
  } catch (e) { console.error("3.5-flash error:", e.message); }
}
test();
