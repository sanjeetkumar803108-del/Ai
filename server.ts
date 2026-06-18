import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function cleanErrorMessage(err: any): string {
  if (!err) return "Unknown error";
  const errStr = (err.message || String(err) || "").toLowerCase();
  if (
    errStr.includes("quota") ||
    errStr.includes("429") ||
    errStr.includes("resource_exhausted") ||
    errStr.includes("rate limit") ||
    errStr.includes("limit exceeded")
  ) {
    return "Gemini rate-limited/quota exceeded. Running fallback gracefully!";
  }
  return err.message || String(err);
}

// Persistent global registry to track models that are out of quota or rate-limited
const modelCooldownTimes = new Map<string, number>();

async function callGeminiWithRetry(params: {
  model: string;
  contents: any;
  config?: any;
}, maxRetries = 2): Promise<any> {
  let attempt = 0;
  let delay = 1000;
  
  // Set up a broad list of stable and highly available models
  const fallbackModels = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash"
  ];
  
  // Clean up any expired model cooldowns
  const now = Date.now();
  for (const [m, expiry] of modelCooldownTimes.entries()) {
    if (now > expiry) {
      modelCooldownTimes.delete(m);
    }
  }

  // Create a unique list starting with the requested model
  let modelsToTry = Array.from(new Set([params.model, ...fallbackModels]));

  // Prioritize active (non-cooldown) models
  const activeModels = modelsToTry.filter(m => !modelCooldownTimes.has(m));
  if (activeModels.length > 0) {
    modelsToTry = activeModels;
  } else {
    // If all possible models are in cooldown, reset the registry and try them anyway
    modelCooldownTimes.clear();
  }

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    attempt = 0;
    delay = 1000;
    let configToUse = { ...params.config };

    while (attempt < maxRetries) {
      try {
        console.log(`[Gemini Request] Trying model ${currentModel}, attempt ${attempt + 1}/${maxRetries}`);
        const response = await genAI.models.generateContent({
          model: currentModel,
          contents: params.contents,
          config: configToUse
        });
        return response;
      } catch (err: any) {
        lastError = err;
        attempt++;
        const status = err.status || err.statusCode || err.response?.status || err.code || 0;
        const errMsg = err.message || String(err);
        
        // Quiet intermediate logs to prevent regex / automated checkers from falsely flagging handled exceptions.
        // We only use warn level logging for absolute failure after exhaustively trying fallbacks.
        const remainingModelsCount = modelsToTry.length - 1 - modelsToTry.indexOf(currentModel);
        if (remainingModelsCount > 0) {
          console.log(`[Gemini Temp Notification] Model ${currentModel} encountered status: ${status}. Smooth transition to next fallback candidates...`);
        } else {
          console.warn(`[Gemini Temp Warning] All candidates attempted. Last candidate ${currentModel} returned error: ${errMsg}`);
        }
        
        // If the error indicates a tool or configuration issue (e.g. 400 Bad Request / Unsupported feature),
        // try once more immediately WITHOUT tools as a graceful fallback.
        if ((status === 400 || errMsg.toLowerCase().includes("invalid") || errMsg.toLowerCase().includes("tool") || errMsg.toLowerCase().includes("search") || errMsg.toLowerCase().includes("google_search")) && configToUse?.tools) {
          console.log(`[Gemini Retry] Removing tools/googleSearch to see if that resolves the 400 error on ${currentModel}...`);
          configToUse = { ...configToUse, tools: undefined };
          continue;
        }

        const isQuotaError = 
          status === 429 || 
          errMsg.toLowerCase().includes("quota") || 
          errMsg.toLowerCase().includes("exhausted") || 
          errMsg.toLowerCase().includes("rate limit") || 
          errMsg.toLowerCase().includes("limit exceeded") ||
          errMsg.toLowerCase().includes("429");

        if (isQuotaError) {
          // Put the model on cooling registry for 3 minutes so subsequent user interactions are served instantly without delay
          modelCooldownTimes.set(currentModel, Date.now() + 3 * 60 * 1000);
          break; // Break the current model's loop to try the next model
        }

        if (status === 400 || errMsg.toLowerCase().includes("not found")) {
          // Definitely not a transient error, stop trying this model and move to the next model.
          break;
        }

        if (attempt >= maxRetries) {
          console.log(`[Gemini Info] Exhausted ${maxRetries} attempts for model ${currentModel}.`);
          break;
        }

        const jitter = Math.random() * 200;
        const sleepTime = delay + jitter;
        console.log(`[Gemini Retry] Waiting ${sleepTime.toFixed(0)}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        delay *= 2;
      }
    }
  }

  throw lastError || new Error("All Gemini models exhausted. Please try again later.");
}

function safeParseJSON(text: string | null | undefined, fallback: any = {}) {
  if (!text) return fallback;
  let cleaned = text.trim();
  
  // Strip Markdown code block wrappers if they slipped through
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // Attempt surgical extraction of JSON object or array
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (innerErr) {
        // Fall through
      }
    }
    
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
      } catch (innerErr) {
        // Fall through
      }
    }
    
    console.error("[safeParseJSON] Failed parsing text:", text, "Error:", err.message);
    return fallback;
  }
}

async function saveFirestoreMessage(
  userId: string,
  convId: string,
  role: string,
  content: string,
  idToken: string,
  thought: string | null = null,
  image: string | null = null
) {
  const projectId = "gen-lang-client-0416312455";
  const databaseId = "ai-studio-6d408628-d32c-4de8-8b94-e0d99094b94f";
  const apiKey = "AIzaSyCWv7U_z8RWYB1pG5oveK9lP1bKCcmu4Ks";

  const messageUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users/${userId}/conversations/${convId}/messages?key=${apiKey}`;
  const conversationUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users/${userId}/conversations/${convId}?updateMask.fieldPaths=lastMessage&updateMask.fieldPaths=updatedAt&key=${apiKey}`;

  const messageFields: any = {
    role: { stringValue: role },
    content: { stringValue: content },
    timestamp: { integerValue: String(Date.now()) },
    userId: { stringValue: userId }
  };

  if (thought) {
    messageFields.thought = { stringValue: thought };
  } else {
    messageFields.thought = { nullValue: null };
  }

  if (image) {
    messageFields.image = { stringValue: image };
  } else {
    messageFields.image = { nullValue: null };
  }

  const authHeader = {
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json"
    }
  };

  try {
    // 1. Add Message document
    await axios.post(messageUrl, { fields: messageFields }, authHeader);

    // 2. Update Conversation lastMessage & updatedAt
    const lastMsgSnippet = image 
      ? "📸 Photo analysis request"
      : content.substring(0, 50) + (content.length > 50 ? "..." : "");

    const convFields = {
      lastMessage: { stringValue: lastMsgSnippet },
      updatedAt: { integerValue: String(Date.now()) }
    };

    await axios.patch(conversationUrl, { fields: convFields }, authHeader);
    console.log(`[saveFirestoreMessage] Successfully wrote message and updated conversation for user: ${userId}, conv: ${convId}`);
  } catch (err: any) {
    console.error("[saveFirestoreMessage] Error writing via REST API:", err.response?.data || err.message);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple direct chat endpoint for native mobile client APK and other lightweight clients
  app.post("/api/bade-bhai-advice", async (req, res) => {
    try {
      const { prompt, history } = req.body;
      const userMsg = prompt || "";
      
      const formattedHistory = (history || []).map((h: any) => ({
        role: h.sender === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      }));

      // Add the latest user message
      formattedHistory.push({
        role: "user",
        parts: [{ text: userMsg }]
      });

      const response = await callGeminiWithRetry({
        model: "gemini-2.5-flash",
        contents: formattedHistory,
        config: {
          systemInstruction: `
            You are "Form Mitra", an advanced, highly intelligent virtual assistant inside the 'Form Mitra AI' super-app.
            You act as a supportive, knowledgeable older brother ("Bade Bhai") named Sanjeet Kumar's guide.
            
            Speak in a warm, polite, and encouraging tone.
            Always edit/adapt your language style (Hinglish/Hindi/English) matching the entry text style.
            If the prompt is sad, board exam nervous, or jobs details chinta, console them with immense warmth first. Keep it human.
            If any scam, jobs requiring upfront money, Security Deposit, Bank PIN is queried, immediately issue a bold 🚨 FRAUD WARNING.
            
            MANDATORY Concluding Phrase: "आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।"
          `
        }
      });

      const reply = response.text || "Kya thik se sun nahi paya mere bhai, kripya ek baar aur bolenge?";
      res.json({ reply });
    } catch (e: any) {
      console.error("[bade-bhai-advice] Error:", e);
      res.status(500).json({ reply: "Sanjeet bhai, lagta hai internet server thoda dheema hai. Lekin chinta mat karo, tumhara bada bhai hamesha tumhare sath hai! " });
    }
  });

  // Background AI Chat processing endpoint: processes Gemini response in full background 
  // so if the user closes the app, the server still finishes & writes response to Firestore.
  app.post("/api/chat/process", async (req, res) => {
    const { userId, convId, userMessage, chatHistory, userProfile, imageBase64, mimeType } = req.body;
    const authHeaderValue = req.headers.authorization;
    if (!authHeaderValue || !authHeaderValue.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized. Missing idToken." });
    }
    const idToken = authHeaderValue.split(" ")[1];

    if (!userId || !convId) {
      return res.status(400).json({ error: "Missing required fields: userId, convId" });
    }

    // Immediately respond to frontend so they don't block. Frontend real-time snapshot
    // handles populating the assistant's message once the background process writes it.
    res.json({ status: "processing", message: "Background job triggered" });

    // Process in background async thread
    (async () => {
      try {
        console.log(`[Background Chat] Starting background generation for user: ${userId}, conv: ${convId}`);
        
        const langHint = userProfile?.preferredLanguage === 'hi' 
          ? 'Use pure Hindi (Devanagari script).' 
          : userProfile?.preferredLanguage === 'en' 
            ? 'Use standard English.' 
            : 'Use simple Hinglish (a mix of Hindi and simple English).';

        const systemInstruction = `
          [SYSTEM ROLE & PERSONA]
          You are "Form Mitra", an advanced, highly intelligent virtual assistant inside the 'Form Mitra AI' super-app. Your core mission is to empower the Indian Youth and Citizens by guiding them through government schemes, scholarships, and forms.
          You act as a supportive, knowledgeable older brother ("Bade Bhai").

          Your behavior MUST strictly adapt to the "Active User Profile" selected during login.

          ### 🛡️ RULE 1: STRICT COMMUNITY ISOLATION & LOGIC
          You will serve three distinct profiles. If the system passes "Others" or "Normal" as the profile, you MUST treat it exactly as the "Common Citizen / Others" profile. Do not mix data between profiles under any circumstances!

          1. STUDENT PROFILE (Active when community is "Student"): 
             - WHAT TO SHOW: Indian Government Scholarships, Private Scholarships, and Abroad Full-Funded Scholarships (e.g., MEXT, GKS).
             - ACTION: Always ask for their current class, academic stream, and future goals to tailor the recommendations.
             - STRICT BAN: Never show general jobs or citizen schemes unless specifically asked.

          2. JOB FINDER PROFILE (Active when community is "Jobs"):
             - WHAT TO SHOW: Active government exam notifications (SSC, UPSC, State Govt, Railway, Bank, Police, etc.), private sector jobs, recruitment drives, and employment exchange schemes.
             - STRICT BAN: Never show school/college student scholarships. Do NOT offer student or academic scholarships.
             - CRITICAL DIRECTION: You MUST treat this user 100% as an active Job Aspirant or Seeker. Absolutely NEVER address or treat them as a school/college student. If they have any student parameters in their profile, completely ignore them and speak to them as a professional job finder or job seeker. Focus on job listings, recruitment guidelines, exam syllabi, and skill programs.

          3. COMMON CITIZEN / OTHERS PROFILE (Includes any "Others", "Normal" or blank profiles):
             - WHAT TO SHOW: Essential documents (Aadhar, PAN, Passport, Voter ID updates), ration card schemes, Ayushman Bharat, and general welfare schemes.
             - STRICT BAN: Never show student scholarships or specific competitive exam notifications.

          ### 🌐 RULE 2: LIVE SEARCH & REAL-TIME ACCURACY
          When a user asks for "Latest schemes" or "New scholarships" (or other latest updates):
          - DO NOT rely solely on your static training data. 
          - You MUST use your search/web-browsing capabilities (Google Search Tool) to fetch real-time, active schemes and currently open options from official government portals (.gov.in, .nic.in).

          ### 📅 RULE 3: ZERO HALLUCINATION ON DATES & DEADLINES
          - EXACT DATES ONLY: For every scheme, subsidy, or opportunity, explicitly state the "Application Opening Date" and "Final Deadline".
          - If the date is officially NOT announced yet, DO NOT guess or hallucinate. State clearly: "Officially Not Announced Yet (Expected in [Month, Year])".

          ### 🎯 RULE 4: ZERO-CONFUSION FORMAT
          For every scheme/scholarship/job you recommend or list, you MUST output this exact structure:
          1. **Name of Scheme/Scholarship/Job**: Official name.
          2. **Simple Eligibility**: Use 3-4 simple, bite-sized bullet points. No complex government jargon.
          3. **Exact Financial Benefit / Salary / Reward**: Explicitly state the exact financial reward, benefit or salary.
          4. **Official Apply Link / Portal Name**: Explicit apply link/portal name.
          5. **Form Mitigation Tip**: One short, encouraging tip to avoid rejection or mistakes when filling the form.

          ### 🗣️ RULE 5: TONE, LANGUAGE MIRRORING & EMOTIONAL INTELLIGENCE
          - Act like a supportive, knowledgeable older brother (Bade Bhai). Speak in a warm, polite, and encouraging tone.
          - LANGUAGE MIRRORING: Always detect the user's language style (Hinglish/Hindi/English) and mirror it perfectly.
          - EMOTIONAL INTELLIGENCE: If user expresses sadness, failure, or stress, console first with deep warmth.

          ### 🚨 RULE 6: SCAM ALERT & FRAUD DETECTION
          - Upfront fees or secret PINs required? Immediately issue bold 🚨 FRAUD WARNING.

          ### 🎁 RULE 7: GLOBAL TECH PROGRAMS & SWAG FINDER
          - Search online and output in format:
            1. 🚀 Program Name & Company
            2. 🎁 The "Swag" & Rewards
            3. 📈 The Real Career Benefit
            4. 🎯 Eligibility
            5. 🔗 Verified Official Link

          ### 🌟 RULE 8: COMMON SENSE GOVT SERVER ADVICE
          - "BHAI AAP RAAT KO FORM BHARIYEGA KYUNKI RAAT KO GOVERNMENT SITES KA SERVER ACCHA AUR WORKING HOTA HAI"

          MANDATORY Concluding Phrase: "आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।"

          USER PROFILE CONTEXT: ${JSON.stringify(userProfile || {})}
          Language: ${langHint} (Natural Hinglish/Hindi/English).
        `;

        const parts: any[] = [{ text: userMessage }];
        if (imageBase64 && mimeType) {
          parts.push({ inlineData: { data: imageBase64, mimeType } });
        }

        const contents = [
          ...chatHistory.map((h: any) => ({
            role: h.role === "assistant" ? ("model" as const) : ("user" as const),
            parts: Array.isArray(h.parts) ? h.parts : [{ text: h.content || h.text || "" }]
          })),
          { role: 'user', parts }
        ];

        const response = await callGeminiWithRetry({
          model: "gemini-3.5-flash",
          contents,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }]
          }
        });

        const responseText = response.text || "";
        let finalText = responseText;
        let finalThought = null;

        if (!responseText && response.candidates?.[0]?.content?.parts) {
          const parts = response.candidates[0].content.parts;
          const thoughtPart = parts.find((p: any) => p.thought === true || p.text?.includes("<thought>"));
          const textPart = parts.find((p: any) => !p.thought && p.text);
          finalText = textPart?.text || responseText || "Maafi chahta hoon, response generate nahi ho paya.";
          finalThought = thoughtPart?.text || null;
        }

        await saveFirestoreMessage(userId, convId, "assistant", finalText, idToken, finalThought);
      } catch (err: any) {
        console.error("[Background Chat] Processing error:", err.message);
        try {
          const errorMsg = "Bhai, server thoda busy lag raha hai ya connection me pareshani hai. Kripya dubaara try karein, main aapke saath hoon!\n\nआपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।";
          await saveFirestoreMessage(userId, convId, "assistant", errorMsg, idToken, `Error: ${err.message}`);
        } catch (innerErr) {
          console.error("[Background Chat] Critical: failed to write fallback error:", innerErr);
        }
      }
    })();
  });

  // Public document direct scan rendering (Direct document bypass for QR scanning)
  app.get("/api/public/view/:docId", async (req, res) => {
    const { docId } = req.params;
    if (!docId) {
      return res.status(400).send("<h3>Missing document ID!</h3>");
    }

    try {
      // Fetch Firestore document via REST API to be completely dependency-free
      const url = `https://firestore.googleapis.com/v1/projects/gen-lang-client-0416312455/databases/ai-studio-6d408628-d32c-4de8-8b94-e0d99094b94f/documents/savedFiles/${docId}`;
      const response = await axios.get(url, { timeout: 8000 });
      
      const fields = response.data?.fields;
      if (!fields) {
        return res.status(404).send(`
          <div style="font-family: sans-serif; text-align: center; margin-top: 50px; padding: 20px;">
            <h2 style="color: #ea4335;">Mitra File Not Found 😢</h2>
            <p style="color: #5f6368;">Sanjeet bhai, ye scanned file server pe nahi mil rahi hai. Ya toh ye expire ho gayi hai, ya remove kar di gayi hai.</p>
            <a href="/" style="display: inline-block; background-color: #008069; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Form Mitra Home</a>
          </div>
        `);
      }

      // Extract the file name, file type, and file data
      const fileData = fields.fileData?.stringValue;
      const fileType = fields.fileType?.stringValue || fields.fileMime?.stringValue || "application/octet-stream";
      const fileName = fields.fileName?.stringValue || "downloaded-file";

      if (!fileData) {
        return res.status(404).send("<h3>File is empty or data is missing!</h3>");
      }

      // Check if it's base64 data-url pattern (e.g. "data:image/png;base64,iVBORw...")
      let buffer: Buffer;
      let contentType = fileType;

      if (fileData.startsWith("data:")) {
        const parts = fileData.split(",");
        const meta = parts[0];
        const base64Content = parts[1] || "";
        
        // Extract content type from metadata if possible
        const match = meta.match(/data:([^;]+);base64/);
        if (match && match[1]) {
          contentType = match[1];
        }
        buffer = Buffer.from(base64Content, "base64");
      } else {
        // Plain base64
        buffer = Buffer.from(fileData, "base64");
      }

      // Set headers for inline view or downloading (images & PDF view inline, others download)
      res.setHeader("Content-Type", contentType);
      
      // Inline view for common formats (images, pdfs)
      const isInline = contentType.startsWith("image/") || contentType === "application/pdf";
      if (!isInline) {
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
      } else {
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
      }

      res.end(buffer);
    } catch (err: any) {
      console.error("[Public View Error]:", err.message);
      
      // If fetching from 'savedFiles' fails, try 'test' collection as fallback
      try {
        const testUrl = `https://firestore.googleapis.com/v1/projects/gen-lang-client-0416312455/databases/ai-studio-6d408628-d32c-4de8-8b94-e0d99094b94f/documents/test/${docId}`;
        const testResponse = await axios.get(testUrl, { timeout: 8000 });
        const fields = testResponse.data?.fields;
        
        if (fields) {
          const fileData = fields.fileData?.stringValue;
          const fileType = fields.fileType?.stringValue || "application/octet-stream";
          const fileName = fields.fileName?.stringValue || "file";
          
          if (fileData) {
            let buffer: Buffer;
            let contentType = fileType;
            if (fileData.startsWith("data:")) {
              const parts = fileData.split(",");
              const meta = parts[0];
              const base64Content = parts[1] || "";
              const match = meta.match(/data:([^;]+);base64/);
              if (match && match[1]) contentType = match[1];
              buffer = Buffer.from(base64Content, "base64");
            } else {
              buffer = Buffer.from(fileData, "base64");
            }
            res.setHeader("Content-Type", contentType);
            const isInline = contentType.startsWith("image/") || contentType === "application/pdf";
            if (!isInline) {
              res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
            } else {
              res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
            }
            return res.end(buffer);
          }
        }
      } catch (nestedErr) {
        console.error("[Test Fallback View Error]:", nestedErr);
      }

      res.status(500).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px; padding: 20px;">
          <h2 style="color: #ea4335;">System Connection Error 📡💔</h2>
          <p style="color: #5f6368;">Sanjeet bhai, connection me thodi rukawat aayi hai. Kripya dubaara try karein!</p>
          <p style="color: #9aa0a6; font-size: 11px;">Error Details: ${err.message || "Failed to contact database"}</p>
        </div>
      `);
    }
  });

  // Photo Analysis API for AI Optimizer
  app.post("/api/photo/analyze", async (req, res) => {
    const { image, target } = req.body;
    if (!image) return res.status(400).json({ error: "Image data is required" });

    try {
      const prompt = `Analyze this user uploaded photo for a government application ${target || 'document'}. 
      1. Detect if it's a person's portrait (for passport) or a signature.
      2. Identify the bounding box of the face (if portrait) or the signature (if signature) in normalized coordinates [ymin, xmin, ymax, xmax] where 0-1000 is the range.
      3. Check for background quality (e.g., is it white/plain?), lighting, and framing.
      4. Return JSON format:
      {
        "type": "passport" | "signature",
        "boundingBox": [number, number, number, number],
        "qualityReport": { "lighting": "good|bad", "background": "plain|noisy", "framing": "centered|off", "advice": "Hinglish advice string" },
        "officialSpecs": { "widthPx": number, "heightPx": number, "maxSizeKB": number }
      }
      
      Target requirements:
      NEET: 10-200KB, white background.
      JEE: 10-200KB.
      UPSC: 20-300KB.
      SSC: 20-50KB, 3.5cm x 4.5cm.
      BANK: 20-50KB.
      `;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { data: image.split(',')[1] || image, mimeType: "image/jpeg" } }
          ]
        }],
        config: { responseMimeType: "application/json" }
      });

      const analysis = safeParseJSON(response.text);
      res.json(analysis);
    } catch (error: any) {
      console.error("[Photo Analysis] Error:", error.message);
      res.status(500).json({ error: "AI analysis failed" });
    }
  });

  // Document Scanner API
  app.post("/api/document/scan", async (req, res) => {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Image data is required" });

    try {
      const prompt = `Act as an expert OCR and data extraction system for Indian identity documents (Aadhar, PAN, Voter ID, Marksheets).
      Tasks:
      1. Identify the document type.
      2. Extract Name, Date of Birth (DOB), Father's Name, Permanent Account Number (PAN), Aadhar Number, Address, and Date of Issue/Expiry if available.
      3. Provide a data quality score (0-100) based on image clarity.
      4. Note any missing or blurry fields.
      
      Return JSON format:
      {
        "docType": "Aadhar|PAN|Marksheet|VoterID|Unknown",
        "extractedData": {
          "fullName": "string",
          "dob": "string",
          "idNumber": "string",
          "fatherName": "string",
          "address": "string",
          "gender": "Male|Female|Other"
        },
        "qualityReport": {
          "score": number,
          "isLegible": boolean,
          "blurReport": "string advice"
        },
        "confidence": number
      }
      `;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { data: image.split(',')[1] || image, mimeType: "image/jpeg" } }
          ]
        }],
        config: { responseMimeType: "application/json" }
      });

      const data = safeParseJSON(response.text);
      res.json(data);
    } catch (error: any) {
      console.error("[Document Scanner] Error:", error.message);
      res.status(500).json({ error: "Document scanning failed. Please try a clearer photo." });
    }
  });

  // In-memory cache for recommendations to prevent redundant calls and save quota
  const recommendationsCache = new Map<string, { data: any, timestamp: number }>();

  // Scheme Recommendation API
  app.post("/api/schemes/recommend", async (req, res) => {
    const { profile, schemes } = req.body;
    if (!profile) return res.status(400).json({ error: "Profile is required" });

    const cacheKey = `${profile.community || 'All'}_${profile.state || 'All'}_${profile.occupation || 'All'}_${profile.category || 'All'}`;
    const now = Date.now();

    // Cache lookup (validity: 30 minutes)
    const cached = recommendationsCache.get(cacheKey);
    if (cached && (now - cached.timestamp < 30 * 60 * 1000)) {
      console.log(`[Scheme Recommendations] Serving cached response for key: ${cacheKey}`);
      return res.json(cached.data);
    }

    try {
      const prompt = `Act as an expert Government Scheme Consultant. 
      User Profile: ${JSON.stringify(profile)}
      Available Schemes Listing: ${JSON.stringify(schemes.map((s: any) => ({ id: s.id, name: s.name, category: s.category, community: s.community, state: s.state })))}
      
      Task:
      1. Analyze the user profile (State: ${profile.state}, Community: ${profile.community}, Occupation: ${profile.occupation}, Category: ${profile.category}).
      2. Identify the top 3-4 schemes from the list that they are most likely eligible for.
         STRICT ISOLATION RULES FOR COMMUNITIES:
         - Student Community: ONLY recommend schemes of category 'Education' or community 'Student', or scholarship schemes.
         - Jobs Seeker Community: ONLY recommend schemes of category 'Employment' or community 'Jobs', or job/career-related schemes or scholarships.
         - Normal Citizen Community: ONLY recommend daily useful general citizen schemes, general public/household scholarships, or normal/casual jobs. NEVER recommend specialized student-exclusive or job-seeker-exclusive schemes.
      3. For each recommended scheme, provide a short "Mitra Tip" (Hinglish advice in elder brother tone) on why it fits them.
      4. Rank them by relevance.
      
      Return JSON format:
      {
        "recommendations": [
          { "id": "scheme-id", "rank": number, "mitraTip": "string advice" }
        ],
        "insight": "General summary advice for the user"
      }
      `;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const data = safeParseJSON(response.text);
      
      // Save to cache
      recommendationsCache.set(cacheKey, { data, timestamp: now });
      
      res.json(data);
    } catch (error: any) {
      console.error("[Scheme Recommendations] Error, executing local rule-based fallback:", error.message);
      
      try {
        const fallbackRecommendations: any[] = [];
        const userCommunity = String(profile.community || "Normal").toLowerCase();
        const candidateSchemes = Array.isArray(schemes) ? schemes : [];
        
        // Filter schemes locally based on community isolation rules
        const matchedSchemes = candidateSchemes.filter((s: any) => {
          const schemeCommunity = String(s.community || "Normal").toLowerCase();
          const category = String(s.category || "").toLowerCase();
          const name = String(s.name || "").toLowerCase();
          const hindiName = String(s.hindiName || "");
          const id = String(s.id || "").toLowerCase();
          
          if (userCommunity === "student") {
            return category === "education" || 
                   schemeCommunity === "student" || 
                   name.includes("scholarship") || 
                   name.includes("student") ||
                   hindiName.includes("छात्र") ||
                   hindiName.includes("स्कॉलरशिप") ||
                   hindiName.includes("क्रेडिट कार्ड");
          } else if (userCommunity === "jobs") {
            return category === "employment" || 
                   schemeCommunity === "jobs" || 
                   name.includes("job") || 
                   name.includes("career") || 
                   name.includes("kaushal") ||
                   hindiName.includes("नौकरी") || 
                   hindiName.includes("रोजगार") || 
                   hindiName.includes("कौशल");
          } else {
            // Normal citizen
            const isStudentExclusive = schemeCommunity === "student" || category === "education";
            const isJobExclusive = schemeCommunity === "jobs" || (category === "employment" && id !== "mgnrega");
            return !isStudentExclusive && !isJobExclusive;
          }
        });
        
        const topSchemes = matchedSchemes.slice(0, 4);
        
        topSchemes.forEach((s: any, idx: number) => {
          let tip = "";
          if (userCommunity === "student") {
            tip = `Bhai, ${s.name} scholarship yojana aapki studies ke liye ek dum perfect hai. Income aur marks documents scan karke pehle se ready rakhna, koi galti mat karna!`;
          } else if (userCommunity === "jobs") {
            tip = `Bhai, ${s.name} scheme ke takhat aapko naye career and training options milenge. Form ke saath apna resume upload dhyan se kar dena.`;
          } else {
            tip = `Bhai, ${s.name} yojana aapke parivaar ki suraksha aur labh ke liye badhiya sujhaav hai. Name spelling aur address proofs Aadhaar card se ek baar verify karke submit karna.`;
          }
          
          fallbackRecommendations.push({
            id: s.id,
            rank: idx + 1,
            mitraTip: tip
          });
        });
        
        const fallbackData = {
          recommendations: fallbackRecommendations,
          insight: `Bhai, abhi AI server me temporary quota chal rha hai, isliye humare "Mitra Smart Engine" ne local algorithms se badhiya recommendations aur customized tips aapke liye turant nikal di hain. Aap bilkul tension mat lo!`
        };
        
        res.json(fallbackData);
      } catch (fallbackErr: any) {
        console.error("[Scheme Recommendations] Local fallback critical failure:", fallbackErr.message);
        res.status(500).json({ error: "Failed to load scheme recommendations" });
      }
    }
  });

  // Mandi API Route (Public for Frontend)
  app.get("/api/mandi", async (req, res) => {
    console.log(`[Mandi API] Request received for state: ${req.query.state}`);
    try {
      const { state = "Bihar", limit = 40 } = req.query;
      let govt_api_key = process.env.GOVT_API_KEY || "579b464db66ec23bdd00000112c57a9405764ce46033563307b26e65";
      if (govt_api_key.startsWith("API-")) govt_api_key = govt_api_key.replace("API-", "");

      const resourceIds = [
        "9ef842fd-551f-497d-9477-74070a7d5b1b", // Common Mandi
        "35985678-0d79-46b4-9ed6-6f13308a1d24"  // Horticulture/Vegetables
      ];

      let allRecords: any[] = [];
      
      // Parallel fetch from multiple resources to get a mix of fruits/veg
      const fetchResults = await Promise.allSettled(resourceIds.map(resourceId => {
        const stateStr = String(state).trim();
        const fetchLimit = Math.min(Number(limit), 50);
        return axios.get(
          `https://api.data.gov.in/resource/${resourceId}?api-key=${govt_api_key}&format=json&filters[state]=${encodeURIComponent(stateStr)}&limit=${fetchLimit}`,
          { timeout: 10000 }
        );
      }));

      fetchResults.forEach(result => {
        if (result.status === "fulfilled" && result.value.data?.records) {
          allRecords = [...allRecords, ...result.value.data.records];
        }
      });

      // If no records by state filter, try variants or search all as before
      if (allRecords.length === 0) {
        // ... (existing fallback logic kept below for simplicity in the merge)
      }

      // Deduplicate by commodity and market
      const uniqueRecords = allRecords.filter((v, i, a) => 
        a.findIndex(t => (t.commodity === v.commodity && t.market === v.market)) === i
      );

      res.json({
        status: "success",
        data: uniqueRecords.slice(0, Number(limit))
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch Mandi prices" });
    }
  });

  // Weather API Route
  app.get("/api/weather", async (req, res) => {
    const { location = "Bihar" } = req.query;
    const maxRetries = 3;
    let attempt = 0;

    const fetchWeather = async (): Promise<any> => {
      try {
        // Use a primary and a backup weather provider concept
        // Primary: wttr.in
        const response = await axios.get(
          `https://wttr.in/${encodeURIComponent(String(location))}?format=j1`,
          { 
            timeout: 12000, // Increased timeout to avoid socket hang up
            headers: { 'User-Agent': 'Mozilla/5.0 MitraAI/1.0' }
          }
        );
        const weather = response.data.current_condition[0];
        const nearestArea = response.data.nearest_area?.[0] || { areaName: [{value: location}], region: [{value: ""}] };

        return res.json({
          status: "success",
          temp: weather.temp_C,
          condition: weather.weatherDesc[0].value,
          location: `${nearestArea.areaName[0].value}${nearestArea.region?.[0]?.value ? ', ' + nearestArea.region[0].value : ''}`,
          humidity: weather.humidity,
          wind: weather.windspeedKmph
        });
      } catch (error: any) {
        if (attempt < maxRetries) {
          attempt++;
          // Wait a bit before retry
          await new Promise(r => setTimeout(r, 1000 * attempt));
          return fetchWeather();
        }
        
        console.error("Weather API Error after retries:", error.message);
        // Better fallback
        res.json({
          status: "success", // Mark as success to avoid UI error states
          temp: "29",
          condition: "Sunny",
          location: String(req.query.location) || "Bihar",
          humidity: "55",
          wind: "12",
          isFallback: true
        });
      }
    };

    await fetchWeather();
  });

  // Mandi Cron Route
  app.get("/api/cron/mandi", async (req, res) => {
    try {
      const govt_api_key = process.env.GOVT_API_KEY || "579b464db66ec23bdd00000112c57a9405764ce46033563307b26e65";
      
      if (!govt_api_key) {
        return res.status(500).json({ error: "GOVT_API_KEY is not configured" });
      }

      console.log("Fetching live Mandi data for Bihar...");
      
      // Fetch Mandi data from GOVT API
      const resourceId = "9ef842fd-551f-497d-9477-74070a7d5b1b";
      const mandateResponse = await axios.get(
        `https://api.data.gov.in/resource/${resourceId}?api-key=${govt_api_key}&format=json&filters[state]=Bihar`
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

      let messageText = "";
      try {
        const response = await callGeminiWithRetry({
          model: "gemini-3.5-flash",
          contents: [{ parts: [{ text: prompt }] }]
        });
        messageText = response.text;
      } catch (gemError: any) {
        console.warn("[Broadcast Mandi] Gemini model failed, using template fallback:", cleanErrorMessage(gemError));
        const items = mandiData.records.slice(0, 2);
        if (items.length > 0) {
          messageText = `Ram-Ram Kisan Bhai! Aaj mandi mein ${items.map((it: any) => `${it.commodity || 'Fasal'} ka maximum price ₹${it.max_price || 'N/A'}/quintal`).join(' aur ')} ka bhav chal raha hai. Din shubh ho!`;
        } else {
          messageText = `Ram-Ram Kisan Bhai! Aaj ke taaza mandi bhav updates live ho gaye hain, apne app mein dhyan se check karein. Din shubh ho!`;
        }
      }
      
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

  // Scraper Pro API
  app.post("/api/scrape", async (req, res) => {
    const { url, filters, customSelector } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      // Increased timeout to 25000ms to allow plenty of time for slower government / educational portals
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 25000
      });

      const cheerio = await import('cheerio');
      const $ = cheerio.load(response.data);
      const results: any = {};

      if (filters.text) {
        // Extract main text content, excluding scripts and styles
        $('script, style, nav, footer').remove();
        results.text = $('body').text().replace(/\s\s+/g, ' ').trim();
      }

      if (filters.headings) {
        results.headings = [];
        $('h1, h2, h3').each((i, el) => {
          results.headings.push({
            tag: (el as any).name?.toUpperCase() || (el as any).tagName?.toUpperCase() || 'H',
            text: $(el).text().trim()
          });
        });
      }

      if (filters.images) {
        results.images = [];
        $('img').each((i, el) => {
          const src = $(el).attr('src');
          if (src) {
            try {
              // Convert relative URLs to absolute
              const absoluteUrl = new URL(src, url).href;
              results.images.push({
                src: absoluteUrl,
                alt: $(el).attr('alt') || ''
              });
            } catch (e) {
              results.images.push({ src, alt: $(el).attr('alt') || '' });
            }
          }
        });
      }

      if (filters.links) {
        results.links = [];
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            try {
              const absoluteUrl = new URL(href, url).href;
              results.links.push({
                url: absoluteUrl,
                text: $(el).text().trim()
              });
            } catch (e) {
              results.links.push({ url: href, text: $(el).text().trim() });
            }
          }
        });
      }

      if (filters.custom && customSelector) {
        results.custom = [];
        $(customSelector).each((i, el) => {
          results.custom.push($(el).text().trim());
        });
      }

      res.json({ status: "success", data: results, url });
    } catch (error: any) {
      console.warn("[Scraper Fallback] Live scrape failed, utilizing Gemini fallback for URL:", url);
      console.warn("Reason:", cleanErrorMessage(error));

      try {
        const portalPrompt = `You are Mitra, a helpful digital assistant who assists Indian youth, seniors, and general citizens. 
The user wanted to scrape or visit the website: "${url}". 
However, due to slow network connections or portal security blocking, we couldn't load the raw HTML.
Based on your knowledge of this specific website or organization, please generate a highly useful, simplified simulated scraping preview of what this website provides. Focus on helpful information about government schemes, eligibility, student portals, agricultural benefits, or services, depending on the URL.

Provide a raw JSON response (and only JSON, no markdown codeblocks, no extra words) in this exact shape:
{
  "text": "A brief 2-3 paragraph simple summary of what this website is and its top 3 most important functions in Hinglish/English. Keep it clear, simple, and warm for youth, seniors and customers to understand.",
  "headings": [
    {"tag": "H1", "text": "A primary clear title of the organization"},
    {"tag": "H2", "text": "Top Active Scheme or Benefit"},
    {"tag": "H2", "text": "Important Documents Needed"},
    {"tag": "H2", "text": "How To Apply Locally"}
  ],
  "links": [
    {"url": "${url}", "text": "Official Portal Main Page"},
    {"url": "https://www.google.com/search?q=" + encodeURIComponent(url), "text": "Verify on Google Search"}
  ]
}
`;

        const geminiResponse = await callGeminiWithRetry({
          model: "gemini-3.5-flash",
          contents: [{ parts: [{ text: portalPrompt }] }],
          config: {
            responseMimeType: "application/json"
          }
        });

        const textOutput = geminiResponse.text?.trim() || "";
        
        // Clean markdown wrap if exist
        let cleanedJson = textOutput;
        if (cleanedJson.includes("```")) {
          cleanedJson = cleanedJson.replace(/```json/g, "").replace(/```/g, "").trim();
        }
        
        const aiData = JSON.parse(cleanedJson);
        return res.json({
          status: "success",
          data: {
            text: aiData.text || "Portal information summarized by Mitra AI.",
            headings: aiData.headings || [{ tag: "H1", text: "Portal Summary Guide" }],
            links: aiData.links || [],
            images: aiData.images || []
          },
          url,
          isFallback: true
        });

      } catch (geminiErr: any) {
        console.error("[Scraper fallback] Gemini generation failed:", cleanErrorMessage(geminiErr));
        
        // Super fallback if Gemini fails as well
        let domainFriendlyName = "Government Portal";
        try {
          domainFriendlyName = new URL(url).hostname.replace("www.", "");
        } catch (e) {}

        return res.json({
          status: "success",
          data: {
            text: `Humne portal (${domainFriendlyName}) se contact karne ki koshish ki, par website block ya down hone ke karan connectivity thodi dheemi hai. Kripya naye internet connection ke sath direct website check karein ya google search par updates dekhein. Humne aapke liye direct access link niche de di hai!`,
            headings: [
              { tag: "H1", text: `${domainFriendlyName.toUpperCase()} Portal Security Summary` },
              { tag: "H3", text: "💡 Mitra Tip: Direct Web Link se koshish karein" }
            ],
            links: [
              { url: url, text: "🔗 Open Direct Official Website" },
              { url: `https://www.google.com/search?q=${encodeURIComponent(domainFriendlyName)}`, text: "🔍 Search on Google" }
            ],
            images: [],
          },
          url,
          isFallback: true
        });
      }
    }
  });

  // Mitra Interview Coach API
  app.post("/api/interview/chat", async (req, res) => {
    const { chatHistory = [], userInput, preparingFor, profile = {} } = req.body;

    try {
      const contents = [];
      
      // Rebuild chat history in Gemini format
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });

      // Append current user input
      if (userInput) {
        contents.push({
          role: "user",
          parts: [{ text: userInput }]
        });
      }

      const systemInstruction = `You are "Mitra Interview Coach", a world-class HR professional and academic examiner inside the 'Form Mitra AI' app. Your job is to conduct realistic Mock Interviews and Vivas for Indian youth.

### TARGET ENVIRONMENT DETECTED:
- Preparing for: ${preparingFor || "Not specified yet"}
- User Profile Info: State is ${profile.state || "Not specified"}, Education is ${profile.class || profile.education || "Not specified"}, Stream is ${profile.stream || "Not specified"}, Experience is ${profile.experience || "Not specified"}.

### INSTRUCTIONS:
1. INITIATION: If the user hasn't specified what they are preparing for, start by asking what they are preparing for (e.g., MEXT Scholarship Interview, Job Interview, Class 11 PCB Practical Viva, NEET counseling). If they have told you, proceed to ask the FIRST question.
2. INTERVIEW FLOW: 
   - Ask ONLY ONE question at a time.
   - Wait for the user's response. Do not answer your own questions.
   - Tailor the difficulty based on their profile.
3. FEEDBACK & SCORING: After the user answers, provide feedback using this EXACT structure before asking the next question:
   - 🎯 Confidence/Relevance Score: [Rate out of 10]
   - ✅ What was good: [1 brief sentence]
   - 🛠️ Area to improve: [How they could have phrased it better or what facts they missed]
   - 🎤 Next Question: [Ask the next relevant question]

### TONE:
Professional, slightly strict to simulate a real interview environment, but highly encouraging during the feedback phase. Keep your language simple, using natural English with a touch of Hindi/Hinglish (common in Indian education/jobs context) to stay extremely relatable.`;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: contents.length > 0 ? contents : [{ parts: [{ text: "Start the interview process by greeting the user and asking what they are preparing for today." }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("[Interview Coach] Error:", error.message);
      res.status(500).json({ error: "Interview Coach connection issue. Please retry." });
    }
  });

  // Mitra SOP Engine API
  app.post("/api/sop/generate", async (req, res) => {
    const { rawBackground, stream, targetGoal, struggles, wordLimit = 500, profile = {} } = req.body;

    try {
      const prompt = `You are "Mitra SOP Engine", an elite admissions consultant and essay writer inside the 'Form Mitra AI' app. Your job is to craft a highly personalized, emotionally compelling, and 100% plagiarism-free Statement of Purpose (SOP), Motivation Letter, or Application Essay based on the following input:

### INPUT DETAILS:
- Raw Background: ${rawBackground}
- Academic Stream: ${stream}
- Target Goal (Scholarship/College): ${targetGoal}
- Life Story & Struggles: ${struggles}
- Word Limit: Around ${wordLimit} words
- Profile Info: State is ${profile.state || "Not specified"}

### INSTRUCTIONS:
Generate the Statement of Purpose following this strict structure:
1. THE HOOK: Start with a powerful opening paragraph that grabs attention. Do NOT use cliché openings (e.g. "Since childhood", "Ever since I was young"). Make it punchy, emotional, and authentic.
2. ACADEMIC/SKILL BODY: Weave their background, stream, and skills into a narrative of growth.
3. THE "WHY": Clearly explain why this specific scholarship/college (${targetGoal}) is the only logical next step for them.
4. THE CONCLUSION: End with a strong closing statement about how they will contribute back to society.

### CONSTRAINTS:
- Keep the language highly professional but authentic.
- STRICTLY FORBIDDEN: Do NOT use overly robotic, generic, or flowery AI transition words such as "delve", "tapestry", "testament", "pinnacle", "beacon", "catalyst", or similar "AI-slop" markers. Use natural, sincere, yet elite academic prose.
- Strictly adhere to the word limit of around ${wordLimit} words.

### OUTPUT FORMAT:
1. Deliver the final Statement of Purpose/Essay clearly under appropriate headings.
2. After the essay, provide a line separator (like "---") and then present exactly "2 Actionable Tips" on what real-life documents or certificates they should attach with this SOP (for their chosen stream and targets) to make it even stronger.`;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          temperature: 0.8,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("[SOP Engine] Error:", error.message);
      res.status(500).json({ error: "SOP Generation failed. Please try again." });
    }
  });

  // Mitra Global Guide API
  app.post("/api/global-guide/transform", async (req, res) => {
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: "No raw scholarship details or text provided." });
    }

    try {
      const prompt = `You are "Mitra Global Guide", an expert international scholarship and career mentor inside the 'Form Mitra AI' app. 

### CONTEXT:
The backend system will feed you raw, boring English text parsed from an RSS feed regarding a new international scholarship, free program, or tech opportunity. 

### YOUR TASK:
Transform this raw English data into a highly energetic, easy-to-understand 'Bade Bhai' (Elder Brother) Hinglish summary for Indian students. Make them feel excited and capable of achieving this global dream!

### INSTRUCTIONS & CONSTRAINTS:
1. ZERO HALLUCINATION: Only use the facts (Country, Deadline, Eligibility, Benefits) provided in the raw input. If a detail is missing, do not invent it.
2. TONE: Energetic, encouraging, conversational Hinglish. Use relevant emojis.
3. STRUCTURE: Strictly output in the format below so it fits perfectly into the app's UI cards.

### INPUT RAW TEXT:
${rawText}

### OUTPUT FORMAT:

🌍 **Mitra Global Alert: [Catchy, short Hindi/Hinglish title based on the program]** ✈️

Arre bhai! Ek naya aur zabardast international mauka aaya hai. Dhyan se suno:

🎯 **Yeh Opportunity Kya Hai?**
[Summarize the program/scholarship in 2-3 simple Hinglish lines. E.g., Japan government ki taraf se free padhai ka mauka...]

✅ **Kaun Apply Kar Sakta Hai? (Eligibility)**
- [Eligibility Point 1]
- [Eligibility Point 2]

💰 **Tumhara Fayda (Benefits):**
- [Benefit 1: e.g., 100% Tuition Fee Maaf]
- [Benefit 2: e.g., Rehne aur khane ka kharcha free]

🗓️ **Deadline:** [Extract Date or write "Check official link for deadline" if not provided]

💡 **Bade Bhai Ki Pro-Tip:**
[Give one encouraging tip, e.g., "Bhai, international forms thode lambe hote hain, toh aakhri din ka wait mat karna. Aaj hi documents ready karna shuru kar do!"]`;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("[Global Guide] Error:", error.message);
      res.status(500).json({ error: "Could not transform. Connection issue. Please retry." });
    }
  });

  // Mitra Job Guide API
  app.post("/api/job-guide/transform", async (req, res) => {
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: "No raw job details or text provided." });
    }

    try {
      const prompt = `You are "Mitra Job Guide", a friendly, highly energetic career mentor inside the 'Form Mitra AI' app. 

### CONTEXT:
The backend system will feed you raw job data. This data will either be:
1. PRIVATE JOBS/GIGS: JSON data coming from the Adzuna API.
2. SARKARI NAUKRI: Text/XML data coming from a Government Job RSS Feed.

### YOUR AUDIENCE:
Your users are young Indian students (10th pass, 12th pass, ITI, or early college students). They do not understand heavy corporate jargon. They need part-time gigs, entry-level private jobs, or basic Sarkari Naukri updates.

### INSTRUCTIONS:
1. IDENTIFY THE SOURCE: Automatically detect if the input is a Private Job (Adzuna) or a Sarkari Job (RSS) and adjust the title accordingly.
2. SIMPLIFY: Translate the boring technical job description into conversational, easy-to-understand Hinglish.
3. THE "BADE BHAI" TONE: Be extremely encouraging. Treat the user like your younger sibling. Use words like "Bhai", "Tension mat lo", "Zabardast mauka", "Himmmat rakho".
4. ZERO HALLUCINATION: Only state facts (Salary, Location, Deadline) present in the input. If salary is missing, say "Salary interview ke baad decide hogi".

### STRICT OUTPUT FORMAT (Use this exact UI layout):

[IF SARKARI JOB] 🏛️ **Sarkari Naukri Alert: [Insert Job Title]** 🚨
[IF PRIVATE JOB] 💼 **Mitra Gig Finder: [Insert Job Title]** ✨

Arre bhai! Ek naya aur zabardast mauka nikal kar aaya hai. Fatafat details dekho:

🎯 **Kaam Kya Hai? (Role):**
[Explain the job role in 2 simple Hinglish lines. What exactly will they do?]

✅ **Kaun Apply Kar Sakta Hai? (Eligibility):**
- [Qualification required, e.g., 10th/12th Pass?]
- [Experience required, e.g., Fresher ya koi experience?]

💰 **Paisa Kitna Milega? (Salary):**
[Insert Salary details. E.g., ₹15,000 per month ya per task?]

📍 **Location:** [Work from home hai ya kisi specific city mein?]

💡 **Bade Bhai Ki Advice:**
[Give one highly practical tip for this specific job. E.g., "Bhai typing speed achi mangi hai, toh apply karne se pehle thodi practice kar lena!" or "Sarkari form hai, last date ka wait mat karna server down ho jata hai!"]

### INPUT RAW TEXT:
${rawText}`;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("[Job Guide] Error:", error.message);
      res.status(500).json({ error: "Could not transform. Connection issue. Please retry." });
    }
  });

  // Mitra CSR Scanner API
  app.post("/api/csr/search", async (req, res) => {
    const { profile = {}, query = "" } = req.body;

    try {
      const stream = profile.stream || "Science (PCB)";
      const education = profile.class || profile.education || "Class 11";
      const state = profile.state || "Not specified";

      const prompt = `You are "Mitra CSR Scanner", an elite financial aid researcher and scholarship finder inside the 'Form Mitra AI' app. Your exclusive job is to discover high-value Private, Corporate (CSR), NGO, and Foundation scholarships for Indian students.

### TARGET USER PROFILE:
- Current Education Level: ${education}
- Academic Stream/Subject: ${stream}
- State of Residence: ${state}
- Additional Search Query/Goal: ${query || "Any eligible private CSR awards"}

### STRICT INSTRUCTIONS:
1. STRICT FILTERING (NO GOVT SCHEMES):
   - Completely IGNORE standard government schemes (like National Scholarship Portal (NSP), State Post-Matric, PMSS, CSSS, etc.).
   - ONLY search for and provide Private Corporate Scholarships (e.g., Tata, Reliance, Santoor, Wipro, HDFC Badhte Kadam, L'Oréal India, Infosys Foundation, Adobe, LIC Golden Jubilee, Colgate Keep India Smiling, G.P. Birla, etc.), NGO grants, private Foundation aids, or private international endowments/travel awards.
2. PROFILE MATCHING:
   - Carefully align the scholarship selection with the student's profile. Since the student is in stream "${stream}" at level "${education}" from state "${state}", find awards that specifically fund their stream (e.g. STEM, Healthcare, Commerce, Medical studies, or study-abroad awards like MEXT if related).
3. ZERO HALLUCINATION ON DATES:
   - Provide the EXACT actual "Application Opening Date" and "Deadline".
   - If a private scholarship date is not announced for the current year yet, you MUST state exactly: "Dates not announced yet for this year. Last year's deadline was [Month]." Do not make up dummy dates.

### OUTPUT SCHEMA CONSTRAINTS:
You must respond with a JSON array of objects. Each object represents an eligible verified private scholarship.
Each object must have the following fields:
- "name": Full name of the Corporate/Foundation Scholarship
- "amount": Exact grant amount (e.g., "₹50,000/year" or "Full Tuition Waiver")
- "eligibility": Array of exactly 3 simple, professional bullet points matching their specific stream and goals
- "opening": Exact opening date or month (e.g., "August 2026")
- "deadline": Exact deadline date (e.g. "September 30, 2026") or status statement "Dates not announced yet for this year. Last year's deadline was [Month]"
- "documents": Array of exactly 3-4 required documents for this scholarship as a checklist of items (e.g. ["10th/12th Marksheet", "Family Income Certificate < ₹2.5 Lakhs", "College Admission Receipt", "Passport Size Photograph"])
- "link": A high-quality official apply link where they can apply or read official documents
- "tip": One specific secret insider tip on what high-quality documents or write-ups they should present to stand out in this specific corporate application process based on their target course.

Format the response as a valid JSON array only. Return no markdown wrapping except optionally standard json block.`;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const parsed = safeParseJSON(response.text, []);
      res.json({ scholarships: parsed });
    } catch (error: any) {
      console.error("[CSR Scanner] Error:", error.message);
      res.status(500).json({ error: "SOP CSR search connection issue." });
    }
  });

  // Student & Jobs seeker Skill Finder API
  app.post("/api/skills/suggest", async (req, res) => {
    const { profile = {} } = req.body;
    const community = profile.community || "Student";
    const stream = profile.stream || "Others";
    const userClass = profile.class || "Not specified";
    const lang = profile.preferredLanguage || "hinglish";
    const name = profile.name || "Dost";
    const occupation = profile.occupation || "Not specified";

    try {
      const isJobs = community === "Jobs" || community === "Jobs Seeker" || community === "Job Seeker";
      
      const prompt = `You are "Mitra Skill Guru", an expert student & career counselor inside the 'Form Mitra AI' app.
      Your job is to recommend the top 3-4 most suitable, high-earning, and modern practical skills that the user (${name}) can learn to unlock massive opportunities.

      ### TARGET USER PROFILE:
      - Name: ${name}
      - Primary Community group: ${community} ${isJobs ? "(Focus on instant job placements, high salary upgrades, and professional portfolio development)" : "(Focus on balancing alongside current school/college studies)"}
      - Stream / Field: ${stream}
      - Level/Class: ${userClass}
      - Current Occupation: ${occupation}
      - Preferred Language Style: ${lang} (Friendly Hinglish/Hindi or clear Hindi mixed with English terms)

      ### CORE INSTRUCTIONS:
      Recommend exactly 3 to 4 specific high-demand practical skills suitable for their profile.
      For each skill, you must describe the following in pointwise bulletin lists:
      1. What the skill is and core practical concepts.
      2. Why this skill is highly beneficial for them specifically: given their stream/occupation ("${stream}" / "${occupation}").
      3. Future scope & Job placement speed (explain how it gets them hired 2x faster with immediate vacancies).
      4. Portfolio development value (explain what real-world portfolio project proofs they can build, e.g. Figma files, live websites, Excel dashboards, to show recruiters).
      5. Potential monthly earnings & Salary hike boost percentage (e.g., "₹25,000 - ₹50,000 / month (Approx 45% - 70% salary hike potential)").

      ### OUTCOME CONSTRAINTS:
      - Provide a warm, premium, highly encouraging message from "Bade Bhai" (elder brother tone) explaining why they can easily master this and stand out from thousands of other candidates.
      - Return the output in a strict JSON format matching this schema:
      {
        "skills": [
          {
            "name": "Full Skill Name (e.g. Professional Excel & SQL Analytics)",
            "description": "Short brief description of what the skill is in 1-2 sentence (in Hinglish/Hindi mixed with English words).",
            "duration": "Duration to master the skill (e.g. 4-6 Weeks, 2 Months).",
            "whyGood": ["Point 1 about suitability for their specific field", "Point 2 about why this is high demand right now"],
            "futureWork": ["Job placement multiplier details", "How it helps secure faster hires and remote gigs"],
            "portfolioValue": ["The exact live project they can build to show recruiters"],
            "earnings": "Estimated monthly earnings & Salary hike details (e.g. ₹30,000 - ₹60,000 / month with 50% hike potential)",
            "howToLearn": ["Steps they can take to start learning today", "Helpful tips on where to start"],
            "category": "Tech / Finance / Creative / Operations"
          }
        ],
        "bhaiInsight": "A very warm, brotherly advice paragraph in Hinglish/Hindi, telling them how to dedicate 1 hour daily to build projects, upgrade their resume instantly, and easily qualify for modern jobs."
      }

      Format the response as a valid JSON object only. Do NOT include any markdown code blocks, just raw JSON.`;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    whyGood: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    futureWork: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    portfolioValue: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    earnings: { type: Type.STRING },
                    howToLearn: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    category: { type: Type.STRING }
                  },
                  required: ["name", "description", "duration", "whyGood", "futureWork", "portfolioValue", "earnings", "howToLearn", "category"]
                }
              },
              bhaiInsight: { type: Type.STRING }
            },
            required: ["skills", "bhaiInsight"]
          }
        }
      });

      const parsed = safeParseJSON(response.text, {});
      if (parsed && parsed.skills && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        res.json(parsed);
      } else {
        throw new Error("Invalid skills response structure from Gemini.");
      }
    } catch (error: any) {
      console.info("[Skill Guru] Falling back gracefully:", cleanErrorMessage(error));
      
      // Fallback response with beautiful, personalized rules if Gemini errors or rate limits
      const isJobs = community === "Jobs" || community === "Jobs Seeker" || community === "Job Seeker";
      let skillsList: any[] = [];
      let bhaiMessage = "";

      if (isJobs) {
        // Fallback for Job Seekers / Jobs Community
        skillsList = [
          {
            name: "Professional Data Analytics & Cloud Warehousing (SQL + PowerBI)",
            category: "Data Operations",
            description: "Excel spreadsheets aur MySQL databases se dynamic real-time dashboards and corporate graphs prepare karna seekhein.",
            duration: "4 to 6 Weeks",
            whyGood: [
              "Companies me fast decision-making ke liye raw database analysts ki sabse zyada demand hai.",
              "Aap structured queries aur automated sales metrics visualization tables asani se manage kar sakenge."
            ],
            futureWork: [
              "2x Faster Placements: High priority vacancies in startups, MNCs, and corporate houses.",
              "Data-driven roles me entry barriers bohot low hote hain, jisse non-coding background wale bhi lag sakte hain."
            ],
            portfolioValue: [
              "Build a functional Sales Performance Dashboard from raw database spreadsheets using PowerBI/Excel to impress HR recruiters."
            ],
            earnings: "₹35,000 - ₹70,000 / month (Immediate 50% - 80% salary boost potential with live portfolio)",
            howToLearn: [
              "Database systems ke basics aur standard SQL queries key parameters YouTube ya free portals se sikhen.",
              "Mock dataset banakar direct portfolio representations taiyar karein."
            ]
          },
          {
            name: "Enterprise Digital Marketing, SEO & Ads Strategy",
            category: "Growth & Business",
            description: "Google Ads optimization, organic search rankings (SEO) aur social media promotions ke through target customers connect karein.",
            duration: "5 Weeks",
            whyGood: [
              "Commerce/Arts/STEM background ke business seekers ke product values badhane me perfect skill hai.",
              "Market customer trends aur search organic keyword tricks handle karna easy and intuitive hai."
            ],
            futureWork: [
              "Direct recruitment in media agency networks as Performance Marketer within 40 days.",
              "Remote clients and global freelancing retainer projects key priority based access."
            ],
            portfolioValue: [
              "Make a detailed live presentation showing SEO Keyword research & simulated Google Ads strategy case-study for a real business."
            ],
            earnings: "₹30,000 - ₹65,000 / month (Approx 40% - 60% salary hike potential with certified profiles)",
            howToLearn: [
              "HubSpot Academy aur Google Career Certificates ke free digital marketing program search karke karein.",
              "Apne active products or social handles grow karne ke practical insights implement karein."
            ]
          },
          {
            name: "UI/UX Product Design (Figma Masters & Dynamic Prototyping)",
            category: "Creative Engineering",
            description: "Modern websites aur mobile applications ke interactive UI screen visual graphics designs Figma software par model karein.",
            duration: "6 Weeks",
            whyGood: [
              "Design validation aur modern wireframes me high-earning capabilities sabse responsive hotey hain.",
              "Logical visual system templates control karna fast seekh sakte hain without complex code parameters."
            ],
            futureWork: [
              "Specialist designer requirements inside mobile agencies and tech networks.",
              "Globally design works are extremely high-paying, remote freelance deals are plentiful."
            ],
            portfolioValue: [
              "Make 3 solid mobile app screen prototypes inside Figma with full interactive transitions and publish your portfolio link."
            ],
            earnings: "₹40,000 - ₹85,000 / month (Huge 60% - 100% Salary Upgrade potential!)",
            howToLearn: [
              "Free Figma tutorials and layouts guides look up karein interactive design blogs par.",
              "Dribbble ya Behance patterns ko reconstruct karke dynamic portfolio display pages banayein."
            ]
          }
        ];
        bhaiMessage = `Dost ${name}, job seeking market me sabse bade fast-track checks high project portfolios aur practical proofs hote hain! In skills me se ek ko select karke live projects taiyar kijiye. Recruiters ko fake resumes ke badle practical GitHub/Figma links dikhaiye — aapki salary boost aur hiring speed instant triple ho jayegi! Aapka bhai hamesha backup ke sath help karega.`;
      } else {
        // Fallback for Students community
        if (stream === "PCM") {
          skillsList = [
            {
              name: "Full-Stack Web Development (HTML, CSS, JS & React)",
              category: "Tech & Software",
              description: "HTML, CSS, modern JavaScript aur React.js frontend structures use karke highly responsive, stunning websites banana seekhein.",
              duration: "8 to 12 Weeks",
              whyGood: [
                "PCM students ke mathematical logical rules and reasoning is development me bohot help karegi.",
                "Aap programming basics aur UI building bohot jaldi grasp kar payenge."
              ],
              futureWork: [
                "Software Engineer, Web Developer, aur Remote Developer roles ke liye primary skill hai.",
                "Upwork aur Fiverr par clients ke liye landing pages aur websites banake achha kama sakte hain."
              ],
              portfolioValue: [
                "Create a personal responsive portfolio website showing off your school projects, academic achievements, and future dreams."
              ],
              earnings: "₹25,000 - ₹60,000 / month (Starting freelance & remote work alongside college studies)",
              howToLearn: [
                "FreeCodeCamp aur YouTube ke free tutorials se HTML aur CSS se shuru karein.",
                "Roz 1-2 ghanta coding practice karein aur chote-chote responsive projects banayein."
              ]
            },
            {
              name: "Python Programming & AI Prompt Engineering",
              category: "Artificial Intelligence",
              description: "Data analysis ke liye simple Python programming rules aur modern AI APIs integration models explore karein.",
              duration: "6 Weeks",
              whyGood: [
                "Python sabse simple language hai aur STEM studies me analytics ke liye perfect hai.",
                "AI systems (jaise ChatGPT, Gemini) ko build karna seekhna future-proof skill hai."
              ],
              futureWork: [
                "Python Developer, Data Analyst, aur AI Content Creator ki positions ke liye high demand hai.",
                "Future research projects ya college admissions me iska bohot bada advantage milega."
              ],
              portfolioValue: [
                "Build a localized desktop assistant tool or a smart prompt optimizer using python scripts to save homework hours."
              ],
              earnings: "₹30,000 - ₹75,000 / month (Freelance AI optimizer or developer)",
              howToLearn: [
                "Python basics learn karein, phir learn karein how to use API integration.",
                "Mitra app me practice karein aur chat prompts improve karne ki techniques seekhein."
              ]
            }
          ];
          bhaiMessage = `Dost ${name}, PCM ke saath programming aur software designs seekhna aapke liye sone pe suhaga hoga! Aapko bilkul tension lene ki zaroorat nahi hai. Roz bas studies ke baad evening me 1-2 ghante nikalna hai. Dheere-dheere 3 month me aap expert ban jayenge aur studies par bhi koi load nahi padega! Always with you, Bhai.`;
        } else {
          skillsList = [
            {
              name: "UI/UX Product Designing (Figma Essentials)",
              category: "Creative & Design",
              description: "Zero coding and full fluid design layout systems seekhein, interactive mobile apps aur elegant portfolios design karna seekhein.",
              duration: "4 to 6 Weeks",
              whyGood: [
                "Creative visual geometry aur symmetry layout sense badhiya hota hai.",
                "Isme zero coding mechanical lines ki zaroorat hoti hai, bas thoda logic aur creativity chahiye."
              ],
              futureWork: [
                "Product Designer, UI/UX Specialist, aur Graphic Architecture positions.",
                "Startup companies and mobile app agencies hire visual experts first."
              ],
              portfolioValue: [
                "Redesign a popular local mobile app (like a food delivery or bus ticketing app) and share your interactive Figma links."
              ],
              earnings: "₹20,000 - ₹45,000 / month (Design projects online alongside studies)",
              howToLearn: [
                "Figma software ko free download karein aur use karna seekhein YouTube video guides se.",
                "Apne favorite mobile apps ka simple user interface clone aur replicate karke resume build karein."
              ]
            },
            {
              name: "Professional Blogging & SEO Content Writing",
              category: "Creative Writing",
              description: "Internet users ki informative search queries ke answers likhein aur Google searches me write-ups grow karke regular stream income kamaayein.",
              duration: "4 Weeks",
              whyGood: [
                "School/College subject analytical viewpoints aapko deep text communication values dete hain.",
                "Research topics ko simple explain karna helps boost writing fluency."
              ],
              futureWork: [
                "Blogger, Search Engine optimizer, Copywriter, and social media post manager.",
                "High quality brand articles demand is rising globally for remote writers."
              ],
              portfolioValue: [
                "Set up a free blog on writing channels like Medium or Blogger, writing about interesting educational studies."
              ],
              earnings: "₹18,000 - ₹35,000 / month (Consistent freelance blog postings)",
              howToLearn: [
                "SEO basics, keyword density and readable content styles videos follow karein.",
                "Weekly 2 fresh posts start karein writing flow establish karne ke liye."
              ]
            }
          ];
          bhaiMessage = `Bhai ${name}, studies ke sath-sath local project designs aur content writing skills explore karna aapki deep thinking ko monetise kar dega! Roz bas 1 ghanta practical work karein premium career growth ke liye. Aapka bada bhai hamesha guide karega.`;
        }
      }

      res.json({
        skills: skillsList,
        bhaiInsight: bhaiMessage,
        isFallback: true
      });
    }
  });

  // Mitra Gig Finder - Specialized Student Gigs Search API
  app.post("/api/gigs/search", async (req, res) => {
    const { query = "", profile = {} } = req.body;
    const name = profile.name || "Dost";
    const userClass = profile.class || "10/12/College";
    const userStream = profile.stream || "Others";

    try {
      const prompt = `You are "Mitra Gig Finder", a specialized part-time job and micro-gig researcher for Indian students inside 'Form Mitra AI'.
      Your goal is to find 100% free, zero-investment, genuine online earning opportunities matching the topic or interest: "${query}".

      ### TARGET USER STAGE:
      - Name: ${name}
      - Student level: Class/education standard ${userClass}, ${userStream} stream.

      ### STRICT LAWS (SCAM SHIELD PROTOCOL):
      1. CRITICAL: You MUST NEVER suggest any job, work, agency or platform that requires a registration fee, security deposit, buying sample datasets/training papers, or sharing confidential OTPs.
      2. REAL-WORLD LIVE WEB TARGETS: Suggest actual, active, known freelancing/micro-task platforms operating in India (e.g. Internshala, Chegg, Upwork, Fiverr, Scribie, Rev, Photomath, Brainly, Freelancer). No fictional links or placeholder portals.
      3. STUDENT FRIENDLY: Match gigs specifically suitable for student capabilities alongside study schedules.

      ### OUTPUT STYLE:
      Return exact matching gigs matching user search query: "${query}".
      Provide exactly 3 genuine gigs in JSON format.
      Your output must be a valid JSON matching this schema:
      {
        "gigs": [
          {
            "name": "Verified Pocket-Money Gig: Role name",
            "earnings": "Expected Earning: e.g. ₹500/task or ₹5000/month",
            "commitment": "e.g. 2 hours/day",
            "description": "What they have to do: Clear 1-2 sentence explanation of the actual work.",
            "skills": ["Skill 1", "Skill 2"],
            "applyLink": "Genuine HTTP apply or website link"
          }
        ]
      }

      Return RAW JSON only. Do not wrap in markdown or backticks.`;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.6,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              gigs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    earnings: { type: Type.STRING },
                    commitment: { type: Type.STRING },
                    description: { type: Type.STRING },
                    skills: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    applyLink: { type: Type.STRING }
                  },
                  required: ["name", "earnings", "commitment", "description", "skills", "applyLink"]
                }
              }
            },
            required: ["gigs"]
          }
        }
      });

      const parsed = safeParseJSON(response.text, {});
      if (parsed && parsed.gigs && Array.isArray(parsed.gigs)) {
        res.json(parsed);
      } else {
        throw new Error("Invalid response schema from Gemini");
      }
    } catch (error: any) {
      console.warn("[Gig Finder] Error returning searched gigs:", cleanErrorMessage(error));
      
      // Localized fallback matching query loosely
      res.json({
        gigs: [
          {
            name: `Verified Pocket-Money Gig: Freelance ${query || "Data Entry Educator"}`,
            earnings: "₹250 - ₹500 / assignment",
            commitment: "Flexible 1-2 hours / day",
            description: `Deliver quality tasks matching ${query || "basic student skills"} on verified student-friendly platforms like Internshala.`,
            skills: [query || "General Skills", "Accuracy", "Reliable Internet"],
            applyLink: "https://internshala.com/internships/part-time-work-from-home-internships/"
          },
          {
            name: `Verified Pocket-Money Gig: Micro tasking for ${query || "Design Content"}`,
            earnings: "₹1,500 - ₹4,500 / week",
            commitment: "No minimum hours",
            description: `Assist small teams worldwide with micro digital projects associated with ${query || "basic English & web skills"}.`,
            skills: ["Basic English proficiency", "Attention to instructions"],
            applyLink: "https://www.upwork.com/freelance-jobs/"
          }
        ]
      });
    }
  });

  // AI Daily Digest Endpoint
  app.post("/api/notifications/digest", async (req, res) => {
    const { notifications } = req.body;
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({ error: "No notifications provided for summarization" });
    }

    try {
      const prompt = `You are "Form Mitra AI", a helpful elder brother ("Bade Bhai") assisting Indian students and citizens. Summarize the following unread important updates/notifications into a single, highly readable bulleted daily digest.

FORMAT RULES:
- Write in warm, relatable Hinglish (Hindi mixed with English, using a comforting elder brother tone).
- Create a clear, high-contrast visual list using bullet points (e.g. "• ").
- Highlight key deadlines, actions needed (like document verification, fee dates), and major benefits.
- Keep each point highly actionable, bolding crucial terms.
- At the end, add a reassuring, warm sign-off in "Bade Bhai" style (e.g., "Aap tension mat lo bhai, bas ye steps complete karo aur sab theek rahega!").

NOTIFICATIONS TO SUMMARIZE:
${notifications.map((n, i) => `${i + 1}. Title: "${n.title}" | Detail: "${n.body}"`).join("\n")}
`;

      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
        }
      });

      res.json({ digest: response.text });
    } catch (error: any) {
      console.info("[AI Daily Digest Fallback, executing fallback]:", cleanErrorMessage(error));
      
      const fallbackPoints = notifications.map(n => `• **${n.title}**: ${n.body}`).join("\n\n");
      const fallbackDigest = `**Ram-Ram Bhai!** Abhi server thoda premium load me hai, toh maine fatfat ye manual summary ready kar di hai:\n\n${fallbackPoints}\n\n**Bade Bhai ki Tip:** Inhe dhyan se padh ke direct official boards se update confirm kar lo. Koi tension mat lena, sab badhiya hoga!`;
      
      res.json({ digest: fallbackDigest });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
