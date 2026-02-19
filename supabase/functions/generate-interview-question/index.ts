import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, interview_type, question_count } = await req.json();
    // Hardcoded API key as requested by user
    const GOOGLE_API_KEY = "AIzaSyBtjFkWMoGRn-vv9XeXydBq_PBx2zm4BKc";

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    // Check if interview should end
    if (question_count >= 5) {
      return new Response(
        JSON.stringify({
          question: "Thank you for your time. We have completed the interview questions. Please click the 'Complete Interview' button to finish the session.",
          is_finished: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert technical interviewer conducting a ${interview_type} interview.
    
    Your goal is to ask the NEXT question based on the candidate's previous answers.
    
    RULES:
    1. If this is the start (no history), ask a welcoming opening question relevant to ${interview_type}.
    2. If the candidate answered the previous question:
       - Analyze their answer.
       - If vague/shallow: Ask a follow-up clarification question.
       - If correct/good: Move to a slightly harder or related topic.
       - If incorrect: Gently correct them and ask a simpler related question.
    3. Keep questions concise (1-2 sentences).
    4. Do NOT repeat questions.
    5. Do NOT say "Great answer" or "Correct" too often. Be professional but encouraging.
    
    CRITICAL: Respond with ONLY a valid JSON object.
    {
      "question": "The text of your next question",
      "is_finished": false
    }`;

    // Construct history for Gemini
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
            temperature: 0.7, // Higher temp for more variety in questions
            responseMimeType: "application/json",
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
    let aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      throw new Error("No content received from Gemini");
    }
    
    aiContent = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(aiContent);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-interview-question:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
