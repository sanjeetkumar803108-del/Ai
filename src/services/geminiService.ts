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
  const errorStr = JSON.stringify(error).toLowerCase();
  
  if (errorStr.includes('quota') || errorStr.includes('429') || errorStr.includes('resource_exhausted')) {
    return {
      type: 'QUOTA',
      message: 'Bhai, AI limit khatam ho gayi hai. Kripya thodi der baad try karein (Quota Reset expected). आपको बिल्कुल टेंशन लेने की जरूरत नहीं है।'
    };
  }
  
  if (errorStr.includes('network') || errorStr.includes('xhr') || errorStr.includes('fetch') || errorStr.includes('failed to fetch')) {
    return {
      type: 'NETWORK',
      message: 'Internet connectivity mein thodi dikkat hai. Kripya apna connection check karein.'
    };
  }
  
  if (errorStr.includes('key') || errorStr.includes('api_key') || errorStr.includes('unauthorized')) {
    return {
      type: 'INVALID_KEY',
      message: 'AI initialization mein problem hai. Kripya developer se contact karein.'
    };
  }

  return {
    type: 'UNKNOWN',
    message: 'System mein kuch anjan dikkat aa gayi hai. Kripya thodi der baad koshish karein.',
    originalError: error
  };
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
        model: "gemini-3.1-flash-tts-preview",
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
      model: "gemini-3.1-pro-preview",
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
      model: "gemini-3.1-flash-preview",
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
      model: "gemini-3.1-pro-preview",
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
      model: "gemini-3.1-pro-preview",
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
  if (!ai) throw new Error("AI not initialized.");

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
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.warn("Smart Tip generation error:", error);
    return "Bhai, is scheme ke liye bas saare documents taiyaar rakho aur official site par up-to-date raho!";
  }
};

/**
 * Analyzes a filled form image against a scheme's requirements.
 */
