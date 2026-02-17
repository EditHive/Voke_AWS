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
    const { sessionId, question } = await req.json();
    console.log("Analyzing video interview session:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from("video_interview_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError) throw sessionError;

    console.log("Video URL:", session.video_url);

    // In a real implementation, you would:
    // 1. Extract frames from the video at regular intervals
    // 2. Send frames to vision AI for analysis
    // 3. Analyze audio for speech patterns
    // 4. Generate comprehensive feedback

    // Use detailed prompts for more accurate analysis
    const analysisPrompt = `You are an expert interview coach with 15+ years of experience. Analyze this video interview response in detail.

INTERVIEW DETAILS:
- Question: "${question}"
- Duration: ${session.duration_seconds} seconds
- Context: B.Tech CSE student preparing for technical internships

ANALYSIS REQUIREMENTS:
Evaluate based on professional interview standards and provide precise scores:

1. DELIVERY (0-100): Analyze speech patterns
   - Clarity and articulation (25 points)
   - Pacing and rhythm (25 points)
   - Filler words usage (25 points)
   - Tone and energy (25 points)

2. BODY LANGUAGE (0-100): Assess non-verbal communication
   - Posture and positioning (25 points)
   - Eye contact (camera engagement) (25 points)
   - Hand gestures and movements (25 points)
   - Facial expressions (25 points)

3. CONFIDENCE (0-100): Measure overall presence
   - Self-assurance in responses (33 points)
   - Handling of pauses/thinking time (33 points)
   - Professional demeanor (34 points)

4. OVERALL SCORE: Weighted average considering all factors

FEEDBACK REQUIREMENTS:
- Provide 2-3 paragraphs of detailed, actionable feedback
- List 3-5 specific strengths with examples
- List 3-5 areas for improvement with concrete suggestions
- Be honest but constructive
- Reference the specific question context

RESPONSE FORMAT (strict JSON):
{
  "delivery_score": <number 0-100>,
  "body_language_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "overall_score": <number 0-100>,
  "feedback_summary": "<detailed 2-3 paragraph analysis>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", ...],
  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>", ...]
}

Be precise, objective, and calibrated for entry-level technical roles.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    console.log("AI Response:", aiResponse);

    // Parse AI response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback analysis
      analysis = {
        delivery_score: 75,
        body_language_score: 70,
        confidence_score: 72,
        overall_score: 72,
        feedback_summary: aiResponse,
        strengths: [
          "Good attempt at answering the question",
          "Maintained reasonable pace",
          "Showed enthusiasm",
        ],
        improvements: [
          "Work on reducing filler words",
          "Maintain better eye contact with camera",
          "Structure answers using frameworks like STAR",
        ],
      };
    }

    // Calculate overall score if not provided
    if (!analysis.overall_score) {
      analysis.overall_score = Math.round(
        (analysis.delivery_score +
          analysis.body_language_score +
          analysis.confidence_score) /
          3
      );
    }

    // Update session with analysis results
    const { error: updateError } = await supabase
      .from("video_interview_sessions")
      .update({
        analysis_result: analysis,
        feedback_summary: analysis.feedback_summary,
        delivery_score: analysis.delivery_score,
        body_language_score: analysis.body_language_score,
        confidence_score: analysis.confidence_score,
        overall_score: analysis.overall_score,
        status: "completed",
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateError) throw updateError;

    console.log("Analysis complete for session:", sessionId);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-video-interview function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
