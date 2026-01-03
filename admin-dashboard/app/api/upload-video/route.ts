import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 بدء رفع الفيديو...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const provider = process.env.NEXT_PUBLIC_VIDEO_PROVIDER || 'bunny';
    
    console.log('📁 الملف:', file?.name, file?.size, 'bytes');
    console.log('🎬 المزود:', provider);
    
    if (!file) {
      console.error('❌ لا يوجد ملف');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // استخدام Bunny.net
    if (provider === 'bunny') {
      const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
      const apiKey = process.env.NEXT_PUBLIC_BUNNY_API_KEY;
      const cdnHostname = process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME;

      console.log('🐰 استخدام Bunny.net...');

      if (!libraryId || !apiKey || !cdnHostname) {
        console.error('❌ بيانات Bunny.net مفقودة');
        return NextResponse.json(
          { success: false, error: 'Bunny.net credentials not configured' },
          { status: 500 }
        );
      }

      // 1. إنشاء فيديو جديد
      console.log('🔗 إنشاء فيديو في Bunny.net...');
      const createResponse = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        {
          method: 'POST',
          headers: {
            'AccessKey': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: file.name,
          }),
        }
      );

      console.log('📡 استجابة الإنشاء:', createResponse.status);

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('❌ فشل الإنشاء:', errorText);
        return NextResponse.json(
          { success: false, error: `Failed to create video: ${errorText}` },
          { status: 500 }
        );
      }

      const createData = await createResponse.json();
      const videoId = createData.guid;
      
      console.log('✅ تم إنشاء الفيديو:', videoId);

      // 2. رفع الفيديو
      console.log('⬆️ رفع الفيديو إلى Bunny.net...');
      const uploadResponse = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
        {
          method: 'PUT',
          headers: {
            'AccessKey': apiKey,
          },
          body: file,
        }
      );

      console.log('📡 استجابة الرفع:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ فشل الرفع:', errorText);
        return NextResponse.json(
          { success: false, error: `Failed to upload: ${uploadResponse.status}` },
          { status: 500 }
        );
      }

      // 3. انتظار معالجة الفيديو
      console.log('⏳ انتظار معالجة الفيديو...');
      let videoReady = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 ثانية

      while (!videoReady && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // انتظار ثانية
        
        const statusResponse = await fetch(
          `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
          {
            headers: {
              'AccessKey': apiKey,
            },
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const status = statusData.status;
          
          console.log(`📊 حالة الفيديو: ${status} (محاولة ${attempts + 1}/${maxAttempts})`);
          
          // 4 = Ready, 3 = Processing
          if (status === 4) {
            videoReady = true;
          } else if (status === 5 || status === 6) {
            // 5 = Error, 6 = Failed
            console.error('❌ فشلت معالجة الفيديو');
            return NextResponse.json(
              { success: false, error: 'Video processing failed' },
              { status: 500 }
            );
          }
        }
        
        attempts++;
      }

      if (!videoReady) {
        console.log('⚠️ الفيديو لا يزال قيد المعالجة - سيكون جاهزاً قريباً');
      }

      // استخدام HLS playlist URL للتشغيل في React Native
      const playbackUrl = `https://vz-cc18e31a-a3b.b-cdn.net/${videoId}/playlist.m3u8`;

      console.log('✅ تم الرفع بنجاح!', videoId);

      return NextResponse.json({
        success: true,
        videoId,
        playbackUrl,
        status: videoReady ? 'ready' : 'processing',
      });
    }

    // استخدام Cloudflare (للاختبار لاحقاً)
    else {
      const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN;

      console.log('☁️ استخدام Cloudflare Stream...');

      if (!accountId || !apiToken) {
        console.error('❌ بيانات Cloudflare مفقودة');
        return NextResponse.json(
          { success: false, error: 'Cloudflare credentials not configured' },
          { status: 500 }
        );
      }

      // كود Cloudflare الموجود...
      return NextResponse.json(
        { success: false, error: 'Cloudflare Stream قيد الاختبار - استخدم Bunny.net حالياً' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ خطأ عام:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