export const analyzeFilledForm = async (imageFile: File, scheme: any): Promise<{
  isValid: boolean;
  errors: { field: string; message: string; severity: 'error' | 'warning' }[];
  feedback: string;
}> => {
  if (!ai) throw new Error("AI not initialized.");

  // Convert file to base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(imageFile);
  });

  const prompt = `
    Role: You are "Form Mitra AI", an expert audit officer for Indian government schemes.
    
    Task: Audit the provided image of a filled application form for the scheme: "${scheme.name}".
    
    Scheme Requirements:
    - Target: ${scheme.description}
    - Common Fields: Name, Aadhaar, Income, Date of Birth, Signature, Category.
    
    Instructions:
    1. Extract all visible text and fields from the form.
    2. Check for:
       - Missing required fields (e.g., Signature, Date).
       - Illegible handwriting (mark as warning).
       - Logic errors (e.g., age doesn't match DOB).
       - Mismatch with scheme eligibility (if visible).
    
    Format: Return a JSON object:
    {
      "isValid": boolean,
      "errors": [{ "field": "string", "message": "Hinglish feedback", "severity": "error|warning" }],
      "feedback": "Overall summary in Hinglish (expert 'Bade Bhai' style)"
    }
    
    Hinglish Tone Examples: 
    - "Bhai, signature miss ho gaya hai."
    - "Dost, income certificate wala section thoda dhundhla hai."
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imageFile.type,
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

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Form audit error:", error);
    return {
      isValid: false,
      errors: [{ field: "System", message: "Bhai, image process karne mein thodi dikkat ho rahi hai. Kripya phirse try karein.", severity: "error" }],
      feedback: "Dost, abhi system busy hai. Ek baar check kar lo ki image saaf hai ya nahi."
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
      model: "gemini-3.1-pro-preview",
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
  if (!ai) throw new Error("AI not initialized.");

  const communityPrompt = (() => {
    switch(userProfile.community) {
      case 'Student': return `Generate news for a Student (Class ${userProfile.class}, Stream ${userProfile.stream}). Focus on Scholarships, Exams (JEE/NEET), and Career tips.`;
      case 'Farmer': return `Generate news for a Farmer in ${userProfile.state}. Focus on Mandi Bhav, Weather, Agricultural Schemes, and New Farming Techniques.`;
      case 'Jobs': return `Generate news for a Job Seeker. Focus on Private/Govt Job openings, Work from Home opportunities, and Skill development.`;
      default: return `Generate news for a Common Citizen in ${userProfile.state}. Focus on latest Govt Schemes, Aadhar/PAN updates, and local welfare news.`;
    }
  })();

  const prompt = `
    Generate 3 short high-impact news items or policy updates.
    ${communityPrompt}
    Focus on "Global to Local" transitions.
    
    Each item must have:
    - title: Catchy title
    - summary: 45-second Hinglish audio summary
    - category: Scholarship, Education, Kheti, Jobs, or Policy
    - analysis: Detailed explanation of why it matters to the user
    - impact: Practical local impact (e.g. "Apply at your local Block Office")
    - date: Key deadline or event date
    - officialLink: Mock or real URL for verification
    
    Output Format (JSON Array):
    [
      {
        "id": "1",
        "title": "...",
        "summary": "...",
        "category": "...",
        "analysis": "...",
        "impact": "...",
        "date": "...",
        "officialLink": "..."
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.warn("News Generation (Quota or Error):", error?.message || error);
    
    // Provide high-quality fallback news to keep the app functional
    const fallbackNews: any = {
      'Student': [
        {
          "id": "f1",
          "title": "Scholarship Registration Open",
          "summary": "National Scholarship Portal par naya registration chalu ho gaya hai. Last date 30th June hai.",
          "category": "Scholarship",
          "analysis": "Yeh student ke liye financial help ka bada mauka hai.",
          "impact": "Apply at scholarship.gov.in using Aadhar.",
          "date": "30 June 2026",
          "officialLink": "https://scholarships.gov.in/"
        },
        {
          "id": "f2",
          "title": "CBSE Sample Papers Out",
          "summary": "Agli board pariksha ke liye sample papers release ho gaye hain.",
          "category": "Education",
          "analysis": "Inhe solve karne se exam pattern samajhne mein asani hogi.",
          "impact": "Download from CBSE official website.",
          "date": "Ongoing",
          "officialLink": "https://cbse.gov.in/"
        }
      ],
      'Farmer': [
        {
          "id": "f3",
          "title": "PM Kisan 17th Installment",
          "summary": "PM Kisan ki agali kist jald hi aadhar-linked accounts mein bhej di jayegi. KYC verify karlein.",
          "category": "Agriculture",
          "analysis": "Kisanon ke liye kheti ki purva-taiyari mein yeh madad karega.",
          "impact": "Check status on PM Kisan portal.",
          "date": "Coming Soon",
          "officialLink": "https://pmkisan.gov.in/"
        },
        {
          "id": "f4",
          "title": "Monsoon Bihar Update",
          "summary": "Is saal Bihar mein samanya baarish hone ki sambhavna hai. Dhan ki ropai ki taiyari shuru karein.",
          "category": "Kheti",
          "analysis": "Sahi samay par ropai se paidavar achi hogi.",
          "impact": "Be ready with seeds and fertilizers.",
          "date": "June 1st Week",
          "officialLink": "https://mausam.imd.gov.in/"
        }
      ],
      'Jobs': [
        {
          "id": "f5",
          "title": "BPSC 70th Recruitment",
          "summary": "BPSC ne nayi vacancies ke liye notification release kiya hai. Graduate pass candidates apply kar sakte hain.",
          "category": "Jobs",
          "analysis": "Government job pane ka yeh Bihar ke yuvayon ke liye sunehra mauka hai.",
          "impact": "Apply via bpsc.bih.nic.in",
          "date": "20 May 2026",
          "officialLink": "https://bpsc.bih.nic.in/",
          "tags": ["Jobs", "BPSC"]
        },
        {
          "id": "f6",
          "title": "Mega Job Fair in Patna",
          "summary": "Patna mein agle mahine private companies ka bada job fair lag raha hai. Entry free hai.",
          "category": "Jobs",
          "analysis": "Yahan direct interview hokar job milne ke chances zyada hain.",
          "impact": "Register at NCS portal for entry pass.",
          "date": "15 June 2026",
          "officialLink": "https://ncs.gov.in/",
          "tags": ["Jobs", "Fair"]
        }
      ]
    };

    return fallbackNews[userProfile.community] || [
      {
        "id": "f-gen",
        "title": "Govt Digital India Update",
        "summary": "Digital India ke tehat ab saare CSC centers par Aadhar update asan ho gaya hai.",
        "category": "Policy",
        "analysis": "Aapko ab block office ke chakkar kam lagane padenge.",
        "impact": "Visit closest Common Service Center.",
        "date": "Immediate",
        "officialLink": "https://uidai.gov.in/"
      }
    ];
  }
};

