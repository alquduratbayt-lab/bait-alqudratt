import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TAQNYAT_API_KEY = 'c8e65955d35c71a71dd7c17a9da0e028';
const TAQNYAT_SENDER_NAME = 'Balqudrat';
const TAQNYAT_API_URL = 'https://api.taqnyat.sa/v1/messages';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { phone, action } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'رقم الجوال مطلوب' }),
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

    // التحقق من وجود المستخدم
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, phone')
      .eq('phone', formattedPhone)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'رقم الجوال غير مسجل. الرجاء التسجيل من التطبيق أولاً.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // توليد كود عشوائي من 4 أرقام
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // حساب وقت انتهاء الصلاحية (60 ثانية)
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();

    // حفظ OTP في قاعدة البيانات
    const { error: dbError } = await supabase
      .from('otp_codes')
      .insert([
        {
          phone: formattedPhone,
          code: otp,
          expires_at: expiresAt,
          verified: false,
          attempts: 0,
        },
      ]);

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'فشل حفظ رمز التحقق' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إرسال SMS عبر تقنيات
    const message = `أهلاً ${userData.name}\nكود التحقق: ${otp}\nللاشتراك في بيت القدرات`;

    const taqnyatResponse = await fetch(TAQNYAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAQNYAT_API_KEY}`,
      },
      body: JSON.stringify({
        recipients: [formattedPhone],
        body: message,
        sender: TAQNYAT_SENDER_NAME,
      }),
    });

    if (!taqnyatResponse.ok) {
      const errorData = await taqnyatResponse.json();
      console.error('Taqnyat API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'فشل إرسال رمز التحقق' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم إرسال رمز التحقق بنجاح',
        userId: userData.id 
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
