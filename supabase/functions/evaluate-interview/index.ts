
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, interview_type } = await req.json();
    // Hardcoded API key as requested by user
    const GOOGLE_API_KEY = "AIzaSyBtjFkWMoGRn-vv9XeXydBq_PBx2zm4BKc";

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert technical interviewer. Evaluate the candidate's performance in this ${interview_type} interview based on the provided conversation transcript.

    CRITICAL INSTRUCTION: FIRST, perform a "Sanity Check" on the candidate's answers.
    
    **SANITY CHECK RULES (Pass/Fail):**
    - FAIL if answers are random letters (e.g., "asdf", "kjsfd").
    - FAIL if answers are repeated nonsense (e.g., "bla bla bla").
    - FAIL if answers are extremely short and irrelevant (e.g., "yes", "no", "idk" to complex technical questions).
    - FAIL if the candidate is clearly trolling or not taking it seriously.

    **IF SANITY CHECK FAILS:**
    - You MUST return a **score of 0**.
    - Feedback MUST state: "The interview responses were invalid, too short, or irrelevant. Please try again with serious answers."
    - All metrics MUST be 0.
    - **Strengths**: Return an empty array \`[]\`.
    - **Weaknesses**: Return a list of 3 specific reasons why the input failed, for example:
      - "Responses were too short or one-word answers"
      - "Answers did not address the technical questions asked"
      - "Communication style was dismissive or irrelevant"

    **ONLY IF SANITY CHECK PASSES:**
    - Grade the candidate normally based on the quality, depth, and correctness of their answers.

    **OUTPUT FORMAT:**
    Respond with ONLY a valid JSON object (no markdown, no code blocks).
    {
      "score": number (0-100),
      "feedback": "Overall summary (2-3 sentences)",
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
      "metrics": {
        "technical_accuracy": number (0-100),
        "communication": number (0-100),
        "problem_solving": number (0-100)
      }
    }

    **Grading Scale (for valid attempts):**
    - 90-100: Exceptional.
    - 70-89: Good.
    - 50-69: Average.
    - 30-49: Poor.
    - 0-29: Very Poor.

    Analyze the "user" messages in the transcript carefully.`;

    // Construct the conversation history for Gemini
    // Gemini expects "parts" with "text"
    const chatHistory = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt }]
            },
            ...chatHistory
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json", // Force JSON response
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Gemini response structure is different
    let aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      throw new Error("No content received from Gemini");
    }
    
    // Clean up potential markdown formatting if the model ignores instructions
    aiContent = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();

    const evaluation = JSON.parse(aiContent);

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in evaluate-interview function:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
