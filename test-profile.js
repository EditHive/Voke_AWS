// Quick test script to check profile data
import { supabase } from './src/integrations/supabase/client';

async function testProfileData() {
    console.log('=== Testing Profile Data ===');

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', user?.id, userError);

    if (!user) {
        console.error('No user logged in!');
        return;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    console.log('Profile:', profile, profileError);
    console.log('GitHub URL:', profile?.github_url);
    console.log('Resume URL:', profile?.resume_url);

    // Test Edge Function
    if (profile?.github_url) {
        console.log('Testing fetch-github-context...');
        const { data, error } = await supabase.functions.invoke('fetch-github-context', {
            body: {
                githubUrl: profile.github_url,
                githubToken: import.meta.env.VITE_GITHUB_TOKEN
            }
        });
        console.log('Edge Function Result:', data, error);
    }

    // Test resume fetch
    if (profile?.resume_url) {
        console.log('Testing resume fetch...');
        try {
            const response = await fetch(profile.resume_url);
            console.log('Resume fetch status:', response.status, response.statusText);
            const blob = await response.blob();
            console.log('Resume blob size:', blob.size, 'type:', blob.type);
        } catch (e) {
            console.error('Resume fetch error:', e);
        }
    }
}

testProfileData();
