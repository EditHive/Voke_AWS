import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Groq from "groq-sdk"

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
        const { userId, forceRefresh = false } = await req.json()

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'userId is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        console.log('Supabase URL present:', !!supabaseUrl)
        console.log('Service Key present:', !!supabaseServiceKey)

        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Check if user has recent recommendations (within last 24 hours)
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

        // Fetch user's interview history
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

        // Fetch user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, resume_url, github_url')
            .eq('id', userId)
            .single()

        // Calculate average scores
        const allScores = [
            ...(textInterviews || []).map(i => i.overall_score).filter(Boolean),
            ...(videoInterviews || []).map(i => i.overall_score).filter(Boolean)
        ]
        const avgScore = allScores.length > 0
            ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
            : 50

        // Determine experience level based on scores and interview count
        const totalInterviews = (textInterviews?.length || 0) + (videoInterviews?.length || 0)
        let experienceLevel = 'entry'
        if (avgScore > 75 && totalInterviews > 5) experienceLevel = 'senior'
        else if (avgScore > 60 && totalInterviews > 3) experienceLevel = 'mid'

        // Extract roles from interviews
        const roles = [...new Set([
            ...(textInterviews || []).map(i => i.role).filter(Boolean),
            ...(videoInterviews || []).map(i => i.role).filter(Boolean)
        ])]

        // Fetch fresh job postings from external API
        console.log('Fetching real jobs from external API...')
        try {
            const jobApiKey = Deno.env.get('JOB_SEARCH_API_KEY')
            if (!jobApiKey) {
                console.warn('JOB_SEARCH_API_KEY not set, skipping external job fetch')
                throw new Error('API key not configured')
            }

            // Determine search query based on user's interview roles
            const searchQuery = roles.length > 0 ? roles[0] : 'software engineer'

            // Fetch jobs from external API (The Muse API)
            const museUrl = `https://www.themuse.com/api/public/jobs?api_key=${jobApiKey}&page=1&descending=true&category=Engineering`
            const jobResponse = await fetch(museUrl)
            const jobData = await jobResponse.json()

            if (jobData.results && jobData.results.length > 0) {
                console.log(`Fetched ${jobData.results.length} jobs from The Muse API`)

                // Transform and store jobs in database
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

                // Insert jobs (ignore duplicates)
                const { error: jobInsertError } = await supabase
                    .from('job_postings')
                    .upsert(realJobs, { onConflict: 'title,company', ignoreDuplicates: true })

                if (jobInsertError) {
                    console.error('Error inserting real jobs:', jobInsertError)
                } else {
                    console.log('Successfully stored real jobs in database')
                }
            }
        } catch (jobFetchError) {
            console.error('Error fetching real jobs:', jobFetchError)
            console.log('Falling back to existing job postings in database')
        }

        // Fetch available job postings (now includes real jobs)
        const { data: jobPostings } = await supabase
            .from('job_postings')
            .select('*')
            .order('posted_date', { ascending: false })
            .limit(50)

        if (!jobPostings || jobPostings.length === 0) {
            console.log('No jobs found in DB and external fetch failed. Auto-seeding default jobs...')

            const defaultJobs = [
                {
                    title: 'Software Engineer',
                    company: 'Tech Corp',
                    description: 'General software engineering role working with modern web technologies.',
                    requirements: 'Experience with JavaScript/TypeScript and React.',
                    salary_range: '$100k - $150k',
                    location: 'Remote',
                    remote_ok: true,
                    experience_level: 'mid',
                    skills_required: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
                    application_url: 'https://example.com/apply',
                    source: 'ai-generated',
                    posted_date: new Date().toISOString()
                },
                {
                    title: 'Frontend Developer',
                    company: 'Creative Studio',
                    description: 'Building beautiful user interfaces for web applications.',
                    requirements: 'Strong CSS and React skills.',
                    salary_range: '$90k - $130k',
                    location: 'New York, NY',
                    remote_ok: true,
                    experience_level: 'mid',
                    skills_required: ['React', 'CSS', 'Tailwind', 'Figma'],
                    application_url: 'https://example.com/apply',
                    source: 'ai-generated',
                    posted_date: new Date().toISOString()
                },
                {
                    title: 'Backend Engineer',
                    company: 'Data Systems',
                    description: 'Designing and implementing scalable backend services.',
                    requirements: 'Experience with Python or Go and databases.',
                    salary_range: '$110k - $160k',
                    location: 'San Francisco, CA',
                    remote_ok: false,
                    experience_level: 'senior',
                    skills_required: ['Python', 'SQL', 'API Design', 'AWS'],
                    application_url: 'https://example.com/apply',
                    source: 'ai-generated',
                    posted_date: new Date().toISOString()
                },
                {
                    title: 'Junior Developer',
                    company: 'StartUp Inc',
                    description: 'Great opportunity for new grads to learn and grow.',
                    requirements: 'Computer Science degree or bootcamp.',
                    salary_range: '$70k - $100k',
                    location: 'Austin, TX',
                    remote_ok: true,
                    experience_level: 'entry',
                    skills_required: ['JavaScript', 'Git', 'HTML/CSS'],
                    application_url: 'https://example.com/apply',
                    source: 'ai-generated',
                    posted_date: new Date().toISOString()
                },
                {
                    title: 'Product Manager',
                    company: 'Innovation Labs',
                    description: 'Lead product strategy and execution.',
                    requirements: 'Experience in product management.',
                    salary_range: '$120k - $180k',
                    location: 'Remote',
                    remote_ok: true,
                    experience_level: 'mid',
                    skills_required: ['Product Management', 'Agile', 'Communication'],
                    application_url: 'https://example.com/apply',
                    source: 'ai-generated',
                    posted_date: new Date().toISOString()
                },
            ]

            const { error: seedError } = await supabase
                .from('job_postings')
                .insert(defaultJobs)

            if (seedError) {
                console.error('Auto-seeding failed:', seedError)
                return new Response(
                    JSON.stringify({ error: 'No job postings available and auto-seeding failed.' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Fetch the newly seeded jobs
            const { data: seededJobs } = await supabase
                .from('job_postings')
                .select('*')
                .limit(50)

            // Use these jobs for the rest of the function
            if (seededJobs) {
                return new Response(
                    JSON.stringify({ message: 'System initialized with default jobs. Please try generating again.' }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        }

        // Initialize Groq
        const groqApiKey = Deno.env.get('GROQ_API_KEY')
        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY environment variable is not set')
        }
        console.log('Groq API Key present:', !!groqApiKey)

        const groq = new Groq({
            apiKey: groqApiKey
        })

        // Prepare prompt for AI
        const prompt = `You are an expert career advisor and job matching specialist.

Analyze this candidate's profile and match them with suitable jobs:

CANDIDATE PROFILE:
- Average Interview Score: ${avgScore}/100
- Total Interviews Completed: ${totalInterviews}
- Experience Level: ${experienceLevel}
- Roles Practiced: ${roles.join(', ') || 'General'}
- Has Resume: ${profile?.resume_url ? 'Yes' : 'No'}
- Has GitHub: ${profile?.github_url ? 'Yes' : 'No'}

AVAILABLE JOBS (${jobPostings.length} total):
${jobPostings.slice(0, 20).map((job, idx) => `
${idx + 1}. ${job.title} at ${job.company}
   - Experience: ${job.experience_level}
   - Location: ${job.location} ${job.remote_ok ? '(Remote OK)' : ''}
   - Skills: ${Array.isArray(job.skills_required) ? job.skills_required.join(', ') : 'Not specified'}
   - Salary: ${job.salary_range || 'Not specified'}
`).join('\n')}

TASK:
Match the candidate with the TOP 10 most suitable jobs from the list above.

For each match, provide:
1. job_id: The UUID of the job posting
2. match_score: 0-100 (how well they match)
3. match_reasons: Array of 3-5 specific reasons why they're a good fit
4. skill_gaps: Array of skills they need to learn (each with: skill name, priority: high/medium/low, estimated_time: e.g., "2 weeks")

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "job_id": "uuid-here",
      "match_score": 85,
      "match_reasons": ["reason 1", "reason 2", "reason 3"],
      "skill_gaps": [
        {"skill": "React", "priority": "high", "estimated_time": "2 weeks"},
        {"skill": "TypeScript", "priority": "medium", "estimated_time": "1 week"}
      ]
    }
  ]
}`

        // Call Groq API
        console.log('Calling Groq API...')
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert career advisor. Always respond with valid JSON only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: "json_object" }
        })

        const aiResponse = JSON.parse(completion.choices[0].message.content || '{}')
        const recommendations = aiResponse.recommendations || []

        // Store recommendations in database
        const sessionIds = [
            ...(textInterviews || []).map(i => i.id),
            ...(videoInterviews || []).map(i => i.id)
        ]

        const recommendationsToInsert = recommendations.map((rec: any) => ({
            user_id: userId,
            job_posting_id: rec.job_id,
            match_score: rec.match_score,
            match_reasons: rec.match_reasons,
            skill_gaps: rec.skill_gaps,
            interview_session_ids: sessionIds,
            status: 'new'
        }))

        // Delete old recommendations for this user
        await supabase
            .from('job_recommendations')
            .delete()
            .eq('user_id', userId)

        // Insert new recommendations
        const { data: insertedRecs, error: insertError } = await supabase
            .from('job_recommendations')
            .insert(recommendationsToInsert)
            .select()

        if (insertError) {
            console.error('Error inserting recommendations:', insertError)
            return new Response(
                JSON.stringify({ error: 'Failed to store recommendations', details: insertError }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                count: insertedRecs?.length || 0,
                recommendations: insertedRecs
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error in generate-job-recommendations:', error)
        return new Response(
            JSON.stringify({
                error: error.message,
                stack: error.stack,
                details: 'Check function logs for more info'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

// Helper function to infer experience level from job title/description
function inferExperienceLevel(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()

    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('staff')) {
        return 'senior'
    }
    if (text.includes('junior') || text.includes('entry') || text.includes('graduate') || text.includes('intern')) {
        return 'entry'
    }
    if (text.includes('mid') || text.includes('intermediate')) {
        return 'mid'
    }

    // Default based on years of experience mentioned
    if (text.match(/\d+\+?\s*years?/)) {
        const years = parseInt(text.match(/(\d+)\+?\s*years?/)?.[1] || '0')
        if (years >= 5) return 'senior'
        if (years >= 2) return 'mid'
        return 'entry'
    }

    return 'mid' // Default
}

// Helper function to extract skills from job description
function extractSkills(description: string): string[] {
    const commonSkills = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby',
        'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
        'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
        'Git', 'CI/CD', 'Agile', 'Scrum', 'REST', 'GraphQL',
        'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
        'System Design', 'Microservices', 'DevOps', 'Security'
    ]

    const foundSkills = commonSkills.filter(skill =>
        description.toLowerCase().includes(skill.toLowerCase())
    )

    return foundSkills.slice(0, 10) // Limit to 10 skills
}
