// وظيفة إرسال Push Notifications عبر Expo Push Notification Service

interface PushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data?: any;
}

export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: any
): Promise<{ success: number; failed: number }> {
  const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
  
  console.log('📤 Starting to send push notifications...');
  console.log('📊 Total tokens received:', tokens.length);
  
  // تصفية الـ tokens الصحيحة فقط
  const validTokens = tokens.filter(token => 
    token && typeof token === 'string' && token.startsWith('ExponentPushToken')
  );

  console.log('✅ Valid tokens:', validTokens.length);
  console.log('🔑 Tokens:', validTokens);

  if (validTokens.length === 0) {
    console.log('❌ No valid push tokens found');
    return { success: 0, failed: 0 };
  }

  // إنشاء رسائل Push
  const messages: PushMessage[] = validTokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  }));

  console.log('📨 Messages to send:', JSON.stringify(messages, null, 2));

  let successCount = 0;
  let failedCount = 0;

  try {
    // إرسال الإشعارات على دفعات (100 إشعار لكل طلب)
    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      console.log(`🚀 Sending batch ${i / batchSize + 1}...`);
      
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        failedCount += batch.length;
        continue;
      }

      const result = await response.json();
      console.log('📥 Response data:', JSON.stringify(result, null, 2));
      
      if (result.data) {
        result.data.forEach((item: any) => {
          if (item.status === 'ok') {
            successCount++;
            console.log('✅ Notification sent successfully');
          } else {
            failedCount++;
            console.error('❌ Push notification error:', item);
          }
        });
      } else {
        console.error('❌ No data in response:', result);
        failedCount += batch.length;
      }
    }

    console.log(`✅ Push notifications sent: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('❌ Error sending push notifications:', error);
    return { success: 0, failed: validTokens.length };
  }
}

// وظيفة لإرسال إشعار لمستخدم واحد
export async function sendSinglePushNotification(
  token: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  if (!token || !token.startsWith('ExponentPushToken')) {
    console.error('Invalid push token:', token);
    return false;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
      }),
    });

    const result = await response.json();
    
    if (result.data && result.data[0]?.status === 'ok') {
      return true;
    } else {
      console.error('Push notification failed:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}
