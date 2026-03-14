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

    if (authError) throw new Error(`Auth creation failed: ${authError.message}`)
    if (!authData.user) throw new Error('Auth user not created')
    const userId = authData.user.id

    // 2. Create operator profile in `users` table 
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: operatorData.fullName,
        phone: operatorData.phone,
        role: 'operator',
        is_active: true,
        business_license: operatorData.businessLicense,
      })
    if (profileError) {
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(userId)
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }

     // 3.create the station, referencing the existing profile ID
     const { data: station, error: stationError } = await supabase
        .from('stations')
        .insert({
          ...stationData,
          operator_id: userId, 
          is_verified: false,
        })
        .select()
        .single()
      if (stationError) {
        // Rollback: delete profile and auth user
        await supabase.from('users').delete().eq('id', userId)
        await supabase.auth.admin.deleteUser(userId)
        throw new Error(`Station creation failed: ${stationError.message}`)
      }

      // 4. Update the operator profile with the station_id and station_name
      const { error: updateError } = await supabase
      .from('users')
      .update({
        station_id: station.id,
        station_name: stationData.name,
      })
      .eq('id', userId)
    if (updateError) {
      // Non-critical – log but don't fail whole transaction
      console.error('Failed to update profile with station details:', updateError)
    } 

    return new Response(
      JSON.stringify({ user: authData.user, station }),
      { status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})