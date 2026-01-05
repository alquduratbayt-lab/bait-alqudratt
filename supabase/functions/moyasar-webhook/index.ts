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

    const { type, data } = payload

    // قبول جميع أنواع events المتعلقة بالدفع
    if (!type || !data) {
      console.log('Invalid payload:', payload)
      return new Response(
        JSON.stringify({ message: 'Invalid payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Event type:', type)
    console.log('Payment data:', JSON.stringify(data))

    const paymentId = data.id
    const status = data.status
    const metadata = data.metadata || {}

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
        payment_method: data.source?.type || null,
        card_brand: data.source?.company || null,
        card_last_four: data.source?.number?.slice(-4) || null,
        metadata: data,
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
