import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const today = new Date()
    
    // جلب المشتركين النشطين
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, subscription_end, push_token')
      .eq('subscription_status', 'active')
      .not('subscription_end', 'is', null)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(JSON.stringify({ error: usersError.message }), { status: 500 })
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No active subscriptions found', notificationsSent: 0 }), { 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    let notificationsSent = 0

    for (const user of users) {
      const endDate = new Date(user.subscription_end)
      const diffTime = endDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let shouldNotify = false
      let title = ''
      let message = ''

      if (diffDays === 1) {
        shouldNotify = true
        title = '⚠️ تنبيه: اشتراكك ينتهي غداً'
        message = 'اشتراكك سينتهي غداً. جدد اشتراكك الآن للاستمرار في الوصول لجميع المميزات'
      } else if (diffDays === 3) {
        shouldNotify = true
        title = '⏰ تذكير: اشتراكك ينتهي خلال 3 أيام'
        message = 'اشتراكك سينتهي خلال 3 أيام. لا تفوت فرصة التجديد'
      } else if (diffDays === 7) {
        shouldNotify = true
        title = '📅 تذكير: اشتراكك ينتهي خلال أسبوع'
        message = 'اشتراكك سينتهي خلال أسبوع. جدد الآن لضمان استمرارية الخدمة'
      } else if (diffDays <= 0) {
        shouldNotify = true
        title = '❌ انتهى اشتراكك'
        message = 'انتهى اشتراكك. جدد الآن للعودة إلى التعلم'
      }

      if (shouldNotify) {
        // حفظ الإشعار
        const { error: notifError } = await supabase
          .from('student_notifications')
          .insert({
            student_id: user.id,
            type: 'subscription_expiring',
            title,
            message,
            is_read: false
          })

        if (notifError) {
          console.error('Error saving notification:', notifError)
          continue
        }

        // إرسال Push Notification
        if (user.push_token && user.push_token.startsWith('ExponentPushToken')) {
          try {
            const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                to: user.push_token,
                title,
                body: message,
                sound: 'default',
                data: {
                  type: 'subscription_expiring',
                  daysRemaining: diffDays
                }
              })
            })

            if (pushResponse.ok) {
              console.log(`Push notification sent to ${user.name}`)
            }
          } catch (pushError) {
            console.error('Error sending push notification:', pushError)
          }
        }

        notificationsSent++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent,
        totalUsers: users.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
