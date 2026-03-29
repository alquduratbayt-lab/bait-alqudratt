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
    const { phone, userName, purpose } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '966' + cleanPhone.substring(1)
    } else if (!cleanPhone.startsWith('966')) {
      cleanPhone = '966' + cleanPhone
    }

    console.log('Sending OTP to:', cleanPhone, 'purpose:', purpose || 'registration')

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

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const { error: dbError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        phone: cleanPhone,
        code: otpCode,
        expires_at: expiresAt,
        verified: false,
        attempts: 0,
      })

    if (dbError) {
      console.error('Error saving OTP:', dbError)
      throw dbError
    }

    console.log('OTP saved to database')

    const smsProxyUrl = Deno.env.get('SMS_PROXY_URL') ?? 'https://baitalqudrat.com/api/send-sms'
    const smsProxySecret = Deno.env.get('SMS_PROXY_SECRET')

    if (!smsProxySecret) {
      console.error('SMS_PROXY_SECRET not found')
      return new Response(
        JSON.stringify({ success: true, message: 'OTP saved but SMS not sent (proxy secret missing)' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isPwdReset = purpose === 'password_reset'
    let smsBody: string

    if (userName) {
      smsBody = isPwdReset
        ? `أهلاً ${userName}\nكود التحقق: ${otpCode}\nلاستعادة كلمة المرور في بيت القدرات`
        : `أهلاً ${userName}\nكود التحقق: ${otpCode}\nلإنشاء حسابكم في بيت القدرات`
    } else {
      smsBody = isPwdReset
        ? `كود التحقق: ${otpCode}\nلاستعادة كلمة المرور في بيت القدرات`
        : `كود التحقق: ${otpCode}\nلإنشاء حسابكم في بيت القدرات`
    }

    console.log('Sending SMS via proxy...')

    const proxyResponse = await fetch(smsProxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: smsProxySecret,
        recipients: [cleanPhone],
        body: smsBody,
      })
    })

    const proxyData = await proxyResponse.json()
    console.log('Proxy response:', proxyData)

    if (!proxyResponse.ok) {
      console.error('SMS proxy error:', proxyData)
      throw new Error(`SMS proxy error: ${JSON.stringify(proxyData)}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully', expiresIn: 300 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-otp function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
