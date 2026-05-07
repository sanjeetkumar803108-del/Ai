import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const getSpeech = async (text: string) => {
  if (!ai) throw new Error("AI not initialized.");

  try {
    console.log("TTS Request for text length:", text.length);
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
    console.error("Gemini TTS Error:", error);
    // Don't crash the whole app for audio failure, just return null
    return null;
  }
};

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
          "commonMistake": "Mention a common mistake people make here in Hinglish",
          "exampleValue": "Provide a sample dummy value to show how to fill it correctly (e.g. 'Sanjeev Kumar' for Name, or '12/04/1995' for DOB)"
        }
      ],
      "pitfalls": [
        "Major reason for rejection 1",
        "Major reason for rejection 2"
      ],
      "smartTips": [
        "Dynamic advice based on form context 1",
        "Dynamic advice based on form context 2",
        "Pitfall to avoid specific to this form category"
      ],
      "mitraTip": "A small final word of encouragement from Mitra in Hinglish"
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
          "isCritical": true,
          "commonMistake": "Initials mat use karein, poora naam likhein.",
          "exampleValue": "Sanjeev Kumar"
        },
        {
          "field": "Date of Birth",
          "explanation": "Janm tithi DD/MM/YYYY format mein bharein.",
          "isCritical": true,
          "commonMistake": "Wrong date format apply karna.",
          "exampleValue": "15/08/2005"
        },
        {
          "field": "Aadhar Number",
          "explanation": "12 anko ka Aadhar number dhyan se bharein.",
          "isCritical": true,
          "commonMistake": "Ek bhi digit galat hona.",
          "exampleValue": "1234 5678 9012"
        }
      ],
      "pitfalls": [
        "Signature missing hona",
        "Overwriting ya cutting karna"
      ],
      "smartTips": [
        "Form bharne se pehle instructions dhyan se padhein.",
        "Blue ya Black ballpoint pen ka hi use karein."
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
    - confidenceScore: A number from 0 to 100 representing how well this scheme matches the user's intent and query. Use 100 for exact name matches.
    
    Output the result as a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
    You are 'Form Mitra AI Audit Bot'. 
    Analyze this photo of a filled government form and compare it with the user's profile to predict potential rejection risks.
    
    User Profile Data:
    - Full Name: ${userProfile.name || 'Not provided'}
    - State: ${userProfile.state || 'Not provided'}
    - Class: ${userProfile.class || 'Not provided'}
    - Stream: ${userProfile.stream || 'Not provided'}
    - Preferred Language: ${userProfile.preferredLanguage || 'Hinglish'}
    - Additional Needs: ${userProfile.needs || 'Not provided'}

    Task:
    1. Perform OCR on the form to extract filled values.
    2. Identify fields that are mandatory but missing.
    3. Spot discrepancies between extracted form values and user profile (e.g., name spelling, state mismatch).
    4. Flag technical errors like date format, signature missing, or photo clarity.
    5. Provide a 'Rejection Risk Score' (0-100%).

    Output Format (JSON):
    {
      "riskScore": number,
      "verdict": "Clear message in Hinglish about overall status",
      "discrepancies": [
        {
          "field": "Field Name",
          "extracted": "What was found in the form",
          "expected": "What is in user profile or required data",
          "severity": "high" | "medium" | "low",
          "reason": "Why this causes rejection in Hinglish"
        }
      ],
      "missingFields": ["List of mandatory fields not filled"],
      "qualityNotes": ["Notes on image clarity or visibility"],
      "actionPlan": ["Step 1 to fix", "Step 2 to fix"]
    }

    Keep the 'reason' and 'verdict' in simple Hinglish (Hindi + English).
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
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Form Audit (Quota or Error):", error?.message || error);
    return {
      "riskScore": 0,
      "verdict": "AI is currently busy processing requests (Quota Exceeded). But don't worry, aap form dhyan se check karke submit kar sakte hain.",
      "discrepancies": [],
      "missingFields": [],
      "qualityNotes": ["AI services are momentarily limited."],
      "actionPlan": ["Manual check karein", "Thodi der baad firse AI audit try karein"]
    };
  }
};

export const analyzeScreenForGuidance = async (imageBase64: string, mimeType: string, userMessage: string) => {
  if (!ai) throw new Error("AI not initialized.");

  const prompt = `
    You are 'Form Mitra AI', analyzing a user's screen during a form-filling process.
    User Message: "${userMessage}"
    
    1. Identify the active field the user is looking at.
    2. Provide voice-guided instructions in simple Hinglish on what to enter.
    3. Flag any visible mistakes (spelling mismatches, invalid formats).
    4. Advise on data masking if sensitive fields are visible.
    
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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

export const getAIResponse = async (userMessage: string, chatHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = [], userProfile?: any) => {
  if (!ai) throw new Error("AI not initialized. Check your API key.");

  const langHint = userProfile?.preferredLanguage === 'hi' 
    ? 'Use pure Hindi (Devanagari script).' 
    : userProfile?.preferredLanguage === 'en' 
      ? 'Use standard English.' 
      : 'Use simple Hinglish (a mix of Hindi and simple English).';

  const stateHint = userProfile?.state 
    ? `The user is from the state of ${userProfile.state}. Prioritize schemes relevant to this state if applicable.`
    : '';

  const systemInstruction = `
    You are 'Form Mitra AI', a helpful assistant for Indian citizens. 
    CURRENT DATE: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
    
    ${stateHint}
    
    Your goal is to explain government schemes (like PM Kisan, Ayushman Bharat, etc.) 
    and provide guidance on filling out forms.
    
    RULES:
    1. Language: ${langHint}
    2. Tone: Helpful, patient, and friendly.
    3. Keep it simple: Avoid complex bureaucratic jargon.
    4. Structured: Use bullet points for steps.
    5. Disclaimer: Always mention that users should verify details on the official government website.
    6. Specifics: If asked about a scheme, provide eligibility, benefits, and required documents. 
    7. WEB SEARCH & FRESHNESS (CRITICAL): You are connected to Google Search. ALWAYS use it for ANY query regarding government schemes, latest updates, or official dates. 
       - You MUST perform a deep search across all official Indian government portals (.gov.in, .nic.in, pib.gov.in) to find the most accurate and up-to-date information for both new and old schemes.
       - If you find any discrepancy between your training data and current official results, you MUST correct it and explicitly say: "Main official website se details verify kar raha hoon... (Verifying from official websites)".
       - Look for the 'Last Updated' date or 'Latest Notifications' on government portals to ensure truthfulness.
       - Always provide the official URL if found.
    8. FORMAL APPLICATIONS (CRITICAL LAYOUT): If the user asks for an application letter (TC, Bank, Leave, etc.), you MUST follow this exact paper-like layout:
       - TITLE: Centered and Bold heading.
       - TO SECTION:
         To,
         [Post/Designation],
         [Institution Name],
         [Address].
       - DATE: "Date:- DD/MM/YYYY"
       - SUBJECT: "Subject:- [Clear Subject Line]"
       - SALUTATION: "Respected Sir/Madam,"
       - BODY: Clear paragraphs explaining the request.
       - CLOSING: 
         "Thanking You,"
         "Yours Sincerely/Faithfully,"
         "Signature"
         "Name", "Class/Position", "Roll No/ID" placeholders.
    9. Thinking: If the model provides a "thought" or "reasoning" part, ensure it is helpful to understand the logic.
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
