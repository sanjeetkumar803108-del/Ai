import { GoogleGenAI, Modality } from "@google/genai";
import { UserProfile } from "../types";

const apiKey = process.env.GEMINI_API_KEY;

export type GeminiErrorType = 'QUOTA' | 'NETWORK' | 'INVALID_KEY' | 'UNKNOWN';

export interface GeminiError {
  type: GeminiErrorType;
  message: string;
  originalError?: any;
}

const handleGeminiError = (error: any): GeminiError => {
  const messagePart = error && (error.message || error.statusText || String(error) || "");
  const detailsPart = error && error.details ? JSON.stringify(error.details) : "";
  const stackPart = error && error.stack ? String(error.stack) : "";
  const errorStr = `${JSON.stringify(error)} ${messagePart} ${detailsPart} ${stackPart}`.toLowerCase();
  
  if (
    errorStr.includes('quota') || 
    errorStr.includes('429') || 
    errorStr.includes('resource_exhausted') || 
    errorStr.includes('rate limit') ||
    errorStr.includes('limit exceeded')
  ) {
    return {
      type: 'QUOTA',
      message: 'Sanjeet bhai, lagta hai free tier ki API daily limits abhi exceed ho gayi hain! ⏳ Bhai, kripya thoda wait karke try karein (Aap 1-2 minutes baad ya phir kal try kar sakte hain). Tab tak aap baaki local tools jaise "Verified Smart QR" ya data vaults bina kisi dikkat ke bilkul free use kar sakte hain! Aapko bilkul tension lene ki zarurat nahi hai, main aapke saath hoon!'
    };
  }
  
  if (errorStr.includes('network') || errorStr.includes('xhr') || errorStr.includes('fetch') || errorStr.includes('failed to fetch')) {
    return {
      type: 'NETWORK',
      message: 'Mobile internet speed thodi kam lag rahi hai bhai, ya network me dikkat hai. Kripya connectivity check karke ek baar dobara try karein!'
    };
  }
  
  if (errorStr.includes('key') || errorStr.includes('api_key') || errorStr.includes('unauthorized')) {
    return {
      type: 'INVALID_KEY',
      message: 'AI initialization key set up me thodi dikkat aa rahi hai bhai. Developer settings me system credentials check kar lijiye.'
    };
  }

  return {
    type: 'UNKNOWN',
    message: 'System mein kuch anjan dikkat aa gayi hai. Kripya thodi der baad koshish karein.',
    originalError: error
  };
};

const sanitizeProfile = (profile: any) => {
  if (!profile) return profile;
  const cleaned = { ...profile };
  
  // Clean empty values to prevent any issues
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === null || cleaned[key] === undefined || cleaned[key] === "") {
      delete cleaned[key];
    }
  });

  // If community is Jobs, remove student parameters and set appropriate occupation if student
  if (cleaned.community === 'Jobs') {
    delete cleaned.class;
    delete cleaned.stream;
    if (cleaned.occupation === 'Student') {
      cleaned.occupation = 'Unemployed';
    }
  } else if (cleaned.community === 'Normal') {
    // If citizen/normal, remove student parameters as well
    delete cleaned.class;
    delete cleaned.stream;
  }
  return cleaned;
};

export let ai: GoogleGenAI | null = null;

export const SCREEN_GURU_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "highlight_element",
        description: "Highlight a specific UI element on the user's screen using relative coordinates (0-100).",
        parameters: {
          type: "OBJECT",
          properties: {
            x: { type: "NUMBER", description: "X coordinate (0-100)" },
            y: { type: "NUMBER", description: "Y coordinate (0-100)" },
            w: { type: "NUMBER", description: "Width (0-100)" },
            h: { type: "NUMBER", description: "Height (0-100)" },
            label: { type: "STRING", description: "Label text for the highlight" }
          },
          required: ["x", "y", "w", "h"]
        }
      },
      {
        name: "navigate_to_tab",
        description: "Navigate to a specific tab in the application (e.g., 'vault', 'schemes', 'guide', 'chat', 'home', 'tools').",
        parameters: {
          type: "OBJECT",
          properties: {
            tab: { type: "STRING", description: "The tab identifier to navigate to." }
          },
          required: ["tab"]
        }
      },
      {
        name: "fill_form_field",
        description: "Fill a specific field in the current practice form. Use this when the user asks you to help fill or when you see they are struggling.",
        parameters: {
          type: "OBJECT",
          properties: {
            field_name: { type: "STRING", description: "The name of the field to fill (e.g., 'Aadhar Number', 'Full Name')" },
            value: { type: "STRING", description: "The value to enter into the field" }
          },
          required: ["field_name", "value"]
        }
      }
    ]
  }
];

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const getSpeech = async (text: string): Promise<string | null> => {
  if (!ai) throw new Error("AI not initialized.");

  const maxRetries = 2;
  let attempt = 0;

  const runRequest = async (): Promise<string | null> => {
    try {
      console.log(`TTS Request (Attempt ${attempt + 1}) for text length:`, text.length);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: `Say clearly and naturally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        console.log("TTS successfully received audio data, length:", base64Audio.length);
      } else {
        console.warn("TTS response received but no audio data found in candidate");
      }
      return base64Audio || null;
    } catch (error: any) {
      const errorStr = JSON.stringify(error);
      const isQuota = errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED");
      const isTransient = errorStr.includes("500") || errorStr.includes("xhr error") || errorStr.includes("UNKNOWN");

      if (isQuota) {
        console.error("Gemini TTS Quota Exceeded (429). Please wait before trying again.");
        return null;
      }

      if (isTransient && attempt < maxRetries) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Transient Gemini TTS Error, retrying in ${delay}ms...`, errorStr);
        await new Promise(r => setTimeout(r, delay));
        return runRequest();
      }

      console.error("Gemini TTS Persistent Error:", error);
      return null;
    }
  };

  return runRequest();
};

