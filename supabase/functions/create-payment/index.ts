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
    const moyasarSecretKey = Deno.env.get('MOYASAR_SECRET_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { planId, userId, callbackUrl } = await req.json()

    if (!planId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing planId or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // جلب معلومات الباقة
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // جلب معلومات المستخدم
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, email, phone')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إنشاء payment في ميسر
    const amountInHalalas = Math.round(parseFloat(plan.price) * 100)
    
    // التحقق من أن المبلغ صحيح ومضاعف 10 (ينتهي بصفر)
    if (!amountInHalalas || amountInHalalas < 100 || amountInHalalas % 10 !== 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid amount for SAR. Must end with 0', 
          amount: plan.price,
          amountInHalalas: amountInHalalas 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إنشاء Invoice في ميسر
    const moyasarPayload = {
      amount: amountInHalalas,
      currency: 'SAR',
      description: `اشتراك ${plan.name}`,
      callback_url: `https://xyrdpmhzwjejkstwovyx.supabase.co/functions/v1/moyasar-webhook`,
      metadata: {
        user_id: userId,
        plan_id: planId,
        plan_name: plan.name,
        duration_days: plan.duration_days
      }
    }

    const moyasarResponse = await fetch('https://api.moyasar.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(moyasarSecretKey + ':')}`
      },
      body: JSON.stringify(moyasarPayload)
    })

    const moyasarData = await moyasarResponse.json()

    if (!moyasarResponse.ok) {
      console.error('Moyasar error:', moyasarData)
      return new Response(
        JSON.stringify({ error: 'Failed to create invoice', details: moyasarData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // حفظ Payment في قاعدة البيانات
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        plan_id: planId,
        moyasar_payment_id: moyasarData.id,
        amount: plan.price,
        currency: 'SAR',
        status: 'pending',
        metadata: moyasarData
      })

    if (paymentError) {
      console.error('Database error:', paymentError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: moyasarData.id,
        payment_url: moyasarData.url,
        amount: plan.price,
        currency: 'SAR'
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
