import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Judge0 CE public instance (free, no API key needed)
const JUDGE0_API = "https://ce.judge0.com";

// Judge0 CE language IDs
const LANGUAGE_IDS: Record<string, number> = {
  "python":     71,  // Python 3.8
  "javascript": 63,  // JavaScript (Node.js 12)
  "typescript": 74,  // TypeScript 3.7
  "java":       62,  // Java (OpenJDK 13)
  "cpp":        54,  // C++ (GCC 9.2)
  "c":          50,  // C (GCC 9.2)
  "rust":       73,  // Rust 1.40
  "go":         60,  // Go 1.13
  "ruby":       72,  // Ruby 2.7
  "php":        68,  // PHP 7.4
  "csharp":     51,  // C# Mono 6.6
  "fsharp":     87,  // F# (Mono 6.6)
  "haskell":    12,  // Haskell (GHC 8.8)
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { compiler, code, input } = await req.json();

    if (!compiler || !code) {
      throw new Error("Fields 'compiler' and 'code' are required.");
    }

    // Extract base language name (e.g. 'python-3.14' → 'python')
    const langKey = compiler.split("-")[0].toLowerCase();
    const languageId = LANGUAGE_IDS[langKey];

    if (!languageId) {
      throw new Error(`Unsupported language: ${compiler}`);
    }

    // Step 1: Submit code to Judge0
    const submitRes = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=false`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin: input || "",
      }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      throw new Error(`Judge0 submission failed (${submitRes.status}): ${err}`);
    }

    const { token } = await submitRes.json();
    if (!token) throw new Error("No token returned from Judge0");

    // Step 2: Poll for result (max 10 attempts, 1s apart)
    let result: any = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(r => setTimeout(r, 1000));

      const pollRes = await fetch(
        `${JUDGE0_API}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,status,time,memory,exit_code`,
        { headers: { "Content-Type": "application/json" } }
      );

      if (!pollRes.ok) continue;

      result = await pollRes.json();
      // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4+=Error/done
      if (result.status?.id >= 3) break;
    }

    if (!result) throw new Error("Execution timed out. Please try again.");

    // Normalise to our existing response shape
    const stdout = result.stdout || "";
    const stderr = result.stderr || result.compile_output || "";
    const exitCode = result.status?.id === 3 ? 0 : (result.exit_code ?? 1);

    return new Response(
      JSON.stringify({
        output: stdout,
        errors: stderr,
        cpu_time: result.time ? String(result.time) : "0",
        memory: result.memory ? String(result.memory) : "0",
        exit_code: exitCode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("execute-code error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
