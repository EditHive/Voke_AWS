
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

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
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

    Analyze the "user" messages in the transcript carefully.

    **6Q PERSONALITY ANALYSIS FRAMEWORK:**
    Analyze the candidate's personality traits (0-100) based on the comprehensive "6Q Framework":

    **1. IQ (Intelligence Quotient)** - Problem solving, concept grasping, and logic
       High IQ Indicators: Academic performance, uses specific examples, asks counter-questions, minimal emotional expression
       Developing IQ Indicators: Unclear responses, changes topic often, rarely asks follow-ups, relies on emotions

    **2. EQ (Emotional Quotient)** - Emotional literacy, self-awareness, and empathy
       High EQ Indicators: Admits mistakes without defensiveness, uses emotional vocabulary, acknowledges strengths and struggles, values teamwork, takes pauses
       Developing EQ Indicators: Blames others, holds grudges, displays frustration quickly, seeks constant validation

    **3. CQ (Creativity Quotient)** - Finding new ways to look at questions
       High CQ Indicators: Asks diverse questions, uses "what if" thinking, associates concepts creatively, comfortable with trial and error
       Developing CQ Indicators: Uncomfortable with open-ended questions, prefers structured paths, rarely asks beyond task

    **4. AQ (Adversity Quotient)** - Handling pressure, setbacks, and uncertainty
       High AQ Indicators: Uses affirming gestures, talks about process not blame, clear reflection, calm tone, listens when corrected
       Developing AQ Indicators: Missing reflection, quickly blames, immediate defensiveness, quick frustration

    **5. SQ (Social Quotient)** - Connecting, collaborating, and building rapport
       High SQ Indicators: Adapts tone to audience, includes others, handles conflict maturely, understands non-verbal cues
       Developing SQ Indicators: Blames team, dominates or withdraws, focuses only on own ideas

    **6. MQ (Moral Quotient)** - Integrity, honesty, and fairness
       High MQ Indicators: Takes responsibility, acknowledges others' contributions, consistency across contexts, owns mistakes
       Developing MQ Indicators: Alters behavior based on audience, avoids reflection after conflicts

    **DETERMINE THE PERSONALITY CLUSTER based on the top 3 traits:**
    - Balanced Thinker (IQ+EQ+SQ): Logical, calm, socially aware
    - Innovative Problem Solver (IQ+CQ+AQ): Logical, creative, works under pressure
    - Creative Strategist (IQ+CQ+SQ): Smart, imaginative, people-friendly
    - Resilient Scholar (IQ+EQ+AQ): Clear thinker, disciplined
    - Responsible Analyst (IQ+SQ+MQ): Logical, reliable, ethical
    - Compassionate Leader (EQ+SQ+MQ): Empathetic, ethical, socially aware
    - Creative People Person (EQ+CQ+SQ): Expressive, creative, interactive
    - Ethical Resilient Leader (EQ+AQ+MQ): Calm, fair, good under stress
    - Adaptive Innovator (CQ+AQ+SQ): Creative, adaptable
    - Socially Conscious Creator (CQ+SQ+MQ): Creative, ethical, community-driven
    - Ethical Executor (IQ+MQ+AQ): Disciplined, values-driven
    - Empathic Creator (EQ+CQ+MQ): Emotional, creative, grounded
    - Insightful Innovator (IQ+EQ+CQ): Logical, creative, empathetic
    - Thoughtful Decision Maker (IQ+EQ+MQ): Mature, balanced
    - Creative Resilient Communicator (CQ+EQ+AQ): Creative, calm, confident
    - Purpose-Led Problem Solver (MQ+CQ+AQ): Ethical, innovation-driven
    - High-Output Collaborator (IQ+SQ+AQ): Team-driven, fast learner
    - The Stabiliser (EQ+SQ+AQ): Emotionally strong, adaptive

    **UPDATED OUTPUT FORMAT:**
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
      },
      "six_q_score": {
        "iq": number (0-100),
        "eq": number (0-100),
        "cq": number (0-100),
        "aq": number (0-100),
        "sq": number (0-100),
        "mq": number (0-100)
      },
      "personality_cluster": "Cluster Name"
    }`;

    // Format messages for Groq
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
      throw new Error("No content received from Groq");
    }

    // Clean up potential markdown formatting
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