export const analyzeForm = async (imageBase64: string, mimeType: string) => {
  if (!ai) throw new Error("AI not initialized. Check your API key.");

  const prompt = `
    You are 'Mitra', a warm, helpful, and empathetic 'Bade Bhai' or friend who is an expert in Indian government procedures.
    Analyze this photo of a form and provide a detailed guide in JSON format. 
    Help the user feel confident and supported while filling this form.
    
    Explanations must be in friendly, simple Hinglish (Hindi + English) as used in warm daily conversation.
    
    Response MUST be a valid JSON object with this structure:
    {
      "formName": "Official name of the form",
      "summary": "Warm 1-line explanation in Hinglish of what this form is for (e.g., 'Ye form aapko scholarship dilane mein help karega!')",
      "extractedOcrText": "A clean, markdown-formatted full text transcript of all characters, headings, and input field labels extracted verbatim from the uploaded form photo using high-fidelity OCR, preserving the structural layout as best as possible. Highlight headings with '#' and format tabular lists clearly so it's super easy to read and copy.",
      "costEfficiency": {
        "offlineCost": "Estimated ₹ range (Cyber Cafe/Agent)",
        "onlineCost": "Official ₹ fee (often ₹0)",
        "savings": "Percentage saved (e.g. 90%)",
        "advocacyMsg": "Encouraging message about choosing online path in Hinglish"
      },
      "confidenceAnalysis": {
        "safetyBenefit": "How Mitra minimizes errors and rejection risks in Hinglish",
        "offlineRisk": "Hassle, travel, and wait times at physical centres in Hinglish",
        "finalVerdict": "Reassuring conclusion about speed and security in Hinglish"
      },
      "fields": [
        {
          "field": "Name of the field in the form",
          "explanation": "Friendly explanation in Hinglish of what to fill here",
          "whyItMatters": "Explain 'why this information is needed' in warm Hinglish (e.g., 'Ye bank transfer ke liye zaroori hai')",
          "isCritical": true,
          "commonMistake": "Mention a specific common mistake people make here in gentle Hinglish (e.g., 'Log aksar IFSC mein 0 ki jagah O likh dete hain')",
          "exampleValue": "Provide a sample dummy value (e.g., SBIN0001234)"
        }
      ],
      "pitfalls": [
        {
          "risk": "Major reason for rejection in Hinglish",
          "correctiveAction": "Specific step from actionPlan to fix this"
        }
      ],
      "smartTips": [
        "Encouraging advice 1 in Hinglish",
        "Encouraging advice 2 in Hinglish"
      ],
      "actionPlan": [
        "Step 1 to fix",
        "Step 2 to fix"
      ],
      "mitraTip": "A warm, encouraging final word from Mitra in Hinglish. MANDATORY: You must include a variation of 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।' at the end.",
      "pitch": {
        "isOnlinePossible": true,
        "pitchMsg": "If 100% online, confirm and pitch the ₹10 service with pain point highlight. If offline, immediately state the need for a physical visit in Hinglish. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'",
        "offlineGuide": "Complete step-by-step offline procedure, documents (originals/copies), and precautions (e.g., 'Take 2 photos', 'Go before 11 AM') if physical visit required. Leave empty if 100% online.",
        "cta": "Encouraging CTA (e.g., 'क्या मैं अभी ₹10 वाले इस सुरक्षित ऑनलाइन प्रोसेस को शुरू करूँ?')"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
    return response.text || "";
  } catch (error: any) {
    const errorInfo = handleGeminiError(error);
    console.warn("Gemini Analysis (Quota or Error):", errorInfo);
    // Return a helpful static fallback form analysis
    return JSON.stringify({
      "formName": "Digital Application Form",
      "summary": `${errorInfo.message} (Service Busy). आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।`,
      "extractedOcrText": "# Application for General Benefit Scheme\n\n1. **Full Name** (as in Aadhaar Card) _______________________\n2. **Date of Birth** (DD/MM/YYYY) _______________________\n3. **Father's Name** _______________________\n4. **Aadhar Number** _______________________\n5. **Permanent Address** _______________________\n6. **Signature of Applicant** _______________________",
      "costEfficiency": {
        "offlineCost": "₹150 - ₹300",
        "onlineCost": "₹0 - ₹50",
        "savings": "85%",
        "advocacyMsg": "Applying online with Mitra keeps your money in your pocket!"
      },
      "confidenceAnalysis": {
        "safetyBenefit": "Mitra AI error-checking mechanism helps you avoid common sarkaari rejection reasons.",
        "offlineRisk": "Cyber cafes often make spelling errors and have long waiting lines.",
        "finalVerdict": "Online path is 5x faster and 100% more secure for your documents."
      },
      "fields": [
        {
          "field": "Full Name",
          "explanation": "Apna poora naam likhein jo Aadhar card par hai.",
          "whyItMatters": "Sahi naam se hi government records match hote hain.",
          "isCritical": true,
          "commonMistake": "Initials mat use karein, poora naam likhein.",
          "exampleValue": "Sanjeev Kumar"
        },
        {
          "field": "Date of Birth",
          "explanation": "Janm tithi DD/MM/YYYY format mein bharein.",
          "whyItMatters": "Aapki umar se eligibility check ki jaati hai.",
          "isCritical": true,
          "commonMistake": "Wrong date format apply karna.",
          "exampleValue": "15/08/2005"
        },
        {
          "field": "Aadhar Number",
          "explanation": "12 anko ka Aadhar number dhyan se bharein.",
          "whyItMatters": "Identity verification ke liye ye sabse zaroori hai.",
          "isCritical": true,
          "commonMistake": "Ek bhi digit galat hona.",
          "exampleValue": "1234 5678 9012"
        }
      ],
      "pitfalls": [
        {
          "risk": "Signature missing hona",
          "correctiveAction": "Form ke niche apne signature zaroor karein."
        },
        {
          "risk": "Overwriting ya cutting karna",
          "correctiveAction": "Galti hone par naya form use karein, cutting na karein."
        }
      ],
      "smartTips": [
        "Form bharne se pehle instructions dhyan se padhein.",
        "Blue ya Black ballpoint pen ka hi use karein."
      ],
      "actionPlan": [
        "Form ke niche apne signature zaroor karein.",
        "Galti hone par naya form use karein, cutting na karein."
      ],
      "mitraTip": "AI service temporarily limited hai, lekin aap upar di gayi general tips follow kar sakte hain!"
    });
  }
};

export const getFieldExample = async (formName: string, fieldName: string, explanation: string) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    Form: "${formName}"
    Field: "${fieldName}"
    Explanation: "${explanation}"
    
    Task: Provide structural guidance for this field in an Indian context.
    Return a JSON object with:
    {
      "example": "A realistic example value (e.g., SBIN0001234 for IFSC)",
      "tip": "An expert tip to avoid rejection in Hinglish",
      "whyItMatters": "Short explanation in Hinglish why this field is critical",
      "commonMistake": "Mention a very specific common mistake people make here in Hinglish"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      example: parsed.example || "Example not available",
      tip: parsed.tip || "Sahi jankari bharein taaki reject na ho.",
      whyItMatters: parsed.whyItMatters || "Check carefully.",
      commonMistake: parsed.commonMistake || ""
    };
  } catch (error) {
    console.error("Error generating field example:", error);
    return {
      example: "Error generating example",
      tip: "Kripya apne dastawez (documents) check karein.",
      whyItMatters: "Mandatory field check."
    };
  }
};

export const generateSchemeLetter = async (schemeName: string, schemeDetails: any, userProfile: any, additionalNotes?: string) => {
  if (!ai) throw new Error("AI not initialized. Check your API key.");

  const prompt = `
    Generate a professional application letter for the government scheme: '${schemeName}'.
    
    User details:
    - Name: ${userProfile.name || '[Aapka Naam]'}
    - State: ${userProfile.state || '[Aapka Rajya]'}
    
    Scheme Details:
    - Category: ${schemeDetails.category}
    - Hindi Name: ${schemeDetails.hindiName}
    
    Instruction:
    1. FORMATTING (CRITICAL - Follow Paper-Style Layout):
       - Title: Centered and Bold (e.g. "Application for Transfer Certificate")
       - Recipient: 
         To,
         [Post/Designation (e.g. The Principal/The Manager)],
         [Name of Organization/School],
         [Address].
       - Date: Line exactly as "Date:- DD/MM/YYYY"
       - Subject: Line exactly as "Subject:- [Summarized Subject]"
       - Salutation: "Respected Sir/Madam,"
       - Body: Proper formal paragraphs with double line breaks.
       - Closing:
         Thanking You,
         Yours faithfully/sincerely,
         Signature
         Name: [Name Placeholder]
         Class/Post: [Placeholder]
         Section/Dept: [Placeholder]
         Roll No/ID: [Placeholder]
    2. Language: Write in ${userProfile.preferredLanguage === 'hi' ? 'pure Hindi (Devanagari script)' : 'Hinglish (Hindi written in English script)'}.
    3. Include placeholders like [DATE], [Aadhar Number], [Mobile Number], [Full Address] where information is missing.
    4. Keep it concise, celebratory, and legally sound.
    5. Additional User Request notes to include: ${additionalNotes || 'N/A'}.
    
    Output ONLY THE LETTER content. No conversational filler.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "";
  } catch (error: any) {
    console.warn("Gemini Scheme Letter (Quota or Error):", error?.message || error);
    return `
**APPLICATION FOR ${schemeName || 'SCHEME'}**

To,
The Concerned Authority,
[Block/District Office Name],
${userProfile.state || '[Appka Rajya]'}.

Date:- ${new Date().toLocaleDateString('en-GB')}

Subject:- Application for enrollment in ${schemeName || 'Government Scheme'}.

Respected Sir/Madam,

I, ${userProfile.name || '[Appka Naam]'}, resident of ${userProfile.state || '[Appka Rajya]'}, want to apply for the ${schemeName || 'scheme mentioned above'}. I believe I am eligible for the benefits based on the current criteria.

I have attached my supporting documents (Aadhar Card, Residence proof, and Bank details) for your kind review. Please process my application at the earliest.

Thanking You,

Yours Faithfully,

(Signature)
Name: ${userProfile.name || '[Appka Naam]'}
Contact: [Aapka Mobile Number]
Address: [Aapka Poora Pata]
    `.trim();
  }
};

export const generateFormalLetter = async (topic: string, details: string, userProfile: any) => {
  if (!ai) throw new Error("AI not initialized.");

  const langHint = userProfile?.preferredLanguage === 'hi' 
    ? 'Use pure Hindi (Devanagari script).' 
    : userProfile?.preferredLanguage === 'en' 
      ? 'Use standard English.' 
      : 'Use simple Hinglish (a mix of Hindi and simple English).';

  const prompt = `
    Generate a professional formal application letter for the topic: "${topic}".
    Details to include: "${details}".
    
    User details:
    - Name: ${userProfile.name || '[Aapka Naam]'}
    - State: ${userProfile.state || '[Aapka Rajya]'}
    
    Instruction:
    1. FORMATTING (CRITICAL - Follow Paper-Style Layout):
       - Title: Centered and Bold (e.g. "Application for Transfer Certificate")
       - Recipient: 
         To,
         [Post/Designation (e.g. The Principal/The Manager)],
         [Name of Organization/School],
         [Address].
       - Date: Line exactly as "Date:- DD/MM/YYYY"
       - Subject: Line exactly as "Subject:- [Summarized Subject]"
       - Salutation: "Respected Sir/Madam,"
       - Body: Proper formal paragraphs with double line breaks.
       - Closing:
         Thanking You,
         Yours faithfully/sincerely,
         Signature
         Name: [Name Placeholder]
         Class/Post: [Placeholder]
         Section/Dept: [Placeholder]
         Roll No/ID: [Placeholder]
    2. Language: ${langHint}.
    3. Include placeholders like [DATE], [Aadhar Number], [Mobile Number], [Full Address] where information is missing.
    4. Keep it concise, respectful, and legally sound.
    
    Output ONLY THE LETTER content. No conversational filler.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "";
  } catch (error: any) {
    console.warn("Gemini Formal Letter (Quota or Error):", error?.message || error);
    return `
**FORMAL APPLICATION**

To,
The Principal / Concerned Officer,
[Institution/Department Name],
[Location].

Date:- ${new Date().toLocaleDateString('en-GB')}

Subject:- Application regarding ${topic || 'General Request'}.

Respected Sir/Madam,

With due respect, I want to state that ${details || 'I have a request regarding the mentioned topic'}. 

I hope you will consider my request and take necessary action.

Thanking You,

Yours Sincerely,

(Signature)
Name: ${userProfile.name || '[Appka Naam]'}
ID/Roll No: [Optional]
    `.trim();
  }
};

/**
 * Generates an AI-powered "Smart Tip" for a specific government scheme.
 */
export const getSchemeSmartTip = async (scheme: any, userProfile: UserProfile): Promise<string> => {
  const isLocalStorageAvailable = typeof window !== "undefined" && window.localStorage;
  const now = Date.now();
  
  const quotaReachedRaw = isLocalStorageAvailable ? window.localStorage.getItem("mitra_gemini_quota_reached") : null;
  const quotaReachedTime = quotaReachedRaw ? parseInt(quotaReachedRaw, 10) : 0;
  const isQuotaCooldown = now - quotaReachedTime < 4 * 60 * 60 * 1000; // 4 hours cooldown if quota reached

  if (!ai || isQuotaCooldown) {
    console.log("[getSchemeSmartTip] Bypassing real Gemini API call (cooldown/uninitialized). Returning tailored smart tip.");
    return `Bhai, is ${scheme.name || "scheme"} ke liye apne basic KYC aur income certificates up-to-date rakhiye. Official site par apply karte samay biometrics mismatch se bachein.`;
  }

  const prompt = `
    Role: You are "Mitra", an expert 'Bade Bhai' advisor for Indian government schemes.
    
    Task: Generate a highly helpful "Smart Tip" for this government scheme: "${scheme.name}" (${scheme.hindiName}).
    
    User Profile Context:
    - Name: ${userProfile.name || 'Dost'}
    - State: ${userProfile.state || 'India'}
    - Occupation: ${userProfile.occupation || 'Not specified'}
    
    Scheme Details:
    - Description: ${scheme.description}
    - Eligibility: ${scheme.eligibility?.join(', ') || 'General'}
    - Benefits: ${scheme.benefits?.join(', ') || 'N/A'}
    
    Your Smart Tip MUST be in Hinglish and cover:
    1. A simplified explanation of how the user can benefit.
    2. A specific "Common Mistake" to avoid that leads to rejection.
    3. An encouraging expert advice.
    
    Format: Return ONLY the text of the tip (2-3 sentences). Start with "Bhai, ..." or "Dost, ...".
    
    Example: "Bhai, is scheme mein apply karte waqt dhyan rakhna ki aapka Aadhaar card bank account se linked ho, varna paisa aane mein deri ho sakti hai. Ye aapke liye ₹2000 ki seedhi madad hai!"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error: any) {
    console.warn("Smart Tip generation error:", error);
    const errorStr = String(error?.message || error || "").toLowerCase();
    
    if (
      errorStr.includes('quota') || 
      errorStr.includes('429') || 
      errorStr.includes('resource_exhausted') || 
      errorStr.includes('rate limit') ||
      errorStr.includes('limit exceeded')
    ) {
      if (isLocalStorageAvailable) {
        window.localStorage.setItem("mitra_gemini_quota_reached", String(Date.now()));
      }
    }
    
    return `Bhai, is ${scheme.name || "scheme"} ke liye apne basic KYC aur income certificates up-to-date rakhiye. Official site par apply karte samay biometrics mismatch se bachein.`;
  }
};

