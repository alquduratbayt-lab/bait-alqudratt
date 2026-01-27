import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { phone, code } = await req.json()

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'رقم الجوال ورمز التحقق مطلوبان' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // تنسيق رقم الهاتف
    let formattedPhone = phone.trim().replace(/\s/g, '');
    if (formattedPhone.startsWith('05')) {
      formattedPhone = `+966${formattedPhone.slice(1)}`;
    } else if (!formattedPhone.startsWith('+966')) {
      formattedPhone = `+966${formattedPhone}`;
    }

    // البحث عن OTP في قاعدة البيانات
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // تحديث OTP كـ verified
    await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpData.id);

    // جلب بيانات المستخدم
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', formattedPhone)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'المستخدم غير موجود' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إنشاء token بسيط للجلسة (يمكن تحسينه لاحقاً)
    const sessionToken = btoa(`${userData.id}:${Date.now()}:${Math.random().toString(36)}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: userData.id,
          name: userData.name,
          phone: userData.phone,
          subscription_tier: userData.subscription_tier,
          subscription_status: userData.subscription_status,
          subscription_end: userData.subscription_end,
        },
        sessionToken
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
