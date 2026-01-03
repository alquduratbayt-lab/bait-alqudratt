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

    console.log('Reminder function called')
    
    const body = await req.json()
    console.log('Request body:', body)
    
    const { userId } = body

    if (!userId) {
      console.error('Missing userId in request')
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching user:', userId)

    // جلب معلومات المستخدم
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, type, subscription_end, expo_push_token')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('User fetch error:', userError)
      return new Response(
        JSON.stringify({ error: 'User not found', details: userError.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user) {
      console.error('User not found:', userId)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User found:', user.name)

    const endDate = new Date(user.subscription_end)
    const today = new Date()
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    console.log('Days remaining:', daysRemaining)

    // إنشاء رسالة التذكير
    const title = '⏰ تذكير: اشتراكك على وشك الانتهاء'
    const messageBody = `مرحباً ${user.name}، اشتراكك سينتهي خلال ${daysRemaining} يوم. جدد اشتراكك الآن للاستمرار في الاستفادة من جميع المميزات!`

    console.log('Saving notification to database')

    // تحديد الجدول الصحيح حسب نوع المستخدم
    const notificationTable = user.type === 'student' ? 'student_notifications' : 'parent_notifications';
    const notificationData = user.type === 'student' 
      ? {
          student_id: userId,
          type: 'subscription_reminder',
          title: title,
          message: messageBody
        }
      : {
          parent_id: userId,
          student_id: userId,
          type: 'subscription_reminder',
          title: title,
          message: messageBody
        };

    // حفظ الإشعار في قاعدة البيانات
    const { error: notificationError } = await supabase
      .from(notificationTable)
      .insert(notificationData)

    if (notificationError) {
      console.error('Error saving notification:', notificationError)
    } else {
      console.log('Notification saved successfully')
      
      // تحديث وقت آخر إرسال تذكير
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_reminder_sent: new Date().toISOString() })
        .eq('id', userId)
      
      if (updateError) {
        console.error('Error updating last_reminder_sent:', updateError)
      } else {
        console.log('Updated last_reminder_sent timestamp')
      }
    }

    // إرسال Push Notification إذا كان لدى المستخدم token
    if (user.expo_push_token) {
      console.log('Sending push notification to:', user.expo_push_token)
      try {
        const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: user.expo_push_token,
            title: title,
            body: messageBody,
            data: {
              type: 'subscription_reminder',
              days_remaining: daysRemaining
            },
            sound: 'default',
            priority: 'high',
          })
        })

        const pushResult = await pushResponse.json()
        console.log('Push notification sent:', pushResult)
      } catch (pushError) {
        console.error('Error sending push notification:', pushError)
      }
    } else {
      console.log('No expo_push_token found for user')
    }

    console.log('Reminder sent successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Reminder sent successfully',
        notification_saved: !notificationError,
        push_sent: !!user.expo_push_token
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send reminder error:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
