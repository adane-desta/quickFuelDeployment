import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

  try {

        // Only accept POST requests
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        
    // Create a Supabase client with the service role key
    const supabase = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Parse request body
    const { email, password, operatorData, stationData } = await req.json()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    // 2. Create station (you may want to do this in a transaction, but for simplicity we do it here)
    const { data: station, error: stationError } = await supabase
      .from('stations')
      .insert({
        ...stationData,
        operator_id: authData.user.id,
        is_verified: false,
      })
      .select()
      .single()

    if (stationError) {
      // Rollback: delete the auth user if station creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw stationError
    }

    // 3. Create operator profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name: operatorData.fullName,
        phone: operatorData.phone,
        role: 'operator',
        is_active: true,
        station_id: station.id,
        station_name: stationData.name,
        business_license: operatorData.businessLicense,
      })

    if (profileError) {
      // Rollback: delete station and auth user
      await supabase.from('stations').delete().eq('id', station.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return new Response(
      JSON.stringify({ user: authData.user, station }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})