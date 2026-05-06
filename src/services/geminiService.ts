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
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
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
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
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
    4. Keep it concise, respectful, and legally sound.
    5. Additional User Request notes to include: ${additionalNotes || 'N/A'}.
    
    Output ONLY THE LETTER content. No conversational filler.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Letter Generation Error:", error);
    throw error;
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
  } catch (error) {
    console.error("Gemini Letter Generation Error:", error);
    throw error;
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
  } catch (error) {
    console.error("Error searching schemes:", error);
    return [];
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
  } catch (error) {
    console.error("Error getting recommendation:", error);
    throw error;
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
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};
