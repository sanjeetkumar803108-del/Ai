import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

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
      "fields": [
        {
          "field": "Name of the field in the form",
          "explanation": "Friendly explanation in Hinglish of what to fill here",
          "whyItMatters": "Explain 'why this information is needed' or 'why this field is critical' in warm, helpful Hinglish (e.g., 'Ye field bank transfer ke liye zaroori hai')",
          "isCritical": true/false,
          "commonMistake": "Mention a common mistake people make here in Hinglish, but gently",
          "exampleValue": "Provide a sample dummy value to show how to fill it correctly"
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
      "mitraTip": "A warm, encouraging final word from Mitra in Hinglish (e.g., 'Aap fikar mat kijiye, main help ke liye hoon!')"
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
    console.warn("Gemini Analysis (Quota or Error):", error?.message || error);
    // Return a helpful static fallback form analysis
    return JSON.stringify({
      "formName": "Digital Application Form",
      "summary": "AI is currently busy, showing a general guide for forms. (AI Limit reached)",
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
    
    Task: Provide a short, realistic, and helpful example value for this field in an Indian context.
    The response should be EXACTLY the example value and nothing else.
    Example: If field is "Date of Birth", return "15/08/1990".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "Example not available";
  } catch (error) {
    console.error("Error generating field example:", error);
    return "Error generating example";
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

  const prompt = `
    Generate 3 short high-impact news items or policy updates for a student in India (specifically ${userProfile.state || 'Bihar'}, Class ${userProfile.class || '11'}, Stream ${userProfile.stream || 'PCB'}).
    Focus on "Global to Local" transitions - how national or international news affects them locally.
    
    Each item must have:
    - title: Catchy title
    - summary: 45-second Hinglish audio summary
    - category: Scholarship, Education, or Policy
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
    return [
      {
        "id": "f1",
        "title": "Bihar Board Pariksha Notification",
        "summary": "Bihar Board ne 2026 exams ke liye registration ki dates announce kar di hain. Sabhi students ko apne documents ready rakhne chahiye.",
        "category": "Education",
        "analysis": "Yeh update aapke liye bahut important hai kyunki isse aapki board exam ki tayyari ka schedule decide hoga.",
        "impact": "Aapko apne school se sampark karke forms fill karne honge.",
        "date": "Registration Start: Late 2025",
        "officialLink": "https://secondary.biharboardonline.com/"
      },
      {
        "id": "f2",
        "title": "New Science Scholarship (PCB)",
        "summary": "Kendra sarkar ne PCB (Medical) students ke liye special lab-grant scholarship scheme launch ki hai.",
        "category": "Scholarship",
        "analysis": "Is scheme se aapko practical research aur higher studies mein financial help mil sakti hai.",
        "impact": "Aap National Scholarship Portal par iske liye apply kar sakte hain.",
        "date": "Aug 2026",
        "officialLink": "https://scholarships.gov.in/"
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
    4. PHOTO & SIGNATURE AUDIT: 
       - Check the passport photo background. (Crucial: Many Indian forms require a WHITE background. If it's blue/red/natural, flag it as High Risk).
       - Check if the photo is blurred or if the face is not clear.
       - Check if the signature is present and within the designated boundary.
    5. DOCUMENT AUDIT: If the user is from a reserved category, check if caste certificate mentions are present.
    6. REJECTION PREDICTION: Calculate a 'Rejection Risk Score' (0-100%).

    Output Format (JSON):
    {
      "riskScore": number,
      "verdict": "A reassuring but honest verdict in warm Hinglish (e.g., 'Dost, photo ka background thik karna hoga...')",
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
        "backgroundStatus": "Brief report on background color/quality",
        "clarity": "Report on photo clarity",
        "isAccepted": true/false
      },
      "actionPlan": ["Pehla step...", "Dusra step..."]
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
      "verdict": "AI is currently busy processing requests (Quota Exceeded). But don't worry, aap form dhyan se check karke submit kar sakte hain.",
      "identifiedFields": [],
      "majorIssues": [],
      "photoAudit": { "backgroundStatus": "Checking manually advised", "clarity": "Please check yourself", "isAccepted": true },
      "actionPlan": ["Manual check karein", "Thodi der baad firse AI audit try karein"]
    };
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
      "guidance": "Voice instruction text in Hinglish",
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
    You are 'Mitra', a warm, expert 'Bade Bhai' or senior companion who is an expert in Indian government schemes and education.
    Your goal is to make the user feel supported, hopeful, and informed about their future.
    
    User Profile:
    - Name: ${userProfile.name || 'Dost'}
    - State: ${userProfile.state || 'India'}
    - Class: ${userProfile.class || 'Not specified'}
    - Stream: ${userProfile.stream || 'Not specified'}
    - Needs: ${userProfile.needs || 'Himat aur support'}
    
    Task:
    Analyze the user's profile and suggest the top 3-4 most relevant government schemes or scholarships. 
    Explain them in a way that feels like a personal recommendation from a friend.
    
    For each suggestion:
    - Scheme Name (in English & Hindi).
    - Kyun Apply Karein? (Explain eligibility with empathy).
    - Isse Kya Fayda Hoga? (Major benefits in simple Hinglish).
    - Mitra's Special Tip (Pro-tip to succeed with a friendly touch).
    
    Use an encouraging, positive, and empathetic tone in ${langHint}.
    Keep it high-impact and easy to read.
    
    Output Format:
    Use professional markdown with warm emojis.
    Heading: Mitra's Personalized Recommendations for You ✨
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "";
  } catch (error: any) {
    console.warn("Gemini Profile Reco (Quota or Error):", error?.message || error);
    return `
### Mitra's Personalized Recommendations 🌟

Hello! AI services temporarily limited hain, lekin Bihar ke students ke liye yeh schemes hamesha top par rehti hain:

1. **Bihar Student Credit Card** 💳
   - **Kyun:** Higher studies (12th ke baad) ke liye ₹4 lakh tak ka loan.
   - **Fayda:** Bahut kam interest rate aur simple process.
   - **Mitra Tip:** Apne documents (Marksheet, Aadhar) pehle se ready rakhein.

2. **Bihar Post-Matric Scholarship** 🎓
   - **Kyun:** SC/ST/BC/EBC students ke liye matric ke baad ki padhai ke liye help.
   - **Fayda:** Tuition fees mein kaafi rahat milti hai.
   - **Mitra Tip:** PMS portal par details sahi se bharein taaki verification fast ho.

Thodi der baad firse try karein to main aapki profile ka deeper analysis kar paunga!
    `.trim();
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
    You are 'Mitra', not just an AI, but a highly intelligent, helpful, and empathetic Indian friend (Sathi). 
    Your tone is warm, friendly, and encouraging, like a trusted elder brother (Bade Bhai) or a close friend who truly cares about the user's success.
    
    Talk in friendly, encouraging Hinglish or Hindi. Talk like a helpful senior (Bade Bhai).
    
    CURRENT DATE: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
    
    ${stateHint}
    ${whatsappHint}
    
    CORE SKILLS & RESPONSIBILITIES:

    1. Form & Document Checker (CRITICAL):
       - Analyze uploaded photos of forms, passport photos, or signatures for competitive exams (NEET/JEE/NTA) or RTPS certificates.
       - Identify errors such as: wrong background in photos, missing details, missing mandatory proofs, or blurriness.
       - Warn the user clearly: "Bhai, ye photo NEET ke liye nahi chalegi, background white hona chahiye!" or "Sign thoda aur clear karke upload kijiye."
    
    2. Schemes & Subsidies Expert:
       - Explain Indian government schemes (National & State wise).
       - CRITICAL: Always provide EXACT NUMBERS (e.g., "₹8,500/hectare", "40% subsidy") and OFFICIAL portal links (e.g., pmkisan.gov.in).
       - Never be vague. Be precise like an official sarkaari guide but warm like a friend.
    
    3. Scam Alert Radar (AGGRESSIVE):
       - Guard the user against fraud. Aggressively analyze forwarded messages, SMS, or screenshots for common Indian scams (e.g., "Electricity bill disconnection", "KBC Lottery", "Bank KYC Update", "Random APK files"). 
       - If you detect a scam, warn the user immediately in **BOLD LETTERS**: "⚠️ **ALERT: RUKIYE! YE EK SCAM HAI!** ⚠️" 
       - Explain the fraud trick simply so the user understands why it's a scam: "Aise links se bachiye, ye log aapka bank khali kar sakte hain. Don't worry, main hoon na!"
    
    4. Voice Note Processing:
       - You are capable of understanding audio queries (even if transcribed) in Hindi and regional dialects like Bhojpuri, Magahi, or Maithili.
       - Acknowledge the voice input warmly and reply in friendly text, summarizing the key points.
    
    5. Exam & Career Counseling (NEET/JEE):
       - Help students with their forms, document requirements, and basics of counseling.
       - Encourage them: "Padhai kaisi chal rahi hai? Tension mat lo, hum milkar form perfect bharenge!"

    6. Medical & Insurance Decoder:
       - Help decode hospital bills and TPA rejection letters. Highlight EXACT non-payable items.
       - Be empathetic: "Health issues mein paperwork ka tension sabse bura hota hai. Main dekhta hoon kya dikat hai."

    7. Sarkaari Collections (RTPS):
       - Help with Income, Caste, Domicile (Niwas) certificates.
       - Tell them exactly what extra proofs are needed if you spot something missing.

    BEHAVIORAL RULES:
    1. Language: ${langHint} (Natural Hinglish/Hindi - how friends chat).
    2. Warmth: Use phrases like "Aap fikar mat kijiye," "Main hoon na," "Sab theek ho jayega," "Himat mat hariye."
    3. Structured: Use bullet points for steps, but keep the vibe conversational.
    4. Web Search: Use Google Search for LATEST subsidy rates, exam dates, and official links.
    5. Motto: "Zindagi ki mushkilon mein, Mitra aapke saath hai."
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
    console.warn("Gemini Chat (Quota or Error):", error?.message || error);
    
    // Provide a helpful fallback response in Hinglish
    return {
      text: `Maafi chahta hoon, AI service abhi thodi busy hai (Quota limit). Par main aapki help kar sakta hoon! 

Common help topics:
1. **Aadhar Card Update:** Pass ke Aadhar Kendra par jayein.
2. **Scholarship:** National Scholarship Portal (NSP) ya state portal check karein.
3. **Documents:** Aadhar, Rashan Card, aur Income Certificate humesha ready rakhein.

Aap thodi der baad firse pooch sakte hain, tab tak main try karunga reset hone ka!`,
      thought: "API Quota Exceeded. Providing fallback support message to avoid user frustration."
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
      "mitraAdvice": "Personalized tip from Mitra for this specific user"
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
      "mitraAdvice": "Aap directly website visit karke bhi details dekh sakte hain."
    };
  }
};
