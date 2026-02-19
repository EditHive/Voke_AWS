import { supabase } from '@/integrations/supabase/client';

export interface ProfileContext {
    fullName: string;
    context: string;
    projectCount: number;
    hasResume: boolean;
    hasGithub: boolean;
}

export async function loadUserProfileContext(): Promise<ProfileContext> {
    try {
        console.log('[ProfileContext] Starting profile context load...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No authenticated user');
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            throw new Error('Failed to load profile');
        }

        console.log('[ProfileContext] Profile loaded:', {
            hasGithub: !!profile.github_url,
            hasResume: !!profile.resume_url
        });

        let context = \`User Name: \${profile.full_name || 'Candidate'}\\n\`;
        let projectCount = 0;
        let hasGithub = false;
        let hasResume = false;

        // Fetch GitHub context
        if (profile.github_url) {
            try {
                const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
                const usernameMatch = profile.github_url.match(/github\\.com\\/([^\\/]+)/);
                
                if (usernameMatch) {
                    const username = usernameMatch[1];
                    const headers: Record<string, string> = {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'Voke-Interview-App'
                    };
                    
                    if (githubToken) {
                        headers['Authorization'] = \`token \${githubToken}\`;
                    }
                    
                    const reposResponse = await fetch(
                        \`https://api.github.com/users/\${username}/repos?sort=updated&per_page=5\`,
                        { headers }
                    );
                    
                    if (reposResponse.ok) {
                        const repos = await reposResponse.json();
                        projectCount = repos.length;
                        
                        const projectSummaries = await Promise.all(
                            repos.map(async (repo: any) => {
                                let readmeSummary = 'No README available';
                                
                                try {
                                    const readmeResponse = await fetch(
                                        \`https://api.github.com/repos/\${username}/\${repo.name}/readme\`,
                                        { headers }
                                    );
                                    
                                    if (readmeResponse.ok) {
                                        const readmeData = await readmeResponse.json();
                                        const decodedContent = atob(readmeData.content);
                                        readmeSummary = decodedContent.substring(0, 300).replace(/[#*\`\\n]/g, ' ').trim();
                                    }
                                } catch (e) {
                                    console.log(\`[ProfileContext] No README for \${repo.name}\`);
                                }
                                
                                return \`Project: \${repo.name}\\n- Description: \${repo.description || 'No description'}\\n- Tech: \${repo.language || 'Not specified'}\\n- Stars: \${repo.stargazers_count}\\n- Summary: \${readmeSummary}\`;
                            })
                        );
                        
                        context += \`\\nGITHUB PROJECTS:\\n\${projectSummaries.join('\\n\\n')}\\n\`;
                        hasGithub = true;
                        console.log('[ProfileContext] ✓ GitHub projects loaded:', projectCount);
                    }
                }
            } catch (e) {
                console.error('[ProfileContext] GitHub fetch error:', e);
                context += \`GitHub Profile: \${profile.github_url}\\n\`;
            }
        }

        // Parse resume PDF
        if (profile.resume_url) {
            try {
                console.log('[ProfileContext] Fetching resume...');
                const resumeResponse = await fetch(profile.resume_url);
                const resumeBlob = await resumeResponse.blob();
                
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                    'pdfjs-dist/build/pdf.worker.min.mjs',
                    import.meta.url
                ).toString();
                
                const arrayBuffer = await resumeBlob.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                let resumeText = '';
                for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    resumeText += pageText + '\\n';
                }
                
                resumeText = resumeText.replace(/\\s+/g, ' ').trim().substring(0, 2000);
                context += \`\\nRESUME CONTENT:\\n\${resumeText}\\n\`;
                hasResume = true;
                console.log('[ProfileContext] ✓ Resume parsed, length:', resumeText.length);
            } catch (e) {
                console.error('[ProfileContext] Resume parse error:', e);
                context += \`Resume URL: \${profile.resume_url}\\n\`;
            }
        }

        if (profile.linkedin_url) {
            context += \`LinkedIn Profile: \${profile.linkedin_url}\\n\`;
        }

        console.log('[ProfileContext] Context loaded successfully, length:', context.length);

        return {
            fullName: profile.full_name || 'Candidate',
            context,
            projectCount,
            hasResume,
            hasGithub
        };
    } catch (error) {
        console.error('[ProfileContext] Error loading profile context:', error);
        throw error;
    }
}