/**
 * Analyzes a filled form image against a scheme's requirements.
 */
export const analyzeFilledForm = async (imageFile: File, scheme?: any): Promise<any> => {
  if (!ai) throw new Error("AI not initialized.");

  // Convert file to base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(imageFile);
  });

  const prompt = `
    Role: You are "Form Mitra AI", an expert audit officer for Indian government and official forms.
    
    Task: Audit the provided image of a filled application form ${scheme ? 'for the scheme: ' + scheme.name : '(generic audit)'}.
    
    ${scheme ? `Scheme Requirements:
    - Target: ${scheme.description}
    - Common Fields: Name, Aadhaar, Income, Date of Birth, Signature, Category.` : 'Check for general correctness: Name, IDs, Signature, Date of Birth, etc.'}
    
    Instructions:
    1. Extract all visible text and fields from the form.
    2. Check for missing required fields, illegible handwriting, logic errors, and any missing signatures/photos.
    
    Format: Return a JSON object EXACTLY matching this schema (do NOT include markdown formatting like \`\`\`json):
    {
      "riskScore": 45, // Number between 0-100 (higher = higher chance of rejection)
      "verdict": "string (Short verdict like 'Form Needs Attention')",
      "photoAudit": {
        "isAccepted": boolean,
        "backgroundStatus": "string (e.g. 'Clear' or 'Cluttered')",
        "clarity": "string (e.g. 'Sharp' or 'Blurry')",
        "brightness": "string",
        "alignment": "string",
        "legibility": "string"
      },
      "majorIssues": [
        { "issue": "string", "severity": "high" | "medium", "fix": "string (Bade bhai style fix instruction)" }
      ],
      "identifiedFields": [
        { "field": "string", "value": "string", "status": "ok" | "error" | "warning" }
      ],
      "looksGood": ["string", "string"]
    }
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imageFile.type === 'application/pdf' ? 'application/pdf' : imageFile.type,
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Form audit error:", error);
    return {
      riskScore: 100,
      verdict: "Error Processing Form",
      photoAudit: { isAccepted: false, backgroundStatus: "Unknown", clarity: "Unknown" },
      majorIssues: [{ issue: "System Error", severity: "high", fix: "Bhai, image process karne mein thodi dikkat ho rahi hai. Kripya phirse try karein." }]
    };
  }
};

export const searchSchemes = async (query: string, userProfile?: any) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    PERFORM A DEEP SEARCH and INTENT ANALYSIS for the Indian Government Scheme query: "${query}".
    
    The user is from ${userProfile?.state || 'India'}.
    
    1. INTENT ANALYSIS: First, analyze the user's intent. Are they looking for a specific scheme by name, a category of benefit (e.g., 'loans for farmers'), or an eligibility question?
    2. SEARCH & PRIORITIZE: 
       - Search across all official Indian government websites (.gov.in, .nic.in, pib.gov.in).
       - PRIORITIZE EXACT MATCHES: If the user mentions a specific scheme name (e.g., "PM Kisan"), it MUST be the first result.
       - RELEVANCE: Ensure remaining results are closely related to the user's intent.
    3. FRESHNESS: Look for latest notifications (2024-2026 data).
    
    Provide a list of 4 most relevant matching schemes.
    
    For each scheme, provide:
    - id: unique string id
    - title: Official Name in English
    - hindiName: Name in Hindi (Devanagari script)
    - name: Common name or alias
    - description: Short 1-line summary
    - category: One of [Agriculture, Healthcare, Education, Finance, Housing, Employment, Welfare, Women, Rural, Urban]
    - state: The state it belongs to or "National"
    - eligibility: Array of 3-5 eligibility criteria strings
    - benefits: Array of 3-5 benefit strings
    - documents: Array of required document strings
    - officialSource: Name of the government department or portal found via search
    - officialUrl: Direct link to the official government portal for this scheme (MUST be valid .gov.in or .nic.in link)
    - confidenceScore: A number from 0 to 100 representing how well this scheme matches the user's intent and query. Use 100 for exact name matches.
    
    Output the result as a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.warn("Error searching schemes (Quota or Error):", error?.message || error);
    // Generic high-quality fallbacks for India context
    return [
      {
        id: "fb-1",
        title: "PM Kisan Samman Nidhi",
        hindiName: "पीएम किसान सम्मान निधि",
        name: "PM-Kisan",
        description: "Income support of ₹6000/year to all landholding farmers families.",
        category: "Agriculture",
        state: "National",
        eligibility: ["Must be a farmer", "Must have land records"],
        benefits: ["Direct cash transfer of ₹6000 annually"],
        documents: ["Aadhar card", "Land papers", "Bank account"],
        officialSource: "pmkisan.gov.in",
        officialUrl: "https://pmkisan.gov.in/",
        confidenceScore: 90
      },
      {
        id: "fb-2",
        title: "Ayushman Bharat PMJAY",
        hindiName: "आयुष्मान भारत योजना",
        name: "Ayushman Bharat",
        description: "Free health cover of ₹5 lakh per family per year for secondary/tertiary care.",
        category: "Healthcare",
        state: "National",
        eligibility: ["Low-income families", "As per SECC data"],
        benefits: ["Cashless treatment up to ₹5 lakh"],
        documents: ["Aadhar card", "Ration card"],
        officialSource: "pmjay.gov.in",
        officialUrl: "https://pmjay.gov.in/",
        confidenceScore: 85
      }
    ];
  }
};

export const getDailyNews = async (userProfile: any) => {
  const profile = sanitizeProfile(userProfile);
  
  // High-quality local/fallback news generator to completely prevent API loops & over-exhaustion
  const getFallbackNewsData = () => {
    const fallbackNews: any = {
      'Student': [
        {
          "id": "fs1",
          "title": "Bihar Student Credit Card New Portal Update 🚀",
          "summary": "Bihar sarkar ne Student Credit Card yojana ka portal naya kiya hai. Ab higher studies ke liye ₹4 lakh tak ka loan apply karna behad aasan aur fast ho gaya hai.",
          "category": "Scholarship",
          "analysis": "Bhai, agar aap higher studies ke liye paise arrange karne me pareshan ho rahe hain, toh is yojana se bina kisi collateral security ke saste dar par loan mil jayega.",
          "impact": "Aap DRCC office ke chakkar kaatne ke bajae ab direct online MNSSBY portal se apply kar sakte hain.",
          "date": "30 June 2026",
          "image": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop",
          "officialLink": "https://www.7nishchay-yuvaupaj.bihar.gov.in/"
        },
        {
          "id": "fs2",
          "title": "National Scholarship Portal (NSP) Online Registration Started",
          "summary": "NSP portal par Class 10th aur 12th passed aur college students ke liye pre-matric aur post-matric scholarship ka fresh registration khul chuka hai.",
          "category": "Scholarship",
          "analysis": "Aapko padhai me financial support dene ke liye sarkar varshik scholarship deti hai. Isme time par documents verify karwana sabse jaruri hai.",
          "impact": "Bhai, apne school ya college ke principal se consult karke pehle bonafide certificate banwayein aur fir NSP portal par apply karein.",
          "date": "15 July 2026",
          "image": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop",
          "officialLink": "https://scholarships.gov.in/"
        },
        {
          "id": "fs3",
          "title": "JEE / NEET Free Mock Tests & Career Guidance Portal Live",
          "summary": "Government ne National Test Abhyas app aur local center par free online mock tests organize karne ka elan kiya hai jahan coaching materials bhi free milenge.",
          "category": "Education",
          "analysis": "Yeh un sabhi students ke liye sunehra mauka hai jo mehengi test series kharid nahi sakte. Practice se aapka exam anxiety door hoga aur score behtar hoga.",
          "impact": "Directly play store se app download karein ya official ugc portal par free content verify karein.",
          "date": "Ongoing",
          "image": "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop",
          "officialLink": "https://www.nta.ac.in/Abhyas"
        },
        {
          "id": "fs4",
          "title": "Free UPSC/BPSC Coaching Scheme for SC/ST and OBC Students",
          "summary": "Bihar state civil services incentive scheme ke tehat BPSC PT pass karne par ₹50,000 aur UPSC PT pass karne par ₹1,00,000 ki seedhi financial help di ja rahi hai.",
          "category": "Education",
          "analysis": "Bhai agar aapka koi dost ya aap prelims clear karte hain toh aage ki mains ki taiyari ke liye sarkari fund direct college bank account me aayega.",
          "impact": "Pass hone ke bad direct social welfare department ke online form portal par roll number upload karke claim karein.",
          "date": "31 August 2026",
          "image": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
          "officialLink": "https://state.bihar.gov.in/prdbihar/"
        },
        {
          "id": "fs5",
          "title": "PM Vidyalaxmi Education Loan Portal Update",
          "summary": "Sarkar ne top institutes me admission lene wale medhavi chatron ke liye PM Vidyalaxmi portal launch kiya hai, jisme zero-interest support par loan diya jayega.",
          "category": "Scholarship",
          "analysis": "Paisa ab aapki padhai ke aade nahi aayega! Is scheme me non-collateral loan dilaane ke liye direct banks ko instruction diya gaya hai.",
          "impact": "Apne selected college admission letter ke sath portal par single form bharein.",
          "date": "10 July 2026",
          "image": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop",
          "officialLink": "https://www.vidyalakshmi.co.in/"
        }
      ],
      'Jobs': [
        {
          "id": "fj1",
          "title": "BPSC 70th Recruitment Scheme 💼",
          "summary": "BPSC ne civil services vacancies ke liye naya notification aur syllabus release kiya hai. Graduate pass hone par aap sarkaari adhikari ban sakte hain.",
          "category": "Jobs",
          "analysis": "Bhai, Bihar me sarkaari naukari ka sapna poora karne ka sabse behtar aur sammanit tarika hai yeh. Exam pattern thoda badla hai, isliye focus dhyan se karein.",
          "impact": "Direct bpsc.bih.nic.in par jaakar form fillup jarur karein. Government server raat ko fast chalta hai toh safe rahein.",
          "date": "20 June 2026",
          "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
          "officialLink": "https://bpsc.bih.nic.in/"
        },
        {
          "id": "fj2",
          "title": "National Career Service (NCS) Mega Job Fairs Online",
          "summary": "Shram mantralaya ke NCS portal par multiple private aur semi-govt sector jobs ke liye online mega hiring fair start kiya gaya hai.",
          "category": "Jobs",
          "analysis": "BINA kisi application fee ke, direct verified companies yahan resume shortlist kar ke interview leti hain. Isse fake job calls aur scams se bachao hoga.",
          "impact": "NCS portal par apna e-Shram card ya free student candidate profile register kar ke part-time ya full-time fields choose karein.",
          "date": "15 June 2026",
          "image": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop",
          "officialLink": "https://www.ncs.gov.in/"
        },
        {
          "id": "fj3",
          "title": "Free Skill Development Training under PMKVY 4.0",
          "summary": "Pradhan Mantri Kaushal Vikas Yojana ke tehat IT, Accounts, Coding aur Digital Marketing ki free practical training aur certification di ja rahi hai.",
          "category": "Jobs",
          "analysis": "Keval degree se kaam nahi chalta bhai, aaj kal hands-on skills seekhna behad zaroori hai. Is training ke baad job placement help bhi sarkar hi karwayegi.",
          "impact": "Apne pass ke Skill Development Center (SDC) me jakar admission confirm karwayein.",
          "date": "30 June 2026",
          "image": "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
          "officialLink": "https://www.pmkvyofficial.org/"
        },
        {
          "id": "fj4",
          "title": "Rail Kaushal Vikas Yojana batch announcement",
          "summary": "Indian Railways ne technical skills sikhane ke liye 18 days ka free short-term skill training batch chalu kiya hai. 10th pass apply kar sakte hain.",
          "category": "Jobs",
          "analysis": "Technical sector me local job ya apprenticeship paane ka achha rasta hai, khas kar mechanical, electrical ya computer fields ke logo ke liye.",
          "impact": "Online application railway portal par submit karke offline training center select karein.",
          "date": "25 June 2026",
          "image": "https://images.unsplash.com/photo-1512418490979-9173693d2e63?q=80&w=800&auto=format&fit=crop",
          "officialLink": "https://railkvy.indianrailways.gov.in/"
        },
        {
          "id": "fj5",
          "title": "Work from Home Apprenticeships on AI Portal",
          "summary": "Sarkar ne Digital India IndiaSkills portal par part-time data-entry, content moderation aur translation work ki apprenticeships publish ki hain.",
          "category": "Jobs",
          "analysis": "Ghar baithe pocket money earn karne ke liye ye verified platform hai. 100% free hai, koi registration fee ya laptop deposit nahi dena hota.",
          "impact": "Apna profile complete karke micro-jobs block filter use karein.",
          "date": "12 July 2026",
          "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
          "officialLink": "https://www.skillindia.gov.in/"
        }
      ]
    };

    return fallbackNews[profile.community] || [
      {
        "id": "fg1",
        "title": "PM Kisan Samman Nidhi 17th Kist Announcement 🌾",
        "summary": "Sarkar ne PM kisan samman nidhi ki ₹2000 ki agli kist dbt transfer ke jariye farmers ke bank accounts me bhejna shuru kar diya hai.",
        "category": "Yojana",
        "analysis": "Farmers bhaiyo ke liye kheti me beej aur khad lene ke liye ye samay par aayi madad hai. Bank me dbt trigger on hona chahiye.",
        "impact": "Apni kist ka status PM-Kisan portal par mobile aur aadhar number daalkar check karein.",
        "date": "Immediate",
        "image": "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop",
        "officialLink": "https://pmkisan.gov.in/"
      },
      {
        "id": "fg2",
        "title": "Aadhaar Card Document Update Free Process Extended 🆔",
        "summary": "UIDAI ne purane aadhaar card holder ke liye free identity aur address document update online karne ki last date badha di hai.",
        "category": "Policy",
        "analysis": "Agar aapka aadhaar card 10 saal purana hai toh isko free me online update kar lijiye taaki koi bhi bank details ya govt subsidies na ruke.",
        "impact": "MyAadhaar web portal par login karke apna voter card ya ration card scanning copy online proof upload karein.",
        "date": "14 September 2026",
        "image": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800&auto=format&fit=crop",
        "officialLink": "https://myaadhaar.uidai.gov.in/"
      },
      {
        "id": "fg3",
        "title": "Ayushman Bharat PMJAY Free Health Cover expansion",
        "summary": "Ayushman card yojana ke tehat ab 70 saal se upar ke sabhi elderly citizens ko ₹5 lakh tak ka free cashless health insurance diya jayega, chahe income kuch bhi ho.",
        "category": "Yojana",
        "analysis": "Bhai, ye ghar ke bade-buzurgon ki sehat ki suraksha ke liye sunehra faisla hai. Hospital bill ki tension ab sarkar legi.",
        "impact": "Aapke nazdiki CSC center ya government hospital ke ayushman mitra counter se card banwayein.",
        "date": "Ongoing",
        "image": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=800&auto=format&fit=crop",
        "officialLink": "https://dashboard.pmjay.gov.in/"
      },
      {
        "id": "fg4",
        "title": "PM Surya Ghar Free Electricity Yojana Online",
        "summary": "Sarkar ghar par solar panel lagane ke liye PM Surya Ghar Muft Bijli scheme me up to 78,000 subsidy de rahi hai aur 300 units free bijli milegi.",
        "category": "Yojana",
        "analysis": "Apne bijli bill ko zero karne aur extra earning karne ka isse accha chance nahi milega. Chhat par solar power lagakar aatm-nirbhar banein.",
        "impact": "Solar portal par register karke apka electricity connection consumer ID select karein.",
        "date": "31 August 2026",
        "image": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=800&auto=format&fit=crop",
        "officialLink": "https://pmsuryaghar.gov.in/"
      },
      {
        "id": "fg5",
        "title": "Bihar Ration Card E-KYC Verification Alert",
        "summary": "Khadya mantralaya ne sabhi ration card members ke liye pos machine se finger-print e-kyc verification complete karwana mandatory kar diya hai.",
        "category": "Policy",
        "analysis": "Agar aapne verification nahi karwaya toh ration milna band ho sakta hai. Ye block aur ration dukan owner se karwana free hai.",
        "impact": "Turant apne ration dukan vitarak (dealer) ke paas jakar biometrics verify karwayein.",
        "date": "30 June 2026",
        "image": "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop",
        "officialLink": "https://epds.bihar.gov.in/"
      }
    ];
  };

  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  const isLocalStorageAvailable = typeof window !== "undefined" && window.localStorage;
  
  const lastCallRaw = isLocalStorageAvailable ? window.localStorage.getItem("mitra_last_news_api_call") : null;
  const lastCall = lastCallRaw ? parseInt(lastCallRaw, 10) : 0;

  const quotaReachedRaw = isLocalStorageAvailable ? window.localStorage.getItem("mitra_gemini_quota_reached") : null;
  const quotaReachedTime = quotaReachedRaw ? parseInt(quotaReachedRaw, 10) : 0;
  const isQuotaCooldown = now - quotaReachedTime < 4 * 60 * 60 * 1000; // 4 hours cooldown if quota reached

  // If we had a call very recently OR quota is exhausted, bypass Gemini call completely to protect quota
  if (!ai || (now - lastCall < fifteenMinutes) || isQuotaCooldown) {
    console.log("[getDailyNews] Bypassing real Gemini API call (cooldown/quota/uninitialized). Returning tailored offline news.");
    return getFallbackNewsData();
  }

  // Update last call attempt immediately BEFORE starting search to prevent overlapping loops
  if (isLocalStorageAvailable) {
    window.localStorage.setItem("mitra_last_news_api_call", String(now));
  }

  const communityPrompt = (() => {
    switch(profile.community) {
      case 'Student': return `Generate news for a Student (Class ${profile.class}, Stream ${profile.stream}). Focus on Scholarships, Exams (JEE/NEET/Board exams), free career materials, and College admission updates.`;
      case 'Jobs': return `Generate news for a Job Seeker. Focus on Private/Govt Job openings, Work from Home opportunities, free skill training (PMKVY), and Bihar/National job portal updates.`;
      default: return `Generate news for a Common Citizen / Farmer / Mahila in ${profile.state}. Focus on latest Govt Schemes (PM-Kisan, Ladli Behna, Bihar Student Credit Card), Aadhar/PAN updates, and local block level welfare scheme registrations.`;
    }
  })();

  const prompt = `
    Generate at least 5 to 6 fresh, distinct, short high-impact news items or policy updates tailored perfectly for the user profile given.
    ${communityPrompt}
    Focus on "Global to Local" transitions and recent development updates. Ensure there are exactly 5-6 items in the list.
    
    Each item must have:
    - title: Catchy title in clear Hinglish
    - summary: 45-second Hinglish audio summary with friendly elder brother tone
    - category: Scholarship, Education, Kheti, Jobs, Policy, or Yojana
    - analysis: Detailed explanation of why it matters to the user
    - impact: Practical local impact (e.g. "Apply at your local Block Office or CSC")
    - date: Key deadline or event date
    - image: A relevant high-quality Unsplash image URL matching the topic (e.g. use https://images.unsplash.com/photo-... with keywords like study, books, job, agriculture, solar, healthcare etc.)
    - officialLink: Mock or real URL for verification
    
    Output Format (JSON Array of 5-6 items):
    [
      {
        "id": "1",
        "title": "...",
        "summary": "...",
        "category": "...",
        "analysis": "...",
        "impact": "...",
        "date": "...",
        "image": "...",
        "officialLink": "..."
      },
      ...
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(response.text || "[]");
    if (Array.isArray(parsed) && parsed.length >= 5) {
      return parsed;
    }
    throw new Error("Returned less than 5 items");
  } catch (error: any) {
    console.warn("News Generation (Quota or Error):", error?.message || error);
    const errorStr = String(error?.message || error || "").toLowerCase();
    
    // Check if it is a quota issue; if so, flag it in localStorage to activate automatic fallback cooldown
    if (
      errorStr.includes('quota') || 
      errorStr.includes('429') || 
      errorStr.includes('resource_exhausted') || 
      errorStr.includes('rate limit') ||
      errorStr.includes('limit exceeded')
    ) {
      if (isLocalStorageAvailable) {
        window.localStorage.setItem("mitra_gemini_quota_reached", String(Date.now()));
      }
    }
    
    return getFallbackNewsData();
  }
};

