import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const payload = await req.json()
    console.log('🔔 Webhook received:', JSON.stringify(payload))

    // Moyasar قد يرسل البيانات بعدة طرق
    let paymentData = payload.data || payload
    let eventType = payload.type || 'payment'
    
    // إذا كان الـ payload يحتوي على id مباشرة، استخدمه
    if (payload.id && !payload.data) {
      paymentData = payload
    }

    console.log('Event type:', eventType)
    console.log('Payment data:', JSON.stringify(paymentData))

    const paymentId = paymentData.id
    const status = paymentData.status
    const metadata = paymentData.metadata || {}
    
    console.log('Payment ID:', paymentId)
    console.log('Status:', status)
    console.log('Metadata:', JSON.stringify(metadata))

    // تحديث فقط إذا كان الدفع ناجح
    if (status !== 'paid') {
      console.log('Payment not paid, status:', status)
      return new Response(
        JSON.stringify({ message: 'Payment not paid yet' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // تحديث حالة الدفع في قاعدة البيانات
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: status === 'paid' ? 'paid' : 'failed',
        payment_method: paymentData.source?.type || null,
        card_brand: paymentData.source?.company || null,
        card_last_four: paymentData.source?.number?.slice(-4) || null,
        metadata: paymentData,
        updated_at: new Date().toISOString()
      })
      .eq('moyasar_payment_id', paymentId)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update payment' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // إذا كان الدفع ناجح، تحديث اشتراك المستخدم
    if (status === 'paid' && metadata.user_id && metadata.plan_id) {
      const userId = metadata.user_id
      const planId = metadata.plan_id
      const durationDays = metadata.duration_days || 30

      // جلب الاشتراك الحالي للمستخدم
      const { data: currentUser } = await supabase
        .from('users')
        .select('subscription_end, subscription_status')
        .eq('id', userId)
        .single()

      // حساب تاريخ الانتهاء (مع التمديد إذا كان هناك اشتراك نشط)
      let startDate = new Date()
      
      if (currentUser?.subscription_end && currentUser?.subscription_status === 'active') {
        const currentEndDate = new Date(currentUser.subscription_end)
        // إذا كان الاشتراك الحالي لم ينتهي، نبدأ من تاريخ انتهائه
        if (currentEndDate > startDate) {
          startDate = currentEndDate
          console.log(`Extending subscription from: ${currentEndDate.toISOString()}`)
        }
      }

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + durationDays)

      console.log(`New subscription end date: ${endDate.toISOString()}`)

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
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Subscription updated for user ${userId} - New tier: ${tier}, End date: ${endDate.toISOString().split('T')[0]}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
