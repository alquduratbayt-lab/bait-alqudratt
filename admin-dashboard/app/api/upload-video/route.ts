import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for large videos

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // @ts-ignore - FormData.get() is supported in Next.js runtime
    const fileEntry = formData.get('file') as FormDataEntryValue | null;
    const file = fileEntry instanceof File ? fileEntry : null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
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
          title: file.name,
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

    // 2. رفع الفيديو إلى Bunny.net
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

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Bunny upload error:', errorText);
      return NextResponse.json(
        { success: false, error: `Failed to upload video: ${uploadResponse.status}` },
        { status: uploadResponse.status }
      );
    }

    // 3. إرجاع معلومات الفيديو
    const playbackUrl = `https://${cdnHostname}/${videoId}/playlist.m3u8`;
    const thumbnailUrl = `https://${cdnHostname}/${videoId}/thumbnail.jpg`;

    return NextResponse.json({
      success: true,
      videoId,
      playbackUrl,
      thumbnailUrl,
    });
  } catch (error: any) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
