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
    const { messages, userId, skillGaps } = await req.json();

    // Input validation
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'messages' parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing 'userId' parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Adaptive interview request for user:", userId, "with", messages.length, "messages");

    // Environment variable validation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is not configured");
    }

    if (!supabaseKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's interview history for context (non-critical, continue on error)
    const { data: pastSessions, error: pastSessionsError } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (pastSessionsError) {
      console.error("Error fetching past sessions:", pastSessionsError);
    }

    const { data: videoSessions, error: videoSessionsError } = await supabase
      .from("video_interview_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5);

    if (videoSessionsError) {
      console.error("Error fetching video sessions:", videoSessionsError);
    }

    // Build context-aware system prompt
    const safeSkillGaps = skillGaps || { note: "No specific skill gaps identified yet. Conduct a general assessment." };
    const systemPrompt = `You are an expert technical interviewer conducting an adaptive interview simulation. Your goal is to help the candidate improve their skills based on their identified gaps.

CANDIDATE'S SKILL GAPS:
${JSON.stringify(safeSkillGaps, null, 2)}

INTERVIEW HISTORY CONTEXT:
- Completed ${pastSessions?.length || 0} text interview sessions
- Completed ${videoSessions?.length || 0} video interview sessions
- Average video score: ${videoSessions && videoSessions.length > 0
        ? Math.round(videoSessions.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / videoSessions.length)
        : "N/A"}

YOUR APPROACH:
1. Focus on the identified skill gaps systematically
2. Start with fundamental concepts, then increase difficulty based on responses
3. Provide immediate, constructive feedback after each answer
4. Use real-world scenarios and practical examples
5. Adapt question difficulty based on candidate's performance
6. Reference specific gaps when asking questions (e.g., "Since system design is a focus area...")

RESPONSE STRUCTURE:
For the first message, start with a brief introduction and your first targeted question.

For subsequent responses, use EXACTLY this format:

### ✅ What You Did Well
[2-3 specific positive points about their answer]

### ⚠️ Areas to Improve
[2-3 specific improvements needed, tied to their skill gaps]

### 📝 Model Answer
[A comprehensive, detailed professional answer that demonstrates mastery. Include:
- Clear explanation of concepts
- Real-world examples
- Best practices
- Common pitfalls to avoid
This section should be 3-5 paragraphs with concrete details.]

### 🎯 Skill Gap Analysis
[Brief note on which skill gap(s) this question addresses and progress made]

### ❓ Next Question
[Your next adaptive question, calibrated to their performance]

ADAPTIVE DIFFICULTY RULES:
- If they struggle with basics: Focus on fundamentals with simpler follow-ups
- If they show strength: Increase complexity and depth
- If they miss key concepts: Circle back with different approaches
- Always tie questions back to their specific skill gaps

Keep your tone professional, encouraging, and educational. This is a learning experience, not just assessment.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits depleted. Please contact support.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error) {
    console.error("Error in adaptive-interview-chat function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