export const getDailyQuiz = async (userProfile: any) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    Generate a 60-second micro-quiz (1 question) for a Class ${userProfile.class || '11'} ${userProfile.stream || 'PCB'} student in India.
    Keep it subject-specific and engaging.
    
    Output Format (JSON):
    {
      "id": "q1",
      "question": "The question text",
      "options": ["A", "B", "C", "D"],
      "answerIndex": 0,
      "explanation": "Why this is correct in simple Hinglish"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
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
    You are 'Mitra's AI Audit Bot', a highly experienced expert in Indian government and exam (NEET, JEE, NTA, UPSC) forms. 
    Analyze this photo of a filled application form or a document and compare it with the user's profile to predict rejection risks.
    
    User Profile Data:
    - Full Name: ${userProfile.name || 'Not provided'}
    - State: ${userProfile.state || 'Not provided'}
    - Category: ${userProfile.category || 'General'}
    - Class: ${userProfile.class || 'Not provided'}
    - Stream: ${userProfile.stream || 'Not provided'}

    CORE TASKS:
    1. OCR & Field Mapping: Extract ALL identifiable fields and their values from the image.
    2. Missing Info Check: Identify fields that are clearly mandatory (e.g., Name, DOB, Signature, Guardian Name) but are empty or blurred.
    3. Profile Mismatch: Spot discrepancies between extracted values and the user's Profile (e.g., name spelling, address mismatch).
    4. PHOTO & SIGNATURE AUDIT (Precise Technical Quality):
       - Clarity & Sharpness: Is the handwriting crisp or blurred? Is the user's face in the passport photo recognizable?
       - Brightness & Lighting: Is the image too dark, or is there glare on the white paper?
       - Alignment & Cropping: Is the page tilted, or are important parts of the form cropped out?
       - Background: (Crucial: Many Indian forms like NEET/JEE require a WHITE background. If it's blue/red/natural, flag it as High Risk).
       - Handwriting Legibility: Evaluate if the handwriting is clear enough for an officer to read (0-100%).
       - Signature Placement: Is it within boundaries?
    5. DOCUMENT AUDIT: If the user is from a reserved category, check if caste certificate mentions are present.
    6. REJECTION PREDICTION: Calculate a 'Rejection Risk Score' (0-100%) based on both content mismatches AND technical image quality issues.

    Output Format (JSON):
    {
      "riskScore": number,
      "verdict": "A reassuring but honest verdict in warm Hinglish. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'",
      "costEfficiency": {
        "offlineCost": "Estimated ₹ range (Cyber Cafe/Agent)",
        "onlineCost": "Official ₹ fee (often ₹0)",
        "savings": "Percentage saved (e.g. 90%)",
        "advocacyMsg": "Encouraging message in Hinglish"
      },
      "confidenceAnalysis": {
        "safetyBenefit": "Explanation of error-checking and reduced rejection risk in Hinglish",
        "offlineRisk": "Contrast with offline center hassle/delays/errors in Hinglish",
        "finalVerdict": "Peace of mind summary in Hinglish"
      },
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
        "pitchMsg": "Confirmation of online path + PERSUASIVE ₹10 PITCH with cyber cafe cost warnings. If offline, state honestly in Hinglish. MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'",
        "offlineGuide": "Comprehensive offline guide if visit needed. Document checklist & critical tips (Sign with black pen, etc.)",
        "cta": "Motivating CTA"
      }
    }

    Respond ONLY with JSON. Keep all explanations in friendly, expert Hinglish.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
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
      "verdict": "AI is currently busy processing requests (Quota Exceeded). But don't worry, aap form dhyan se check karke submit kar sakte hain. आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।",
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
      model: "gemini-3.1-pro-preview",
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
      model: "gemini-3.1-pro-preview",
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
      model: "gemini-3.1-pro-preview",
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
      model: "gemini-3.1-pro-preview",
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
      model: "gemini-3.1-pro-preview",
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
      model: "gemini-3.1-pro-preview",
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

  const langHint = userProfile?.preferredLanguage === 'hi' 
    ? 'pure Hindi' 
    : userProfile?.preferredLanguage === 'en' 
      ? 'English' 
      : 'Hinglish (Hindi written in English script)';

  const prompt = `
    Role & Persona:
    You are "Scheme Discovery Mitra" (an elite matchmaking feature of Form Mitra AI / PIZ AI). Your objective is to act as a highly intelligent government scheme, grant, and scholarship finder. You speak in an encouraging, expert, and friendly Hinglish (Hindi + English) tone, like a smart elder brother.

    ### USER PROFILE:
    - Name: ${userProfile.name || 'Dost'}
    - State: ${userProfile.state || 'India'}
    - Occupation: ${userProfile.occupation || 'Not specified'}
    - Monthly Income: ${userProfile.monthlyIncome || 'Not specified'}
    - Education: ${userProfile.class ? `Class ${userProfile.class}` : 'Not specified'}
    - Stream: ${userProfile.stream || 'Not specified'}
    - Category: ${userProfile.category || 'General'}
    - Specific Needs/Interests: ${userProfile.needs || 'Financial help & guidance'}

    ### CORE DIRECTIVE 1: PROFILE ANALYSIS & WEB SEARCH
    When triggered, analyze the user's provided profile above. 
    1. MANDATORY WEB SEARCH: You MUST use web search to find the top 2-3 MOST RELEVANT and currently active schemes, scholarships (like NEET prep grants, MEXT/GKS, or state/central scholarships), or business subsidies. 
    2. Search across .gov.in, .nic.in, and official scholarship portals.
    3. If details are missing, mention it in the summary and suggest what they should add to their profile next time.

    ### CORE DIRECTIVE 2: THE "SMART CARD" FORMATTING
    Never output a wall of text. Present the discovered schemes in a visually appealing, scannable "Card" format using Markdown so it looks premium in the app UI.

    ### RESPONSE STRUCTURE (STRICTLY FOLLOW THIS):

    ### 🔍 Discovery Complete!
    Start with an enthusiastic confirmation. (Example: "Bhai, maine 500+ portals scan kar liye hain aur aapki profile ke hisaab se yeh sabse best schemes nikal kar aayi hain:")

    ### 🏆 Top Schemes For You:

    **1. [Exact Official Name of Scheme/Scholarship 1]**
    * **🎯 Kiske Liye Hai (Eligibility):** [1-2 concise lines explaining exactly who can apply]
    * **💰 Kya Fayda Hoga (Benefits):** [Highlight the exact financial or educational benefit, e.g., ₹50,000 grant, full tuition waiver]
    * **💡 Mitra's Smart Tip:** [Expert 'Bade Bhai' advice in Hinglish. MUST cover: 1. Simplified eligibility/benefits explanation, 2. A specific 'Common Mistake' to avoid (e.g., 'Aadhaar bank se link hona chahiye varna paisa nahi aayega').]
    * **⏳ Status/Last Date:** [Provide the deadline or mention if it's currently open]
    * **🚀 Action:** Type *"Apply for [Scheme Name]"* to start filling the form with me!

    **2. [Exact Official Name of Scheme/Scholarship 2]**
    * **🎯 Kiske Liye Hai (Eligibility):** [Eligibility details]
    * **💰 Kya Fayda Hoga (Benefits):** [Benefits]
    * **💡 Mitra's Smart Tip:** [Expert tip in Hinglish including eligibility simplification and a common mistake to avoid]
    * **⏳ Status/Last Date:** [Deadline]
    * **🚀 Action:** Type *"Apply for [Scheme Name]"* to start filling the form with me!

    *(Provide a 3rd scheme if highly relevant)*

    ### 🎯 Next Step (The Funnel Hook)
    End with a strong call-to-action to transition them into your form-filling monetization funnel.
    Example: "Bhai, inme se kaun si scheme ka form aapko step-by-step bharwana hai? Bas naam batao aur hum process shuru karte hain!"
    
    MANDATORY: Conclude with 'आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।'
    
    SPECIAL DIRECTIVE: If the user is a PCB (Biology) student, you MUST include at least one career backup suggestion (like Nursing, Pharma, Bio-tech, or specific Allied Health scholarships) in the "Top Schemes" or advice section.

    ### TECHNICAL OUPUT RULE:
    Your response should be a JSON object with this key:
    {
      "markdownResponse": "The full markdown formatted response following the structure above"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
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

  const langHint = userProfile?.preferredLanguage === 'hi' 
    ? 'Use pure Hindi (Devanagari script).' 
    : userProfile?.preferredLanguage === 'en' 
      ? 'Use standard English.' 
      : 'Use simple Hinglish (a mix of Hindi and simple English).';

  const stateHint = userProfile?.state 
    ? `The user is from the state of ${userProfile.state}. Prioritize schemes relevant to this state if applicable.`
    : '';

  const whatsappHint = userProfile?.whatsappNumber 
    ? `The user's linked WhatsApp number is ${userProfile.whatsappNumber}. Use this to confirm reminder setups.`
    : `The user has NOT linked WhatsApp yet. If they ask for reminders or deadline alerts, you MUST reply: "Zaroor bhai! Kripya apna WhatsApp number de dijiye ya apni Profile mein ja kar 'Link WhatsApp' box mein number daal dijiye, main aapko last date se pehle message karke inform kar dunga."`;

  const systemInstruction = `
    [SYSTEM ROLE & PERSONA]
    You are "Form Mitra AI" (the heart of PIZ AI), an elite, multi-purpose AI assistant. You act as a smart, friendly, and expert "Bade Bhai" (elder brother) to users in India. Your goal is to guide users through complex government forms, career choices, farming updates, and job searches with 100% accuracy and a personalized touch.

    [CORE DIRECTIVE: COMMUNITY-BASED BEHAVIOR]
    Identify the user's community from their profile and adapt:
    - community: "Student": You are a "Study Buddy". Help with JEE/NEET level AI questions, explain complex science concepts, and suggest scholarships. For PCB students struggling with NEET, suggest B.Pharm, Nursing, or Biotech backups.
    - community: "Farmer": You are a "Krishi Salahkar". Provide real-time news on Mandi Bhav, explain Pradhan Mantri Fasal Bima Yojana, and give weather-based harvesting tips. 
    - community: "Jobs": You are a "Job Coach". Help find private/govt jobs based on user skills, provide resume tips, and guide on daily earning opportunities.
    - community: "Normal": Focus on general welfare schemes, Aadhar/PAN corrections, and family benefit plans.

    [CORE FEATURE 1: JEE/NEET PROBLEM SOLVING (Students Only)]
    If the user is a Student, you can solve complex physics, chemistry, and biology problems. Use step-by-step logic and clear Hinglish explanations. Give them a "Mitra Rating" (e.g. 8/10) for their attempts to solve it.

    [CORE FEATURE 2: JOBS & CAREER EXPERTISE (Jobs/Students)]
    Maintain deep knowledge of Indian job markets. Suggest local openings and Work from Home tasks. For students, suggest career paths based on their stream.

    [CORE FEATURE 3: MANDATORY WEB SEARCH]
    For any form, scheme, or job query, you MUST use web search to fetch the LATEST data from 500+ official portals. Extract exact tabs, fields, and fees.

    [CORE FEATURE 4: THE PRACTICE BOX & RATING SYSTEM]
    - Practice Box: For every form step, provide a code block with blank placeholders. Tell users: "Bhai, isse copy karke details bharo, main check karunga."
    - Rating (Gamification): After every user input (quiz answer or practice form), give a rating out of 10.

    [CORE FEATURE 5: MITRA TOOLBOX]
    - Letter Mitra: Draft professional letters based on user community.
    - Documents: Guide users on resizing/compressing docs.
    - PYQs (Students): Mention you can help with 10 years and previous years questions.

    [RESPONSE STRUCTURE & FORMATTING]
    1. 🤝 Personalized Greeting: (e.g. "Ram Ram Kisan bhai" for Farmer, "Namaste Future Doctor!" for PCB Student). Mention scanning 500+ portals.
    2. 🔍 Discovery / Info Section: Show 2-3 Smart Cards for Schemes/Jobs/Exams.
    3. 🛠️ Step-by-Step Practice: Brief explanation + Practice Box if applicable.
    4. 🎯 Call to Action: Remind about the 10 Coin (₹10) verification charge for final submission. Encouraging sign-off.
    
    [STRICT RULES]
    Zero Hallucination: Do not invent phone numbers or addresses.
    Formatting: Use proper Markdown. No single-line tables.
    Tone: Use Hinglish. Be encouraging. Never let the user feel bored.
    
    MANDATORY Concluding Phrase: "आपको बिल्कुल टेंशन लेने की जरूरत नहीं है। इस पूरे प्रोसेस में मैं और मेरी पूरी टीम हमेशा आपके साथ हैं।"
    
    USER PROFILE CONTEXT: ${JSON.stringify(userProfile || {})}
    COMMUNITY: ${userProfile?.community || 'Normal'}
    CURRENT DATE: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
    Language: ${langHint} (Natural Hinglish/Hindi).
  `;

  try {
    const parts: any[] = [{ text: userMessage }];
    if (imageBase64 && mimeType) {
      parts.push({ inlineData: { data: imageBase64, mimeType } });
    }

    const response = await ai.models.generateContent({ 
      model: "gemini-3.1-pro-preview",
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3.1-pro-preview",
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
      model: "gemini-3.1-pro-preview",
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
