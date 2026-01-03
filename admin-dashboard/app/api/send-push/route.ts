import { NextRequest, NextResponse } from 'next/server';

interface PushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data?: any;
}

export async function POST(request: NextRequest) {
  try {
    const { tokens, title, body, data } = await request.json();

    console.log('📤 API: Starting to send push notifications...');
    console.log('📊 API: Total tokens received:', tokens?.length || 0);

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { error: 'No tokens provided', success: 0, failed: 0 },
        { status: 400 }
      );
    }

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required', success: 0, failed: 0 },
        { status: 400 }
      );
    }

    const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    // تصفية الـ tokens الصحيحة فقط
    const validTokens = tokens.filter(
      (token: string) => token && typeof token === 'string' && token.startsWith('ExponentPushToken')
    );

    console.log('✅ API: Valid tokens:', validTokens.length);

    if (validTokens.length === 0) {
      return NextResponse.json({
        success: 0,
        failed: 0,
        message: 'No valid push tokens found',
      });
    }

    // إنشاء رسائل Push
    const messages: PushMessage[] = validTokens.map((token: string) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
    }));

    console.log('📨 API: Messages to send:', messages.length);

    let successCount = 0;
    let failedCount = 0;

    // إرسال الإشعارات على دفعات (100 إشعار لكل طلب)
    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      console.log(`🚀 API: Sending batch ${Math.floor(i / batchSize) + 1}...`);

      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      console.log('📡 API: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API: HTTP Error:', response.status, errorText);
        failedCount += batch.length;
        continue;
      }

      const result = await response.json();
      console.log('📥 API: Response data:', result);

      if (result.data) {
        result.data.forEach((item: any, index: number) => {
          if (item.status === 'ok') {
            successCount++;
            console.log('✅ API: Notification sent successfully to:', batch[index].to);
          } else {
            failedCount++;
            console.error('❌ API: Push notification error for token:', batch[index].to);
            console.error('Error details:', item.message || item.details || 'Unknown error');
            
            // تسجيل أنواع الأخطاء الشائعة
            if (item.details?.error === 'DeviceNotRegistered') {
              console.warn('⚠️ Token is no longer valid (device unregistered)');
            }
          }
        });
      } else {
        console.error('❌ API: No data in response:', result);
        failedCount += batch.length;
      }
    }

    console.log(`✅ API: Push notifications sent: ${successCount} success, ${failedCount} failed`);

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      message: `Sent ${successCount} notifications successfully, ${failedCount} failed`,
    });
  } catch (error: any) {
    console.error('❌ API: Error sending push notifications:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        success: 0,
        failed: 0,
      },
      { status: 500 }
    );
  }
}
