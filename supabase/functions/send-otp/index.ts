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
    const { phone } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // تنظيف رقم الهاتف وإضافة كود السعودية إذا لزم الأمر
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '966' + cleanPhone.substring(1)
    } else if (!cleanPhone.startsWith('966')) {
      cleanPhone = '966' + cleanPhone
    }

    console.log('Sending OTP to:', cleanPhone)

    // إنشاء Supabase Admin Client
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

    // توليد رمز OTP (4 أرقام)
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString()
    
    // تاريخ انتهاء الصلاحية (5 دقائق)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    console.log('Generated OTP:', otpCode)

    // حفظ OTP في قاعدة البيانات
    const { error: dbError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        phone: cleanPhone,
        code: otpCode,
        expires_at: expiresAt
      })

    if (dbError) {
      console.error('Error saving OTP:', dbError)
      throw dbError
    }

    console.log('OTP saved to database')

    // إرسال SMS عبر تقنيات
    const taqnyatApiKey = Deno.env.get('TAQNYAT_API_KEY')
    const taqnyatSender = Deno.env.get('TAQNYAT_SENDER_NAME') || 'BaitAlQudratt'

    if (!taqnyatApiKey) {
      console.error('TAQNYAT_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP saved but SMS not sent (API key missing)',
          code: otpCode // للتطوير فقط - احذف هذا في الإنتاج
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const smsBody = `رمز التحقق الخاص بك في بيت القدرات: ${otpCode}\nصالح لمدة 5 دقائق`

    console.log('Sending SMS via Taqnyat...')

    const taqnyatResponse = await fetch('https://api.taqnyat.sa/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${taqnyatApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: [cleanPhone],
        body: smsBody,
        sender: taqnyatSender
      })
    })

    const taqnyatData = await taqnyatResponse.json()
    console.log('Taqnyat response:', taqnyatData)

    if (!taqnyatResponse.ok) {
      console.error('Taqnyat API error:', taqnyatData)
      throw new Error(`Taqnyat API error: ${JSON.stringify(taqnyatData)}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300 // 5 minutes in seconds
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-otp function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
