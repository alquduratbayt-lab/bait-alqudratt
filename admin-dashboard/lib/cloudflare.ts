// Cloudflare Stream Integration
// التكامل مع Cloudflare Stream لرفع وإدارة الفيديوهات

interface CloudflareConfig {
  accountId: string;
  apiToken: string;
}

interface UploadResponse {
  success: boolean;
  videoId?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * رفع فيديو إلى Cloudflare Stream
 * @param videoFile - ملف الفيديو
 * @param onProgress - دالة لتتبع تقدم الرفع (اختياري)
 * @returns معلومات الفيديو المرفوع
 */
export const uploadToCloudflareStream = async (
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
  try {
    // استخدام API route للرفع (لتجنب مشاكل CORS)
    return new Promise<UploadResponse>((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', videoFile);

      xhr.open('POST', '/api/upload-video', true);

      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            resolve({
              success: false,
              error: 'فشل في معالجة الاستجابة',
            });
          }
        } else {
          resolve({
            success: false,
            error: `خطأ في الرفع: ${xhr.status}`,
          });
        }
      };

      xhr.onerror = function() {
        resolve({
          success: false,
          error: 'فشل الاتصال بالسيرفر',
        });
      };

      if (onProgress) {
        xhr.upload.onprogress = function(e) {
          if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            onProgress(percent);
          }
        };
      }

      xhr.send(formData);
    });
  } catch (error: any) {
    console.error('Error uploading to Cloudflare Stream:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
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