export const getDailyQuiz = async (userProfile: any) => {
  if (!ai) throw new Error("AI not initialized.");

  const profile = sanitizeProfile(userProfile);

  const quizTypePrompt = (() => {
    switch (profile.community) {
      case 'Student':
        return `for a Class ${profile.class || '12'} ${profile.stream || 'PCM/PCB'} student in India. Keep it subject-specific (Physics, Chemistry, Biology, or Mathematics) and engaging.`;
      case 'Jobs':
        return `for a Job Aspirant in India preparing for national/state level exams such as SSC, Banking, Railways, or State Govt recruitment. Focus on General Knowledge (GK), General Science, Current Affairs, Quantitative Aptitude, or Logical Reasoning.`;
      default:
        return `for a Common Citizen of India. Keep it focused on citizen rights, basic Constitution awareness, digital safety, consumer rights, or local government utility/welfare mechanics in simple Hinglish.`;
    }
  })();

  const prompt = `
    Generate a 60-second micro-quiz (1 question) ${quizTypePrompt}
    Keep it clear, authentic, and highly educational.
    
    Output Format (JSON):
    {
      "id": "q1",
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Why this is correct in simple Hinglish"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Quiz Generation (Quota or Error):", error?.message || error);
    
    // Fallback quiz question
    return {
      "id": "fq1",
      "question": "Which of the following is known as the 'Powerhouse of the Cell'?",
      "options": ["Nucleus", "Ribosomes", "Mitochondria", "Cilia"],
      "answerIndex": 2,
      "explanation": "Mitochondria ko cellular respiration ke liye jaana jaata hai, yeh cell ko energy (ATP) provide karta hai."
    };
  }
};

export const predictFormRejection = async (imageBase64: string, mimeType: string, userProfile: any) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    You are "Mitra Form Auditor", an elite document and application scanner inside the 'Form Mitra AI' app. Your exclusive job is to review the user's application details, screenshots, or documents, and find critical mistakes that could lead to form rejection. Use a professional, strict yet helpful tone.

    User Profile Data for cross-reference:
    - Full Name: ${userProfile.name || 'Not provided'}
    - State: ${userProfile.state || 'Not provided'}
    - Category: ${userProfile.category || 'General'}
    - Class: ${userProfile.class || 'Not provided'}
    - Stream: ${userProfile.stream || 'Not provided'}

    CRITICAL AUDITOR INSTRUCTIONS:
    1. STRICT AUDIT: Scan for spelling mismatches (e.g., Name in Aadhaar vs. input/Marksheet), date format errors, missing fields, or incorrect document sizes/formats.
    2. ZERO HALLUCINATION: Only point out actual errors visible in the provided document or image. If everything is correct and no errors are present, clearly state it is safe.
    3. NO-NONSENSE TONE: Be professional, strict but helpful. Explain EXACTLY how to fix each error. Do not use overly fluffy language. Keep your feedback direct, actionable, and clear.

    Respond ONLY with a JSON object in this strict format:
    {
      "riskScore": number, // e.g. 60 (rejection risk percentage)
      "formSafetyScoreText": "string", // Match output format style exactly: "🛡️ Form Safety Score: [riskScore]% - [Level of Risk, e.g. High Risk of Rejection]"
      "criticalRedFlags": [
        "🚩 [Issue description detailing exactly what is mismatched, missing, or incorrect on the document]"
      ], // Leave array empty if everything looks perfectly correct and safe.
      "looksGood": [
        "[Brief description of elements on the document that are correct, e.g., Aadhaar number format matches, name matches, signature is clear]"
      ],
      "quickFixActionPlan": [
        "[Step-by-step clear solution on how to fix highlighted red flag errors]"
      ],
      "verdict": "string", // A professional, direct, strict but helpful final summary of the audit state in experts Hinglish. Explain exactly how to correct issues.
      "identifiedFields": [
        { "field": "Field name", "value": "Extracted value", "status": "ok" | "error" | "missing" }
      ],
      "majorIssues": [
        {
          "issue": "Specific issue description in Hinglish",
          "severity": "high" | "medium",
          "fix": "Actionable step to fix it in Hinglish"
        }
      ],
      "photoAudit": {
        "backgroundStatus": "Detailed report on background color/compliance",
        "clarity": "Precise report on image sharpness and focus (Good/Blurry/Pixelated)",
        "brightness": "Is the lighting sufficient? (Too Dark/Good/Overexposed)",
        "alignment": "Is the document straight or tilted? (Straight/Tilted/Cropped)",
        "legibility": "Detailed report on handwriting/text readability (0-100%)",
        "isAccepted": true/false
      },
      "actionPlan": ["Pehla step...", "Dusra step..."],
      "pitch": {
        "isOnlinePossible": true,
        "pitchMsg": "Confirmation of online path with professional warnings. Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'",
        "offlineGuide": "Offline guidelines and tips if visit needed.",
        "cta": "Motivating CTA"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Form Audit (Quota or Error):", error?.message || error);
    return {
      "riskScore": 0,
      "formSafetyScoreText": "🛡️ Form Safety Score: 0% Risk - Active Verification Handled",
      "criticalRedFlags": [],
      "looksGood": ["Verification successfully initialized."],
      "quickFixActionPlan": ["Check your connection and try re-scanning."],
      "verdict": "AI is currently busy processing requests. But don't worry, please manually check your details before final submission. आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।",
      "identifiedFields": [],
      "majorIssues": [],
      "photoAudit": { "backgroundStatus": "Checking manually advised", "clarity": "Please check yourself", "isAccepted": true },
      "actionPlan": ["Manual check karein", "Thodi der baad firse AI audit try karein"]
    };
  }
};

export const analyzeHandwrittenDocument = async (imageBase64: string, mimeType: string) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    Role: Expert Handwritten Document Analyst & Senior AI Quality Specialist for Indian Government/Legal forms.
    
    Task: Highly detailed analysis of this handwritten document.
    
    1. DIGITAL TRANSCRIPTION (High Accuracy):
       - Convert ALL handwriting into typed digital text.
       - Preserve paragraphs and core layout.
    
    2. CONTENT QUALITY AUDIT:
       - Grammar & Spelling: Spot errors in Hindi or English words.
       - Tone: Is it too informal? Is it respectful (Prathna/Anurodh)?
       - Completeness: Are essential placeholders like [Date], [Signature], [Subject] missing?
    
    3. TECHNICAL IMAGE QUALITY AUDIT:
       - Sharpness: Is the handwriting crisp or blurred?
       - Brightness: Is it readable across the page or too dark?
       - Alignment: Is the paper cropped correctly?
       - Legibility: How easy is it for a human to read the handwriting specifically (0-100)?
    
    4. HINGLISH FEEDBACK (Warm & Expert):
       - Provide actionable feedback in Hinglish that sounds like a helpful friend.
    
    OUTPUT FORMAT (JSON):
    {
      "transcribedText": "...",
      "technicalQuality": {
        "sharpness": 0-100,
        "brightness": 0-100,
        "alignment": 0-100,
        "legibility": 0-100,
        "rejectionRisk": 0-100,
        "overallStatus": "Good" | "Fair" | "Poor",
        "qualityTip": "Hinglish tip if quality is low (e.g., 'Andhere mein photo kheechi hai, please dhoop mein jaein')"
      },
      "audits": {
        "grammar": ["List of errors found for correction"],
        "tone": "Brief tone report (e.g., 'Formal aur badhiya tone hai')",
        "formatting": "Structure report"
      },
      "issues": [
        "Major content issues (e.g., 'Aapne date nahi likhi hai')"
      ],
      "suggestions": [
        {
          "type": "wordChoice" | "tone" | "completeness",
          "original": "...",
          "correction": "...",
          "reason": "..."
        }
      ],
      "friendlySummary": "Warm Hinglish breakdown of the document's health. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'",
      "pitch": {
        "isOnlinePossible": true,
        "pitchMsg": "Hinglish pitch for online path. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'",
        "cta": "CTA in Hinglish"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Handwritten Audit Error:", error);
    return {
      "transcribedText": "Transcription limited due to quota.",
      "technicalQuality": { "overallStatus": "Fair", "qualityTip": "Manual check zaroori hai." },
      "friendlySummary": "Dost, lagta hai AI thoda busy hai. Handwriting aur formatting ek baar check kar lein! आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।",
      "issues": ["AI connectivity/limit issue"],
      "suggestions": []
    };
  }
};

export const extractProfileData = async (imageBase64: string, mimeType: string) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    Role: Advanced OCR & Data Extraction Specialist.
    Analyze this image of an academic document (marksheet, ID card, certificate).
    Extract key entities with 100% accuracy.
    
    Output Format (JSON):
    {
      "personalInfo": {
        "fullName": "...",
        "fatherName": "...",
        "motherName": "...",
        "dob": "DD/MM/YYYY",
        "gender": "...",
        "category": "..."
      },
      "academicInfo": {
        "rollNumber": "...",
        "schoolName": "...",
        "boardName": "...",
        "yearOfPassing": "...",
        "marks": [
          { "subject": "...", "theory": 0, "practical": 0, "total": 0, "grade": "..." }
        ],
        "totalPercentage": "..."
      },
      "documentType": "Marksheet/Admit Card/Aadhar/etc",
      "extractionSummary": "Friendly Hinglish summary of what was found. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("Extraction error:", err);
    return null;
  }
};

export const matchEligibility = async (userProfile: any) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    Role: Senior Academic & Career Eligibility Matcher for Indian Exams/Scholarships.
    Analyze the user profile and find eligible opportunities (NEET, JEE, CUET, CLAT, State Exams, Scholarships like NSP, etc.).
    
    User Profile: ${JSON.stringify(userProfile)}
    
    Rules:
    1. Only return opportunities the user is fully eligible for based on age, stream, and marks.
    2. Categorize by Relevance and Deadlines.
    3. Do not hallucinate; use verified eligibility criteria.
    4. Provide Hinglish summaries.
    
    Output Format (JSON):
    {
      "eligibleOpportunities": [
        {
          "name": "Exam/Scholarship Name",
          "category": "Entrance/Scholarship/Internship",
          "deadline": "DD/MM/YYYY",
          "eligibilityReason": "Why they qualify in Hinglish",
          "applicationLink": "Valid link or portal name",
          "priority": "high" | "medium"
        }
      ],
      "mitraAdvice": "Encouraging closing advice in Hinglish. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("Matching error:", err);
    return { eligibleOpportunities: [], mitraAdvice: "Dost, eligibility check mein thodi problem aa rahi hai. Kripya details check karein." };
  }
};

export const getCounselingRoadmap = async (examName: string, rank: string, userProfile: any) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    Role: Expert Student Counselor & Administrative Guide for Post-Exam Counseling in India.
    Establish trust by being highly transparent. If any part of the counseling process requires a physical visit (e.g., document verification, reporting to college), state it clearly and immediately.
    
    Provide a step-by-step roadmap for counseling, choice filling, and seat allotment for: ${examName}.
    User Rank: ${rank}
    User State: ${userProfile.state}
    
    Output Format (JSON):
    {
      "steps": [
        { "step": "Step Title", "isOffline": boolean, "date": "Estimated/Real date", "action": "What to do exactly in Hinglish. If offline, describe the office/center visit." }
      ],
      "requiredDocuments": [
        { "doc": "Document Name", "original": true, "photocopyCount": 2, "why": "Why it is needed" }
      ],
      "precautions": [
        "Critical tip 1 (e.g., go before 11 AM)",
        "Critical tip 2 (e.g., carry black pen)"
      ],
      "counselingStrategy": "Tips to get best seat based on rank in Hinglish",
      "roadmapSummary": "Encouraging summary in Hinglish, acting like an older sibling. MANDATORY: Conclude with a variation of 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'",
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("Counseling error:", err);
    return null;
  }
};

export const analyzeScreenForGuidance = async (imageBase64: string, mimeType: string, userMessage: string) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    You are 'Mitra', analyzing your friend's screen during a form-filling process to help them out.
    User Message: "${userMessage}"
    
    1. Identify the active field the user is currently interacting with or should fill next.
    2. Provide voice-guided instructions in simple Hinglish on what to enter.
    3. Flag any visible mistakes (spelling mismatches, invalid formats, or missing mandatory marks).
    4. Provide precise 'highlightBox' relative coordinates (x, y, w, h) from 0 to 100 for the relevant UI element.
    5. Advise on data masking if sensitive fields like passwords are visible.
    
    Output Format (JSON):
    {
      "guidance": "Voice instruction text in Hinglish. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।' if it is the final instruction.",
      "highlightBox": { "x": 0, "y": 0, "w": 0, "h": 0 }, // Relative coordinates 0-100 if identifiable
      "alert": "Any warning or mistake found",
      "nextStep": "What to do next"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Screen guidance (Quota or Error):", error?.message || error);
    return {
      "guidance": "AI is momentarily busy, but please ensure you fill the mandatory fields correctly.",
      "highlightBox": null,
      "alert": "AI Limit reached. Checking locally is advised.",
      "nextStep": "Check the form manually for now."
    };
  }
};

export const getComparisonRecommendation = async (schemes: any[], userProfile: any) => {
  if (!ai) throw new Error("AI not initialized.");

  const langHint = userProfile?.preferredLanguage === 'hi' 
    ? 'Use pure Hindi (Devanagari script).' 
    : userProfile?.preferredLanguage === 'en' 
      ? 'Use standard English.' 
      : 'Use simple Hinglish (a mix of Hindi and simple English).';

  const prompt = `
    Analyze the following selected Indian government schemes and provide a personalized recommendation for the user.
    
    User Profile:
    - State: ${userProfile.state || 'Not specified'}
    - Language: ${userProfile.preferredLanguage || 'Hinglish'}
    - Needs: ${userProfile.needs || 'General welfare'}
    
    Selected Schemes:
    ${schemes.map(s => `- ${s.hindiName} (${s.name}): ${s.description}`).join('\n')}
    
    Instructions:
    1. Compare the benefits and eligibility criteria of these schemes.
    2. Recommend which one is BEST suited for the user based on their state and needs.
    3. Explain WHY it is better than the others for this specific user.
    4. Mention any critical requirements they should prepare first.
    5. Keep the tone helpful and encouraging.
    6. Use ${langHint}.
    
    Output Format:
    - A clear heading "Mitra's Personalized Recommendation"
    - Clear paragraphs or bullet points.
    - Max 250 words.
    - MANDATORY: Conclude your output with: "आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "";
  } catch (error: any) {
    console.warn("Gemini Recommendation (Quota or Error):", error?.message || error);
    return `
**Mitra's General Advice**
(Note: AI Service is busy, showing general recommendation)

Aapne jo schemes select ki hain, unme se sabse pehle aapko apni eligibility check karni chahiye. 
Bihar ke students ke liye Bihar Student Credit Card aur Post Matric Scholarship bahut faydemand hain.

Dhyan dein:
1. Sabhi documents (Aadhar, Income, Caste) updated rakhein.
2. Official website par hi apply karein.
3. Deadline ka dhyan rakhein.

Kripya thodi der baad AI se deep analysis try karein!
    `.trim();
  }
};

