import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
        const { resumeUrl } = await req.json();

        const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
        if (!GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not configured");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("No authorization header");
        }

        // Get user from token
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        // Fetch resume content from URL
        const resumeResponse = await fetch(resumeUrl);
        if (!resumeResponse.ok) {
            throw new Error("Failed to fetch resume");
        }

        // For now, we'll analyze based on the URL and basic metadata
        // In a production app, you'd parse the PDF content here
        const resumeText = `Resume analysis for ${user.email}`;

        const analysisPrompt = `You are an expert resume reviewer and ATS (Applicant Tracking System) specialist. Analyze this resume and provide detailed feedback.

**ANALYSIS REQUIREMENTS:**

1. **ATS Compatibility Score (0-100)**: Rate how well this resume will perform in ATS systems
2. **Keywords**: Identify missing important keywords for tech roles
3. **Structure & Formatting**: Evaluate layout, sections, and readability
4. **Content Quality**: Assess impact, achievements, and clarity
5. **Improvements**: Provide specific, actionable suggestions

**OUTPUT FORMAT (JSON):**
{
  "ats_score": number (0-100),
  "keywords": {
    "present": ["keyword1", "keyword2"],
    "missing": ["keyword3", "keyword4"]
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "structure_feedback": "detailed feedback on structure",
  "content_feedback": "detailed feedback on content",
  "overall_summary": "2-3 sentence summary"
}

**RESUME TO ANALYZE:**
${resumeText}

Provide honest, constructive feedback that will help the candidate improve their resume.`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "You are an expert resume reviewer." },
                        { role: "user", content: analysisPrompt }
                    ],
                    temperature: 0.3,
                    response_format: { type: "json_object" },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API error:", response.status, errorText);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        let aiContent = data.choices[0]?.message?.content;

        if (!aiContent) {
            throw new Error("No response from AI");
        }

        // Clean up and parse
        aiContent = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
        const analysis = JSON.parse(aiContent);

        // Save analysis to database
        const { error: insertError } = await supabase
            .from("resume_analyses")
            .insert({
                user_id: user.id,
                resume_url: resumeUrl,
                analysis_result: analysis,
                ats_score: analysis.ats_score
            });

        if (insertError) {
            console.error("Error saving analysis:", insertError);
        }

        return new Response(JSON.stringify(analysis), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error in analyze-resume:", error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
