import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mandi Cron Route
  app.get("/api/cron/mandi", async (req, res) => {
    try {
      const govt_api_key = process.env.GOVT_API_KEY;
      
      if (!govt_api_key) {
        return res.status(500).json({ error: "GOVT_API_KEY is not configured" });
      }

      console.log("Fetching live Mandi data for Bihar...");
      
      // Fetch Mandi data from GOVT API
      const mandateResponse = await axios.get(
        `https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24?api-key=${govt_api_key}&format=json&filters[state]=Bihar`
      );

      const mandiData = mandateResponse.data;
      
      if (!mandiData || !mandiData.records) {
        throw new Error("No Mandi data found in response");
      }

      // Generate message with Gemini
      const prompt = `You are Mitra, an Indian friend. Read this JSON of crop prices. Write a 2-line friendly WhatsApp morning greeting in Hinglish summarizing the top 2-3 crop prices. 

      Example Response Format:
      'Ram-Ram Bhai! Aaj Bihar ki mandi mein Aalu ₹1200 aur Pyaz ₹1500 quintal chal raha hai. Din shubh ho!'

      JSON DATA:
      ${JSON.stringify(mandiData.records.slice(0, 10))}
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-1.5-flash-8b",
        contents: [{ parts: [{ text: prompt }] }]
      });

      const messageText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!messageText) {
        throw new Error("Failed to generate Mandi message");
      }

      // Logic to find farmers with WhatsApp numbers
      // This is a placeholder for real Firestore logic which normally would be done 
      // by fetching from the "users" collection where occupation == 'Farmer' and whatsappNumber exists.
      // Since this is a demo environment, we'll log the "broadcast" intent.
      
      console.log("MANDI BROADCAST MESSAGE GENERATED:");
      console.log(messageText);

      res.json({
        status: "success",
        data: {
          message: messageText,
          timestamp: new Date().toISOString(),
          target: "Farmers with linked WhatsApp",
          raw_data_count: mandiData.records.length
        }
      });
    } catch (error: any) {
      console.error("Cron Job Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
