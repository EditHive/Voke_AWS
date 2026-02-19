import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { sessionId } = await req.json();
        console.log("Generating overall feedback for session:", sessionId);

        const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
        if (!GROQ_API_KEY) {
            return new Response(
                JSON.stringify({ error: "GROQ_API_KEY is not configured" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get session and all answers
        const { data: session, error: sessionError } = await supabase
            .from("interview_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (sessionError) throw sessionError;

        const { data: answers, error: answersError } = await supabase
            .from("interview_answers")
            .select("*")
            .eq("session_id", sessionId)
            .order("question_number");

        if (answersError) throw answersError;

        // Prepare answers summary for AI
        const answersSummary = answers.map((a, idx) => `
Question ${idx + 1}: ${a.question}
Transcript: ${a.transcript || "N/A"}
Scores: Delivery=${a.delivery_score}, Body Language=${a.body_language_score}, Confidence=${a.confidence_score}
`).join("\n");

        const analysisPrompt = `You are an expert interview coach. Analyze this complete interview session for a ${session.role} position.

INTERVIEW SUMMARY:
${answersSummary}

Provide comprehensive overall feedback in the following format (strict JSON):

{
  "body_language_summary": "<2-3 sentences on overall body language across all answers>",
  "eye_contact_summary": "<2-3 sentences on eye contact and camera engagement>",
  "confidence_summary": "<2-3 sentences on overall confidence and presence>",
  "overall_score": <number 0-100>,
  "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "key_improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}

Focus on patterns across all answers, not individual questions.`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
                    messages: [
                        {
                            role: "user",
                            content: analysisPrompt,
                        },
                    ],
                    temperature: 0.3,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
        }

        const aiData = await response.json();
        const aiResponse = aiData.choices[0].message.content;

        // Parse AI response
        let analysis;
        try {
            const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
            analysis = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            // Calculate average scores
            const avgScore = Math.round(
                answers.reduce((sum, a) => sum + ((a.delivery_score + a.body_language_score + a.confidence_score) / 3), 0) / answers.length
            );
            analysis = {
                body_language_summary: "Maintained professional posture throughout the interview.",
                eye_contact_summary: "Good camera engagement with room for improvement.",
                confidence_summary: "Demonstrated confidence with clear communication.",
                overall_score: avgScore,
                key_strengths: ["Clear communication", "Professional demeanor", "Relevant examples"],
                key_improvements: ["Reduce filler words", "Improve eye contact", "Structure answers better"],
            };
        }

        // Update session with overall feedback
        const { error: updateError } = await supabase
            .from("interview_sessions")
            .update({
                body_language_summary: analysis.body_language_summary,
                eye_contact_summary: analysis.eye_contact_summary,
                confidence_summary: analysis.confidence_summary,
                overall_score: analysis.overall_score,
                status: "completed",
                completed_at: new Date().toISOString(),
            })
            .eq("id", sessionId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true, analysis }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in generate-overall-feedback:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