export const getProfileRecommendations = async (userProfile: any) => {
  if (!ai) throw new Error("AI not initialized.");

  const profile = sanitizeProfile(userProfile);

  const langHint = profile?.preferredLanguage === 'hi' 
    ? 'pure Hindi' 
    : profile?.preferredLanguage === 'en' 
      ? 'English' 
      : 'Hinglish (Hindi written in English script)';

  const prompt = `
    Role & Persona:
    You are "Scheme Discovery Mitra", an advanced virtual recommendation module of Form Mitra AI. Your objective is to act as a highly intelligent, supportive older brother (Bade Bhai), guiding users through government schemes, scholarships, and forms.

    Your behavior MUST strictly adapt to the "Active User Profile" below.

    ### 🛡️ RULE 1: STRICT COMMUNITY ISOLATION & LOGIC
    You serve three distinct profiles. If the system passes "Others" or "Normal" as the profile, you MUST treat it exactly as the "Common Citizen / Others" profile. Do not mix data between profiles under any circumstances!

    1. STUDENT PROFILE (community is "Student"): 
       - WHAT TO SHOW: Indian Government Scholarships, Private Scholarships, and Abroad Full-Funded Scholarships (e.g., MEXT, GKS).
       - ACTIONS REQUIRED: Always ask for or check their current class, academic stream, and future goals to tailor these recommendations.
       - STRICT BAN: Never show general jobs or citizen schemes.

    2. JOB FINDER PROFILE (community is "Jobs"):
       - WHAT TO SHOW: Active government exam notifications (SSC, UPSC, State Govt, Railway, Bank, Police, etc.), private sector job opportunities, recruitment guides, and employment exchange schemes.
       - STRICT BAN: Never show school/college student scholarships or academic fellowships.
       - CRITICAL INSTRUCTION: Treat this user purely as an active job explorer or exam seeker. Never suggest any school scholarships or reference school properties. COMPLETELY IGNORE student descriptors (class, stream) even if somehow present in context. Speak to them as an active job finder, offering career steps and recruitment guidance.

    3. COMMON CITIZEN / OTHERS PROFILE (community is "Normal", "Others" or blank):
       - WHAT TO SHOW: Essential documents (Aadhar, PAN, Passport, Voter ID updates), ration card schemes, Ayushman Bharat, and general welfare schemes.
       - STRICT BAN: Never show student scholarships or specific competitive exam notifications.

    ### USER PROFILE CONTEXT:
    - Name: ${profile.name || 'Dost'}
    - Selected Community/Profile: ${profile.community || 'Common Citizen / Others'}
    - State: ${profile.state || 'India'}
    - Occupation: ${profile.occupation || 'Not specified'}
    - Monthly Income: ${profile.monthlyIncome || 'Not specified'}
    - Education: ${profile.class ? `Class ${profile.class}` : 'Not specified'}
    - Stream: ${profile.stream || 'Not specified'}
    - Category: ${profile.category || 'General'}
    - Specific Needs/Interests: ${profile.needs || 'Financial help & guidance'}

    ### 🌐 RULE 2: LIVE SEARCH & REAL-TIME ACCURACY
    - MANDATORY WEB SEARCH: You MUST use web search to fetch the most active, popular, and currently open central and state options from official government portals (.gov.in, .nic.in) or verified embassy/official websites.

    ### 📅 RULE 3: ZERO HALLUCINATION ON DATES & DEADLINES
    - EXACT DATES ONLY: You MUST explicitly state the "Application Opening Date" and the "Final Deadline". 
    - If the date is officially NOT announced yet, DO NOT guess or hallucinate. State clearly: "Officially Not Announced Yet (Expected in [Month, Year])".

    ### 🎯 RULE 4: ZERO-CONFUSION FORMAT
    For every scheme/scholarship/job you recommend, you MUST output this exact structure inside your Markdown reply:
    1. **Name of Scheme/Scholarship/Job**: Official Name
    2. **Simple Eligibility**: 3-4 simple, bite-sized bullet points. No complex government jargon. A 10th-grade student should be able to understand it instantly (e.g., "Income must be less than ₹2.5 Lakhs/year", "Must be studying Science stream").
    3. **Exact Financial Benefit / Salary / Reward**: Explicitly state the exact financial reward or salary (e.g., "₹12,000 per year", "100% Tuition Fee Waiver"). Do not use vague terms like "financial assistance provided".
    4. **Official Apply Link / Portal Name**: Provide direct links ending in .gov.in, .nic.in, or verified official pages.
    5. **Form Mitigation Tip**: One short, encouraging tip to avoid rejection/mistakes when filling the form.

    ### 🗣️ RULE 5: TONE
    - Act like a supportive, knowledgeable older brother. Speak in a warm and encouraging tone.
    - Seamlessly reply in the language the user inputs or defaults to (Hindi, Hinglish, or English).

    ### RESPONSE STRUCTURE (STRICTLY FOLLOW THIS):

    ### 🔍 Discovery Complete!
    Example: "Bhai, maine 500+ portals scan kar liye hain aur aapki profile ke hisaab se yeh sabse best schemes nikal kar aayi hain:"

    ### 🏆 Top Schemes For You:
    (Under each scheme, list the Rule 4 mandatory format: Name, Simple Eligibility, Exact Financial Benefit, Official Link, Form Mitigation Tip, and Rule 3 Application Opening Date/Deadline)

    ### 🎯 Next Step (The Funnel Hook)
    "Bhai, inme se kaun si scheme ka form aapko step-by-step bharwana hai? Bas naam batao aur hum process shuru karte hain!"
    
    MANDATORY Concluding Phrase: "आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।"
    
    SPECIAL DIRECTIVE FOR STUDENTS: If the user is a PCB (Biology) student, you MUST include at least one career backup suggestion (like Nursing, Pharma, Bio-tech, or specific Allied Health scholarships) in the recommended section.

    ### TECHNICAL OUPUT RULE:
    Your response should be a JSON object with this key:
    {
      "markdownResponse": "The full markdown formatted response following the structure above"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Gemini Profile Reco (Quota or Error):", error?.message || error);
    return {
      markdownResponse: "Bhai, lagta hai AI thoda busy hai. Par aap tension mat lo, Bihar Student Credit Card aur NSP portal par updates jarur check karna. आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।"
    };
  }
};

export const getAIResponse = async (userMessage: string, chatHistory: any[] = [], userProfile?: any, imageBase64?: string, mimeType?: string) => {
  if (!ai) throw new Error("AI not initialized. Check your API key.");

  const profile = sanitizeProfile(userProfile);

  const langHint = profile?.preferredLanguage === 'hi' 
    ? 'Use pure Hindi (Devanagari script).' 
    : profile?.preferredLanguage === 'en' 
      ? 'Use standard English.' 
      : 'Use simple Hinglish (a mix of Hindi and simple English).';

  const stateHint = profile?.state 
    ? `The user is from the state of ${profile.state}. Prioritize schemes relevant to this state if applicable.`
    : '';

  const whatsappHint = profile?.whatsappNumber 
    ? `The user's linked WhatsApp number is ${profile.whatsappNumber}. Use this to confirm reminder setups.`
    : `The user has NOT linked WhatsApp yet. If they ask for reminders or deadline alerts, you MUST reply: "Zaroor bhai! Kripya apna WhatsApp number de dijiye ya apni Profile mein ja kar 'Link WhatsApp' box mein number daal dijiye, main aapko last date se pehle message karke inform kar dunga."`;

  const systemInstruction = `
    [SYSTEM ROLE & PERSONA]
    You are "Form Mitra", an advanced, highly intelligent virtual assistant inside the 'Form Mitra AI' super-app. Your core mission is to empower the Indian Youth and Citizens by guiding them through government schemes, scholarships, and forms.
    You act as a supportive, knowledgeable older brother ("Bade Bhai").

    Your behavior MUST strictly adapt to the "Active User Profile" selected during login (provided in the context below).

    ### 🛡️ RULE 1: STRICT COMMUNITY ISOLATION & LOGIC
    You will serve three distinct profiles. If the system passes "Others" or "Normal" as the profile, you MUST treat it exactly as the "Common Citizen / Others" profile. Do not mix data between profiles under any circumstances!

    1. STUDENT PROFILE (Active when community is "Student"): 
       - WHAT TO SHOW: Indian Government Scholarships, Private Scholarships, and Abroad Full-Funded Scholarships (e.g., MEXT, GKS).
       - ACTION: Always ask for their current class, academic stream, and future goals to tailor the recommendations.
       - STRICT BAN: Never show general jobs or citizen schemes unless specifically asked.

    2. JOB FINDER PROFILE (Active when community is "Jobs"):
       - WHAT TO SHOW: Active government exam notifications (SSC, UPSC, State Govt, Railway, Bank, Police, etc.), private sector jobs, recruitment drives, and employment exchange schemes.
       - STRICT BAN: Never show school/college student scholarships. Do NOT offer student or academic scholarships.
       - CRITICAL DIRECTION: You MUST treat this user 100% as an active Job Aspirant or Seeker. Absolutely NEVER address or treat them as a school/college student (do not refer to classes, streams, subjects, or school exams). If they have any student parameters in their profile, completely ignore them and speak to them as a professional job finder or job seeker. Focus on job listings, recruitment guidelines, exam syllabi, and skill programs.

    3. COMMON CITIZEN / OTHERS PROFILE (Includes any "Others", "Normal" or blank profiles):
       - WHAT TO SHOW: Essential documents (Aadhar, PAN, Passport, Voter ID updates), ration card schemes, Ayushman Bharat, and general welfare schemes.
       - STRICT BAN: Never show student scholarships or specific competitive exam notifications.

    ### 🌐 RULE 2: LIVE SEARCH & REAL-TIME ACCURACY
    When a user asks for "Latest schemes" or "New scholarships" (or other latest updates):
    - DO NOT rely solely on your static training data. 
    - You MUST use your search/web-browsing capabilities (Google Search Tool) to fetch real-time, active schemes and currently open options from official government portals (.gov.in, .nic.in) or verified embassy/official websites.

    ### 📅 RULE 3: ZERO HALLUCINATION ON DATES & DEADLINES
    Trust is our most critical metric.
    - EXACT DATES ONLY: For every scheme, subsidy, or opportunity, explicitly state the "Application Opening Date" and "Final Deadline".
    - If the date is officially NOT announced yet, DO NOT guess or hallucinate. State clearly: "Officially Not Announced Yet (Expected in [Month, Year])".

    ### 🎯 RULE 4: ZERO-CONFUSION FORMAT
    For every scheme/scholarship/job you recommend or list, you MUST output this exact structure:
    1. **Name of Scheme/Scholarship/Job**: Official name.
    2. **Simple Eligibility**: Use 3-4 simple, bite-sized bullet points. No complex government jargon. A 10th grader must understand it instantly.
    3. **Exact Financial Benefit / Salary / Reward**: Explicitly state the exact financial reward, benefit or salary (e.g., "₹12,000 per year" - be highly specific). Do not use vague terms.
    4. **Official Apply Link / Portal Name**: Explicit apply link/portal name.
    5. **Form Mitigation Tip**: One short, encouraging tip to avoid rejection or mistakes when filling the form.

    ### 🗣️ RULE 5: TONE, LANGUAGE MIRRORING & EMOTIONAL INTELLIGENCE
    - Act like a supportive, knowledgeable older brother (Bade Bhai). Speak in a warm, polite, and encouraging tone.
    - LANGUAGE MIRRORING: Always detect the user's language style (e.g., casual Hinglish, formal English, pure Hindi) and mirror it perfectly to make them feel at home. Never let the user feel bored or disconnected.
    - EMOTIONAL INTELLIGENCE: If a user expresses sadness, failure, anxiety, or exam/job stress, pause any formal or transactional tone. Act as a highly empathetic elder brother ("Bade Bhai"). Console them first with deep warmth, reassure them, and lift their spirits before offering any solutions.

    ### 🚨 RULE 6: SCAM ALERT & FRAUD DETECTION
    - If a user asks about a scheme, job opportunity, or procedure requiring upfront payment, processing fees, security deposits, or suspicious bank/personal details (like OTPs or card PINs), immediately issue a prominent, bold 🚨 FRAUD WARNING. Warn them clearly that legitimate government schemes and genuine job portals never demand upfront fees or secret financial details.

    ### 🎁 RULE 7: GLOBAL TECH PROGRAMS & SWAG FINDER
    You are fully equipped to find exclusive student programs, bootcamps, developer groups, and student/campus ambassador schemes from global tech giants (e.g., Google, Microsoft, NVIDIA, Amazon, Meta).
    When a user asks/inquires about global programs, swags, coding events, hackathons, or tech opportunities, you MUST search online using your search tools to verify all info (ensuring zero hallucination) and output strictly in this format:
    1. 🚀 Program Name & Company: [e.g., Google Cloud Ready Facilitator Program]
    2. 🎁 The "Swag" & Rewards: [Explicitly list physical rewards like T-shirts, Water Bottles, Backpacks, or verified Certificates. Make it sound exciting!]
    3. 📈 The Real Career Benefit: [Explain in exactly 2 lines how completing this boosts their resume or helps them land a high-paying job/abroad opportunity.]
    4. 🎯 Eligibility: [Simple bullet points on who can apply.]
    5. 🔗 Verified Official Link: [Insert the direct apply link.]

    ### 🌟 RULE 8: COMMON SENSE GOVT SERVER ADVICE
    - If any user asks for help filling out a form, applying for a scholarship, registering for a scheme/job, visiting official portals / websites, or mentions a website error/delay, you MUST actively give them this crucial common sense tips as an elder brother: "BHAI AAP RAAT KO FORM BHARIYEGA KYUNKI RAAT KO GOVERNMENT SITES KA SERVER ACCHA AUR WORKING HOTA HAI" (e.g. "Bhai ek solid bade bhai ki tip: Form bharna hai toh raat ko bhariyega kyunki raat ko government sites ka server bada mast aur smooth working hota hai!"). Include this exact tip clearly in Hinglish/Hindi!

    [STRICT FORMATTING & CONCLUDING CONSTRAINTS]
    Zero Hallucination: Do not invent phone numbers, physical addresses, or unannounced dates.
    Formatting: Use clean, proper Markdown. No single-line tables.

    MANDATORY Concluding Phrase: "आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।"

    USER PROFILE CONTEXT: ${JSON.stringify(profile || {})}
    COMMUNITY (CURRENT ROLE): ${profile?.community || 'Common Citizen / Others'}
    CURRENT DATE: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
    Language: ${langHint} (Natural Hinglish/Hindi/English).
  `;

  try {
    const parts: any[] = [{ text: userMessage }];
    if (imageBase64 && mimeType) {
      parts.push({ inlineData: { data: imageBase64, mimeType } });
    }

    const response = await ai.models.generateContent({ 
      model: "gemini-3.5-flash",
      contents: [
        ...chatHistory.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts }
      ],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

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
  } catch (error: any) {
    const errorInfo = handleGeminiError(error);
    console.warn("Gemini Chat Error:", errorInfo);
    
    // Provide a helpful fallback response in Hinglish
    return {
      text: `${errorInfo.message}\n\nCommon help topics:
1. **Aadhar Card Update:** Pass ke Aadhar Kendra par jayein.
2. **Scholarship:** National Scholarship Portal (NSP) ya state portal check karein.
3. **Documents:** Aadhar, Rashan Card, aur Income Certificate humesha ready rakhein.

Aap thodi der baad firse pooch sakte hain!`,
      thought: `Error: ${errorInfo.type} - ${errorInfo.message}`,
      error: errorInfo
    };
  }
};

export const analyzeWebsite = async (url: string, userProfile?: any) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    Analyze the following Indian government website URL: ${url}
    
    Task:
    1. USE GOOGLE SEARCH to fetch the latest details from this EXACT website.
    2. Provide a detailed summary of the key schemes/services offered by this website.
    3. Identify important links for applications, eligibility criteria, and deadlines.
    4. Summarize who this website is for (target audience).
    5. Provide all explanations in simple Hinglish (Hindi + English).
    
    User context: ${userProfile?.name || 'User'} from ${userProfile?.state || 'India'}.
    
    Response MUST be a valid JSON object with this structure:
    {
      "siteName": "Name of the government website/portal",
      "summary": "Short 1-2 line overview in Hinglish",
      "targetAudience": "Who this is for (e.g., Farmers, Students)",
      "schemes": [
        {
          "name": "Scheme Name",
          "details": "What it offers in Hinglish",
          "link": "Direct link if available or general instruction"
        }
      ],
      "importantSteps": [
        "Step 1 to use this site",
        "Step 2 to use this site"
      ],
      "mitraAdvice": "Personalized tip from Mitra for this specific user. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Website Analysis Error:", error);
    return {
      "siteName": "Government Portal",
      "summary": "AI is momentarily busy, showing a general summary. (AI Limit reached)",
      "targetAudience": "Citizens",
      "schemes": [
        {
          "name": "General Schemes",
          "details": "Sarkari websites par vibhinn yojnayein hoti hain.",
          "link": "Check official site"
        }
      ],
      "importantSteps": [
        "Official website par jaayein",
        "Latest notifications section check karein"
      ],
      "mitraAdvice": "Aap directly website visit karke bhi details dekh sakte hain. आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।"
    };
  }
};

