
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // Delete the user from auth.users. 
        // This requires the SERVICE ROLE KEY (which we have instantiated above).
        // Cascading deletes should handle the public schema data (profiles, etc.) if configured in SQL.
        // If not, we might need to manually delete from tables first. 
        // Assuming standard Supabase cascade on foreign keys or manual cleanup:

        // 1. Delete from profiles (if not cascade)
        // await supabase.from('profiles').delete().eq('id', user.id)

        // 2. Delete from auth.users (The big one)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(
            user.id
        )

        if (deleteError) {
            throw deleteError
        }

        return new Response(
            JSON.stringify({ message: 'User account deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
