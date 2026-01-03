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

    // تنظيف رقم الهاتف
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '966' + cleanPhone.substring(1)
    } else if (!cleanPhone.startsWith('966')) {
      cleanPhone = '966' + cleanPhone
    }

    console.log('Verifying OTP for:', cleanPhone)

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

    // البحث عن OTP في قاعدة البيانات
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
      
      // تحديث عدد المحاولات الفاشلة
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempts: supabaseAdmin.rpc('increment', { row_id: otpData?.id }) })
        .eq('phone', cleanPhone)
        .eq('verified', false)

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // التحقق من عدد المحاولات
    if (otpData.attempts >= 5) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // تحديث حالة OTP إلى "تم التحقق"
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
