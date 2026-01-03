// Bunny.net Stream Integration

interface BunnyUploadResponse {
  success: boolean;
  videoId?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export const uploadToBunnyStream = async (
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<BunnyUploadResponse> => {
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
  const apiKey = process.env.NEXT_PUBLIC_BUNNY_API_KEY;
  const cdnHostname = process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME;

  if (!libraryId || !apiKey || !cdnHostname) {
    return {
      success: false,
      error: 'Bunny.net credentials not configured',
    };
  }

  try {
    // 1. إنشاء فيديو جديد
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: videoFile.name,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      return {
        success: false,
        error: `Failed to create video: ${errorText}`,
      };
    }

    const createData = await createResponse.json();
    const videoId = createData.guid;

    // 2. رفع الفيديو
    const uploadResponse = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': apiKey,
        },
        body: videoFile,
      }
    );

    if (!uploadResponse.ok) {
      return {
        success: false,
        error: `Failed to upload video: ${uploadResponse.status}`,
      };
    }

    // 3. إرجاع معلومات الفيديو
    const playbackUrl = `https://${cdnHostname}/${videoId}/playlist.m3u8`;
    const thumbnailUrl = `https://${cdnHostname}/${videoId}/thumbnail.jpg`;

    return {
      success: true,
      videoId,
      playbackUrl,
      thumbnailUrl,
    };
  } catch (error: any) {
    console.error('Error uploading to Bunny.net:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
};
