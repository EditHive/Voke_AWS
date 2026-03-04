import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BedrockRuntimeClient, ConverseCommand } from "npm:@aws-sdk/client-bedrock-runtime";

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
    const { messages, userId, skillGaps, userContext } = await req.json();

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
    const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
    const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    const AWS_REGION = Deno.env.get("AWS_REGION") || "us-east-1";

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are not configured");
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
    const systemPrompt = `You are an expert technical interviewer conducting an adaptive interview simulation. Your goal is to help the candidate improve their skills based on their identified gaps and verify their profile claims.

CANDIDATE PROFILE & CONTEXT:
${userContext || "No specific profile context provided."}

CANDIDATE'S SKILL GAPS:
${JSON.stringify(safeSkillGaps, null, 2)}

INTERVIEW HISTORY CONTEXT:
- Completed ${pastSessions?.length || 0} text interview sessions
- Completed ${videoSessions?.length || 0} video interview sessions
- Average video score: ${videoSessions && videoSessions.length > 0
        ? Math.round(videoSessions.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / videoSessions.length)
        : "N/A"}

YOUR APPROACH:
1. **FIRST INTERACTION RULES**:
   - IF the user says "Start the interview..." or if this is the very first message:
   - YOU MUST ASK: "Tell me about yourself." (or a slight variation like "Let's start with an introduction. Tell me about yourself and your background.")
   - DO NOT evaluate the user's "Start" command. Just ask the question.

2. **SUBSEQUENT INTERACTIONS**:
   - Focus on the identified skill gaps systematically.
   - VERIFY PROFILE CLAIMS (GitHub, Resume, LeetCode).
   - Provide immediate feedback.

RESPONSE STRUCTURE (Strict JSON-like markdown):

### ✅ What You Did Well
[2-3 specific positive points]

### ⚠️ Areas to Improve
[2-3 specific improvements]

### 📝 Model Answer
[CRITICAL: Write a CONCISE, PERFECT EXAMPLE ANSWER in the FIRST PERSON ("I").]
[DO NOT write: "The candidate should mention..." or "A good answer would be..."]
[WRITE IT LIKE THIS: "To manage a project with tight deadlines, I would prioritize tasks based on impact and urgency, allocate resources efficiently, and maintain clear communication with stakeholders to ensure successful delivery."]
[Keep it to 2-3 sentences maximum. Be direct, specific, and actionable. Focus on the key approach/strategy, not lengthy explanations.]

### 🎯 Skill Gap Analysis
[Brief note on progress]

### ⚠️ Verification Note (ONLY include this section if the user mentioned a project, skill, or experience that is NOT found in their GitHub/Resume context above)
[Example: "I did not find any project named 'blockchain app' in your GitHub profile or resume. Please provide specific implementation details to verify this claim."]
[If everything they mentioned is verified in their profile, DO NOT include this section at all.]

### ❓ Next Question
[Your next adaptive question]

ADAPTIVE DIFFICULTY RULES:
- If they struggle with basics: Focus on fundamentals.
- If they show strength: Increase complexity.
- Always tie questions back to their specific skill gaps.

Keep your tone professional, encouraging, and educational.`;

    const bedrock = new BedrockRuntimeClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    // Format messages for Bedrock Converse API
    const bedrockMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: [{ text: m.content }]
    }));

    const command = new ConverseCommand({
      modelId: "meta.llama3-3-70b-instruct-v1:0",
      messages: bedrockMessages,
      system: [{ text: systemPrompt }],
      inferenceConfig: {
        temperature: 0.3,
        maxTokens: 4096,
      }
    });

    const data = await bedrock.send(command);
    const content = data.output?.message?.content?.[0]?.text ?? "";

    return new Response(
      JSON.stringify({ content }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
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
