// Bunny.net Stream Integration with TUS Direct Upload
// التكامل مع Bunny.net لرفع الفيديوهات مباشرة من المتصفح

import * as tus from 'tus-js-client';

interface UploadResponse {
  success: boolean;
  videoId?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

interface UploadCallbacks {
  onProgress?: (progress: number) => void;
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: string) => void;
}

/**
 * رفع فيديو مباشرة إلى Bunny.net باستخدام TUS
 * @param videoFile - ملف الفيديو
 * @param callbacks - دوال callback للتقدم والنجاح والخطأ
 * @returns معلومات الفيديو المرفوع
 */
export const uploadToCloudflareStream = async (
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
  try {
    // 1. إنشاء الفيديو والحصول على بيانات TUS من السيرفر
    const createResponse = await fetch('/api/upload-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: videoFile.name,
        fileSize: videoFile.size,
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      return {
        success: false,
        error: errorData.error || `خطأ في إنشاء الفيديو: ${createResponse.status}`,
      };
    }

    const createData = await createResponse.json();
    
    if (!createData.success) {
      return {
        success: false,
        error: createData.error || 'فشل في إنشاء الفيديو',
      };
    }

    const { videoId, playbackUrl, thumbnailUrl, tusUpload } = createData;

    // 2. رفع الفيديو مباشرة إلى Bunny.net باستخدام TUS
    return new Promise<UploadResponse>((resolve) => {
      const upload = new tus.Upload(videoFile, {
        endpoint: tusUpload.endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: tusUpload.headers,
        metadata: {
          filename: videoFile.name,
          filetype: videoFile.type,
        },
        onError: (error) => {
          console.error('TUS upload error:', error);
          resolve({
            success: false,
            error: `خطأ في رفع الفيديو: ${error.message}`,
          });
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          if (onProgress) {
            onProgress(percentage);
          }
        },
        onSuccess: () => {
          resolve({
            success: true,
            videoId,
            playbackUrl,
            thumbnailUrl,
          });
        },
      });

      // بدء الرفع
      upload.start();
    });
  } catch (error: any) {
    console.error('Error uploading video:', error);
    return {
      success: false,
      error: error.message || 'حدث خطأ غير متوقع',
    };
  }
};

/**
 * الحصول على معلومات فيديو من Cloudflare Stream
 * @param videoId - معرف الفيديو
 * @returns معلومات الفيديو
 */
export const getVideoInfo = async (videoId: string) => {
  const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare credentials not configured');
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get video info');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error getting video info:', error);
    throw error;
  }
};

/**
 * حذف فيديو من Cloudflare Stream
 * @param videoId - معرف الفيديو
 * @returns نجاح أو فشل العملية
 */
export const deleteVideo = async (videoId: string): Promise<boolean> => {
  const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return false;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
};
