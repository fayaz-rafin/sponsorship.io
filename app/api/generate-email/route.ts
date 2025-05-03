import { type NextRequest, NextResponse } from "next/server";
// Use the specific import you indicate you are using
import { GoogleGenAI } from "@google/genai";

// --- API Key Check and Initialization ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  // Use console.error for server-side logging and return an error response
  console.error("GEMINI_API_KEY environment variable is not set.");
  // Throwing here will prevent the server from starting if the key is missing
  // which is often desired in production.
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

// Initialize using the structure you provided
const genAI = new GoogleGenAI({ apiKey: apiKey });

// --- Model Configuration ---
// Use the model name compatible with your SDK version/setup
// 'gemini-1.5-flash-latest' is a good general choice if supported,
// otherwise fallback to 'gemini-pro' or the one from your example 'gemini-2.0-flash'
const modelName = "gemini-1.5-flash-latest"; // Or "gemini-pro", "gemini-2.0-flash"

// Note: Safety settings might be configured differently or not available
// in the `@google/genai` package compared to `@google/generative-ai`.
// Check its documentation if you need to adjust harm blocking.

// --- API Route Handler ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic input validation (add more as needed)
    if (body.followUpPrompt && !body.previousEmail) {
        return NextResponse.json({ error: "previousEmail is required for follow-up requests" }, { status: 400 });
    }
    // For initial generation, require purpose, content, and tone. Email is implied by recipientEmail
    if (!body.followUpPrompt && (!body.emailPurpose || !body.emailContent || !body.emailTone)) {
         return NextResponse.json({ error: "Missing required fields for initial email generation (emailPurpose, emailContent, emailTone)." }, { status: 400 });
    }

    const {
      recipientName = "there", // Default recipient name if not provided
      recipientEmail,
      recipientCompany = "their company", // Default company if not provided
      emailPurpose,
      emailContent,
      emailTone = "professional", // Default tone
      previousEmail,
      followUpPrompt,
    } = body;

    let prompt = "";

    if (followUpPrompt && previousEmail) {
      // --- Follow-up Prompt --- (Keep prompt logic the same)
      prompt = `
You are an AI assistant helping write professional emails.
Modify the following email based on the user's instructions.
The recipient is ${recipientName} (${recipientEmail}) at ${recipientCompany}.

--- START PREVIOUS EMAIL ---
${previousEmail}
--- END PREVIOUS EMAIL ---

Modification instructions: ${followUpPrompt}

Keep the tone consistent with the original email unless instructed otherwise.
Ensure the final email is complete, including a subject line (if present in the original or if modification implies one), greeting, body, and closing.

Respond *only* with the complete revised email content (including Subject: line if applicable). Do not include any introductory text like "Here is the revised email:".
`;
    } else {
      // --- Initial Email Prompt --- (Keep prompt logic the same)
      const toneDescription =
        emailTone === "formal"
          ? "Use very proper and traditional business language. Employ formal titles (Mr./Ms./Dr.) and avoid contractions (e.g., use 'do not' instead of 'don't'). Maintain a respectful and reserved distance."
          : emailTone === "professional"
            ? "Use standard business language. Be clear, concise, and respectful. Contractions are generally acceptable but use them judiciously. The tone should be polite and competent."
            : emailTone === "friendly"
              ? "Use a warm, personable, and approachable style while remaining professional. Conversational language and appropriate contractions are welcome. Aim for a collaborative and positive feel."
              : "Use a relaxed and conversational style, like talking to a colleague you know reasonably well. Keep it appropriate for a business context but feel free to be less formal. Contractions are fine.";

      prompt = `
You are an AI assistant helping write professional emails.
Draft a ${emailTone} email based on the following details:

**Recipient:** ${recipientName} (${recipientEmail})
**Recipient's Company:** ${recipientCompany}
**Purpose of the Email:** ${emailPurpose}
**Key Information to Include:**
${emailContent}

**Tone Guidance:** ${emailTone}. Specific instructions: ${toneDescription}

**Instructions:**
1.  Create a clear and concise **Subject Line** for the email.
2.  Write the email body, ensuring it is well-structured with:
    *   An appropriate greeting (e.g., "Hi ${recipientName},").
    *   Clear paragraphs addressing the email's purpose and including the key information.
    *   A professional closing (e.g., "Sincerely,", "Best regards,").
3.  Adhere strictly to the specified **${emailTone}** tone.

Respond *only* with the generated email content, starting with the "Subject:" line. Do not include any extra text before or after the email itself.
`;
    }

    // --- Call Gemini API using the assumed single-turn method ---
    // Based on your first code snippet, genAI.models.generateContent seems likely
    // for single-turn generation in your `@google/genai` library.
    const result = await genAI.models.generateContent({
      model: modelName,
      // Ensure the contents format matches what the API expects for single-turn
      contents: [{ role: "user", parts: [{ text: prompt }] }],
       // Add other parameters like generationConfig if supported
       // generationConfig: { temperature: 0.7 },
       // safetySettings: [...] // If supported
    });

    // --- Extract the result text ---
    // FIX: Access 'text' as a property (matching your chat example's response.text)
    // Use optional chaining (?.) to safely access the property
    // and nullish coalescing (??) to provide a default empty string
    // if the expected 'text' property doesn't exist or is null/undefined.
    // If the structure is different (e.g., nested), you might need to inspect `result`.
    const text = result?.text ?? "";

    // Optional: Add a check if the resulting text is empty, which might indicate an issue
    if (!text) {
         console.warn("Gemini response text is empty. Check the result object for errors or unexpected structure:", result);
         // You might want to throw a specific error here or return a default message
         // throw new Error("Failed to get valid text response from Gemini.");
         // Returning an empty email might be acceptable depending on UX
    }

    // --- Return Response ---
    return NextResponse.json({ email: text }); // text is now guaranteed to be a string

  } catch (error: any) {
    console.error("Error generating email:", error);
    // Provide a more specific error message if available
    const errorMessage = error.message || "Failed to generate email";
    // Try to get status code from error if available, otherwise default to 500
    const statusCode = error.status || error.response?.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}