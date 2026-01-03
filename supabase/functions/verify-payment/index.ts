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

    const { paymentId } = await req.json()

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Missing paymentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // جلب معلومات الدفع من ميسر
    const moyasarResponse = await fetch(`https://api.moyasar.com/v1/invoices/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(moyasarSecretKey + ':')}`
      }
    })

    if (!moyasarResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentData = await moyasarResponse.json()
    console.log('Payment data from Moyasar:', paymentData)

    // التحقق من حالة الدفع
    if (paymentData.status !== 'paid') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: paymentData.status,
          message: 'Payment not completed yet' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const metadata = paymentData.metadata || {}
    const userId = metadata.user_id
    const planId = metadata.plan_id
    const durationDays = metadata.duration_days || 30

    if (!userId || !planId) {
      return new Response(
        JSON.stringify({ error: 'Missing metadata' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // تحديث حالة الدفع في قاعدة البيانات
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        payment_method: paymentData.source?.type || null,
        card_brand: paymentData.source?.company || null,
        card_last_four: paymentData.source?.number?.slice(-4) || null,
        metadata: paymentData,
        updated_at: new Date().toISOString()
      })
      .eq('moyasar_payment_id', paymentId)

    if (updateError) {
      console.error('Error updating payment:', updateError)
    }

    // حساب تاريخ الانتهاء
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + durationDays)

    // جلب معلومات الباقة لتحديد tier
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', planId)
      .single()

    let tier = 'basic'
    if (plan?.name.includes('مميز') || plan?.name.includes('Premium')) {
      tier = 'premium'
    }

    // تحديث اشتراك المستخدم
    const { error: subscriptionError } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_end: endDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError)
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Subscription updated for user ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment verified and subscription updated',
        tier: tier,
        endDate: endDate.toISOString().split('T')[0]
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Verify payment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