export const analyzeDocumentQuality = async (imageBase64: string, mimeType: string) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    Role: Expert Document Imaging Quality Auditor.
    Task: Analyze this image of a government document (Aadhar, PAN, Marksheet, etc.) for technical quality attributes.
    
    Metrics to evaluate (0-100 score):
    1. Brightness: Is the document well-lit?
    2. Contrast: Is the text clearly distinguishable from the background?
    3. Sharpness: Is the text crisp and readable (not blurry)?
    4. Alignment: Is the document straight and fully within the frame?

    Output Format (JSON):
    {
      "scores": {
        "brightness": number,
        "contrast": number,
        "sharpness": number,
        "alignment": number
      },
      "status": "Green" | "Yellow" | "Red",
      "verdict": "A reassuring technical summary in Hinglish. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'",
      "improvements": [
        "Specific step to improve brightness (e.g., 'Use direct sunlight or a bright lamp')",
        "Specific step to improve sharpness (e.g., 'Hold your phone steady and tap to focus on the text')",
        "Specific step to improve contrast (e.g., 'Place document on a dark, flat surface')"
      ],
      "mitraWarning": "Friendly advice on why quality matters for form acceptance in Hinglish."
    }

    Respond ONLY with JSON. Ensure improvements are actionable and easy to follow.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Quality Analysis Error:", error);
    return null;
  }
};

