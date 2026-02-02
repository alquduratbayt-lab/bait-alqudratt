import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST: إنشاء فيديو جديد والحصول على بيانات TUS للرفع المباشر
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileSize } = body;

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'fileName is required' },
        { status: 400 }
      );
    }

    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    const apiKey = process.env.NEXT_PUBLIC_BUNNY_API_KEY;
    const cdnHostname = process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME;

    if (!libraryId || !apiKey || !cdnHostname) {
      return NextResponse.json(
        { success: false, error: 'Bunny.net credentials not configured' },
        { status: 500 }
      );
    }

    // 1. إنشاء فيديو جديد في Bunny.net
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: fileName,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Bunny create video error:', errorText);
      return NextResponse.json(
        { success: false, error: `Failed to create video: ${createResponse.status}` },
        { status: createResponse.status }
      );
    }

    const createData = await createResponse.json();
    const videoId = createData.guid;

    // 2. إنشاء توقيع TUS للرفع المباشر
    const expirationTime = Math.floor(Date.now() / 1000) + 3600; // صالح لمدة ساعة
    const signatureString = `${libraryId}${apiKey}${expirationTime}${videoId}`;
    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

    // 3. إرجاع بيانات الرفع
    const playbackUrl = `https://${cdnHostname}/${videoId}/playlist.m3u8`;
    const thumbnailUrl = `https://${cdnHostname}/${videoId}/thumbnail.jpg`;

    return NextResponse.json({
      success: true,
      videoId,
      playbackUrl,
      thumbnailUrl,
      tusUpload: {
        endpoint: `https://video.bunnycdn.com/tusupload`,
        headers: {
          'AuthorizationSignature': signature,
          'AuthorizationExpire': expirationTime.toString(),
          'VideoId': videoId,
          'LibraryId': libraryId,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
