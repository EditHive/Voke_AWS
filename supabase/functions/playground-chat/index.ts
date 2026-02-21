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
        const { messages } = await req.json();

        const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
        if (!GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not configured");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        // const supabase = createClient(supabaseUrl, supabaseKey); // Not strictly needed unless we save chat history, which we might want to skip for playground or implement later. 
        // For now, let's keep it simple and stateless like the request implies (analysis tool), 
        // BUT the existing playground chat saved messages. To preserve that "chat" feel, we might want to save it if the user is authenticated.
        // Let's stick to the stateless analysis for speed/simplicity unless the existing one was saving it.
        // Looking at interview-coach-chat, it SAVES sessions. 
        // However, for a "Playground" which is often transient, maybe we don't need to persist every "fix my code" request to the DB?
        // Let's add Auth check mainly for security, but maybe skip DB writes for this iteration to reduce complexity, 
        // as the user's request is "analysis" which feels ephemeral.
        // ACTUALLY, sticking to the pattern is safer. Let's verify auth.

        // Get authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("No authorization header");
        }

        // System prompt optimized for code analysis
        const systemPrompt = `You are an expert Senior Software Engineer and Code Mentor.
Your goal is to help users learn by analyzing their code, finding bugs, and suggesting improvements.

**YOUR RESPONSIBILITIES:**
1.  **Analyze Code:** specific syntax errors, logical bugs, or performance issues.
2.  **Explain Simply:** Use clear, concise language. Avoid jargon where possible, or explain it.
3.  **Encourage Best Practices:** Suggest cleaner ways to write the code (e.g., variable naming, proper indentation).
4.  **Be Supportive:** If the code is good, say so! If it's broken, help them fix it without being condescending.

**FORMATTING:**
- Use Markdown for code blocks found in your explanation.
- Keep responses concise.
- If you see a syntax error, point it out immediately.

**CONTEXT:**
The user is working in a web-based code playground.
`;

        const formattedMessages = [
            { role: "system", content: systemPrompt },
            ...messages
        ];

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
                    messages: formattedMessages,
                    temperature: 0.3, // Lower temperature for more deterministic/accurate code analysis
                    max_tokens: 1500,
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API error:", response.status, errorText);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;

        if (!aiResponse) {
            throw new Error("No response from AI");
        }

        return new Response(JSON.stringify({ response: aiResponse }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error in playground-chat:", error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