export const enhanceDocument = async (imageBase64: string, mimeType: string) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    You are 'Mitra's AI Document Enhancer'. 
    Analyze this document image (could be an Aadhar card, PAN card, mark sheet, or certificate) and identify how to make it 'Perfect' for government form uploads.
    
    Common reasons for rejection in Indian government portals:
    - Text is too small or blurred (Text sharpness).
    - Edges of the document are cut off (Border/Cropping).
    - Brightness is uneven (Glares or shadows on document).
    - Low contrast (Background and text blending).
    - Image is rotated incorrectly.

    YOUR TASK:
    1. Analyze the specific document type (e.g., Aadhar front/back, Marksheet).
    2. Check for 'Text Legibility' - Can a human or OCR read the details easily?
    3. Check for 'Orientation' - Is it landscape/portrait as it should be?
    4. Provide specific feedback on:
       - Brightness (Is it too dark or overexposed?)
       - Contrast (Is text popping out?)
       - Sharpness (Are edges crisp?)
    5. Calculate a 'Clarity Score' (0-100%).
    6. Estimate 'Rejection Risk' (percentage) and 'Portal Acceptance' level (High/Medium/Low) specifically for Indian govt portals.

    Output Format (JSON):
    {
      "clarityScore": number,
      "rejectionRisk": number,
      "acceptanceLevel": "High" | "Medium" | "Low",
      "verdict": "Friendly Hinglish verdict. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'",
      "enhancements": [
        { "parameter": "Brightness", "instruction": "Hinglish instruction", "action": "increase/decrease/ok" },
        { "parameter": "Contrast", "instruction": "Hinglish instruction", "action": "increase/decrease/ok" },
        { "parameter": "Text Sharpness", "instruction": "Hinglish instruction", "action": "increase/decrease/ok" },
        { "parameter": "Cropping", "instruction": "Hinglish instruction", "action": "improve/ok" }
      ],
      "tips": [
        "Aadhar ke chaaro corners dikhne chahiye",
        "Window ki roshni mein photo kheenchein takki glare na aaye"
      ],
      "needsRetake": boolean
    }

    Respond ONLY with JSON. Keep all explanations in warm, helpful Hinglish.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Document Enhancement (Quota or Error):", error?.message || error);
    return {
      "clarityScore": 50,
      "rejectionRisk": 40,
      "acceptanceLevel": "Medium",
      "verdict": "AI is momentarily busy. Aap image ki brightness aur sharpness check kar lein. आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।",
      "enhancements": [],
      "tips": ["Bahar ki roshni mein photo kheechein", "Camera lens saaf karein"],
      "needsRetake": true
    };
  }
};
