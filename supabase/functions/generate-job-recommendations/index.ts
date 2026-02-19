import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("Function started");
        const { userId, forceRefresh = false } = await req.json()

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'userId is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Dynamic Import: Supabase Client
        console.log("Importing Supabase...");
        let createClient;
        try {
            const module = await import('https://esm.sh/@supabase/supabase-js@2');
            createClient = module.createClient;
        } catch (err) {
            console.error("Failed to import Supabase:", err);
            throw new Error(`Supabase import failed: ${err.message}`);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Dynamic Import: Groq SDK
        console.log("Importing Groq...");
        let Groq;
        try {
            // Try the ESM CDN version which is most reliable for Deno
            const module = await import('https://esm.sh/groq-sdk@0.8.0');
            Groq = module.default;
        } catch (err) {
            console.error("Failed to import Groq:", err);
            throw new Error(`Groq import failed: ${err.message}`);
        }

        // Check if user has recent recommendations
        if (!forceRefresh) {
            const { data: existingRecs } = await supabase
                .from('job_recommendations')
                .select('id, created_at')
                .eq('user_id', userId)
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .limit(1)

            if (existingRecs && existingRecs.length > 0) {
                return new Response(
                    JSON.stringify({
                        message: 'Recent recommendations exist. Use forceRefresh=true to regenerate.',
                        cached: true
                    }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        }

        // Fetch user data
        console.log("Fetching user data...");
        const { data: textInterviews } = await supabase
            .from('interview_sessions')
            .select('id, role, overall_score, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)

        const { data: videoInterviews } = await supabase
            .from('video_interview_sessions')
            .select('id, role, overall_score, delivery_score, body_language_score, confidence_score, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, resume_url, github_url')
            .eq('id', userId)
            .single()

        // Calculate stats
        const allScores = [
            ...(textInterviews || []).map((i: any) => i.overall_score).filter(Boolean),
            ...(videoInterviews || []).map((i: any) => i.overall_score).filter(Boolean)
        ]
        const avgScore = allScores.length > 0
            ? Math.round(allScores.reduce((a: any, b: any) => a + b, 0) / allScores.length)
            : 50

        const totalInterviews = (textInterviews?.length || 0) + (videoInterviews?.length || 0)
        let experienceLevel = 'entry'
        if (avgScore > 75 && totalInterviews > 5) experienceLevel = 'senior'
        else if (avgScore > 60 && totalInterviews > 3) experienceLevel = 'mid'

        const roles = [...new Set([
            ...(textInterviews || []).map((i: any) => i.role).filter(Boolean),
            ...(videoInterviews || []).map((i: any) => i.role).filter(Boolean)
        ])]

        // Fetch jobs
        console.log("Fetching jobs...");
        const jobApiKey = Deno.env.get('JOB_SEARCH_API_KEY')
        // API key removed as it was causing 403 errors and the API is public
        const museUrl = `https://www.themuse.com/api/public/jobs?page=1&descending=true&category=Engineering`

        let jobPostings = [];
        try {
            const jobResponse = await fetch(museUrl)
            if (jobResponse.ok) {
                const jobData = await jobResponse.json()
                if (jobData.results) {
                    const realJobs = jobData.results.slice(0, 30).map((job: any) => ({
                        title: job.name,
                        company: job.company?.name || 'Unknown Company',
                        description: job.contents || job.short_description || '',
                        requirements: '',
                        salary_range: null,
                        location: job.locations?.[0]?.name || 'United States',
                        remote_ok: job.locations?.some((loc: any) => loc.name.toLowerCase().includes('remote')) || false,
                        experience_level: inferExperienceLevel(job.name, job.contents || ''),
                        skills_required: extractSkills(job.contents || ''),
                        application_url: job.refs?.landing_page || null,
                        source: 'themuse',
                        posted_date: new Date(job.publication_date || Date.now()).toISOString()
                    }))

                    const { error: jobInsertError } = await supabase
                        .from('job_postings')
                        .upsert(realJobs, { onConflict: 'title,company', ignoreDuplicates: true })

                    if (jobInsertError) console.error("Job insert error:", jobInsertError);
                }
            }
        } catch (e) {
            console.error("Job fetch error:", e);
        }

        // Get jobs from DB
        const { data: dbJobs } = await supabase
            .from('job_postings')
            .select('*')
            .order('posted_date', { ascending: false })
            .limit(50)

        jobPostings = dbJobs || [];

        if (jobPostings.length === 0) {
            // Fallback seed data if absolutely nothing found
            jobPostings = [{
                title: 'Software Engineer',
                company: 'Tech Corp',
                description: 'General software engineering role.',
                experience_level: 'mid',
                location: 'Remote',
                remote_ok: true,
                skills_required: ['JavaScript', 'React'],
                id: '00000000-0000-0000-0000-000000000000' // Placeholder
            }];
        }

        // AI Matching
        console.log("Starting AI matching...");
        const groqApiKey = Deno.env.get('GROQ_API_KEY')
        if (!groqApiKey) throw new Error('GROQ_API_KEY not set')

        const groq = new Groq({ apiKey: groqApiKey })

        const prompt = `Match candidate to jobs.
Profile: Score ${avgScore}, Level ${experienceLevel}, Roles ${roles.join(', ')}.
Jobs: ${JSON.stringify(jobPostings.slice(0, 10).map((j: any) => ({ id: j.id, title: j.title, company: j.company, skills: j.skills_required })))}

Return JSON: { "recommendations": [{ "job_id": "uuid", "match_score": 85, "match_reasons": ["r1"], "skill_gaps": [{"skill": "s1", "priority": "high", "estimated_time": "1w"}] }] }`

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a career advisor. Return valid JSON." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            response_format: { type: "json_object" }
        })

        const aiResponse = JSON.parse(completion.choices[0].message.content || '{}')
        const recommendations = aiResponse.recommendations || []

        // Store recommendations
        console.log("Storing recommendations...");
        const recommendationsToInsert = recommendations.map((rec: any) => ({
            user_id: userId,
            job_posting_id: rec.job_id,
            match_score: rec.match_score,
            match_reasons: rec.match_reasons,
            skill_gaps: rec.skill_gaps,
            status: 'new'
        }))

        // Clean up old
        await supabase.from('job_recommendations').delete().eq('user_id', userId)

        // Insert new
        const { data: insertedRecs, error: insertError } = await supabase
            .from('job_recommendations')
            .insert(recommendationsToInsert)
            .select()

        if (insertError) throw insertError;

        return new Response(
            JSON.stringify({ success: true, count: insertedRecs?.length || 0, recommendations: insertedRecs }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('CRITICAL ERROR:', error)
        return new Response(
            JSON.stringify({
                error: error.message,
                stack: error.stack,
                details: 'Check function logs'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // Return 200 to see error in frontend
        )
    }
})

function inferExperienceLevel(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()
    if (text.includes('senior')) return 'senior'
    if (text.includes('junior') || text.includes('entry')) return 'entry'
    return 'mid'
}

function extractSkills(description: string): string[] {
    const commonSkills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'AWS']
    return commonSkills.filter(skill => description.toLowerCase().includes(skill.toLowerCase()))
}
