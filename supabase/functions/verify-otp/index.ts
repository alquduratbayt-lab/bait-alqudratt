import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '966' + cleanPhone.substring(1)
    } else if (!cleanPhone.startsWith('966')) {
      cleanPhone = '966' + cleanPhone
    }

    console.log('Verifying OTP for:', cleanPhone)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpData) {
      console.error('OTP not found or expired:', otpError)

      // زيادة عدد المحاولات الفاشلة على آخر OTP غير محقق
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempts: (otpData?.attempts ?? 0) + 1 })
        .eq('phone', cleanPhone)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)

      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (otpData.attempts >= 5) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpData.id)

    if (updateError) {
      console.error('Error updating OTP:', updateError)
      throw updateError
    }

    console.log('OTP verified successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'تم التحقق بنجاح'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in verify-otp function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
