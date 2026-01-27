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

    // جلب معلومات الدفع من ميسر - نجرب invoices أولاً ثم payments
    console.log('🔍 جلب بيانات الدفع من Moyasar للـ ID:', paymentId)
    
    let moyasarResponse = await fetch(`https://api.moyasar.com/v1/invoices/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(moyasarSecretKey + ':')}`
      }
    })

    // إذا لم نجد invoice، نجرب payments
    if (!moyasarResponse.ok) {
      console.log('لم نجد invoice، نجرب payments...')
      moyasarResponse = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(moyasarSecretKey + ':')}`
        }
      })
    }

    if (!moyasarResponse.ok) {
      console.error('Payment not found in Moyasar')
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentData = await moyasarResponse.json()
    console.log('Payment data from Moyasar:', JSON.stringify(paymentData))

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
    let userId = metadata.user_id
    let planId = metadata.plan_id
    let durationDays = parseInt(metadata.duration_days) || 30

    console.log('📋 Metadata from Moyasar:', JSON.stringify(metadata))
    console.log('👤 User ID from metadata:', userId)
    console.log('📦 Plan ID from metadata:', planId)

    // إذا لم نجد user_id أو plan_id في metadata، نجلبها من جدول payments
    if (!userId || !planId) {
      console.log('⚠️ Metadata فارغة، نجلب البيانات من جدول payments...')
      
      // نحاول البحث بالـ moyasar_payment_id أولاً
      let { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .select('user_id, plan_id, moyasar_payment_id')
        .eq('moyasar_payment_id', paymentId)
        .single()
      
      // إذا لم نجد، نحاول البحث في metadata
      if (paymentError || !paymentRecord) {
        console.log('🔍 لم نجد بالـ moyasar_payment_id، نبحث في metadata...')
        
        const { data: payments } = await supabase
          .from('payments')
          .select('user_id, plan_id, moyasar_payment_id, metadata')
          .order('created_at', { ascending: false })
          .limit(20)
        
        // نبحث عن الدفعة التي تحتوي على الـ paymentId في الـ metadata
        if (payments) {
          for (const p of payments) {
            const meta = p.metadata as any
            if (meta?.id === paymentId || meta?.payments?.[0]?.id === paymentId) {
              paymentRecord = p
              console.log('✅ وجدنا الدفعة في metadata:', p.moyasar_payment_id)
              break
            }
          }
        }
      }
      
      if (!paymentRecord) {
        console.error('❌ لم نجد الدفعة في قاعدة البيانات')
        return new Response(
          JSON.stringify({ error: 'Payment record not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      userId = paymentRecord.user_id
      planId = paymentRecord.plan_id
      console.log('👤 User ID from payments table:', userId)
      console.log('📦 Plan ID from payments table:', planId)
    }

    if (!userId || !planId) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or plan_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // جلب duration_days من جدول subscription_plans
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('duration_days, name')
      .eq('id', planId)
      .single()
    
    if (planData?.duration_days) {
      durationDays = planData.duration_days
      console.log('📅 Duration Days from plan:', durationDays)
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

    // جلب معلومات الباقة لتحديد tier
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name, price')
      .eq('id', planId)
      .single()

    console.log('📦 Plan data:', JSON.stringify(plan))

    // تحديد tier بناءً على اسم الباقة أو السعر
    let tier = 'basic'
    if (plan?.name) {
      const planName = plan.name.toLowerCase()
      if (planName.includes('مميز') || planName.includes('premium') || 
          planName.includes('بريميوم') || planName.includes('متقدم') ||
          planName.includes('متقدمة')) {
        tier = 'premium'
      }
      // إذا كان السعر أعلى من 150، نعتبرها premium
      if (plan.price && plan.price > 150) {
        tier = 'premium'
      }
    }
    
    console.log('🏷️ Determined tier:', tier)

    // جلب بيانات المستخدم الحالية للتحقق من الاشتراك الحالي
    const { data: currentUser } = await supabase
      .from('users')
      .select('subscription_end, subscription_status')
      .eq('id', userId)
      .single()

    // حساب تاريخ الانتهاء الجديد
    const today = new Date()
    let endDate = new Date(today)
    
    // إذا كان لديه اشتراك نشط، نضيف الأيام على تاريخ الانتهاء الحالي
    if (currentUser?.subscription_end && currentUser?.subscription_status === 'active') {
      const currentEndDate = new Date(currentUser.subscription_end)
      if (currentEndDate > today) {
        // الاشتراك لا يزال نشطاً - نضيف الأيام على تاريخ الانتهاء الحالي
        endDate = new Date(currentEndDate)
        console.log(`📅 ترقية اشتراك: إضافة ${durationDays} يوم على تاريخ الانتهاء الحالي ${currentEndDate.toISOString().split('T')[0]}`)
      }
    }
    endDate.setDate(endDate.getDate() + durationDays)
    
    console.log(`📅 تاريخ الانتهاء الجديد: ${endDate.toISOString().split('T')[0]}`)

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
