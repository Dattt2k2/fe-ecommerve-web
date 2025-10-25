import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { files }: { files: Array<{ fileName: string; fileType: string; fileSize: number }> } = await request.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Files array is required' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Too many files. Maximum 10 files per batch' }, { status: 400 });
    }

    // Validate each file
    for (const file of files) {
      if (!file.fileName || !file.fileType || !file.fileSize) {
        return NextResponse.json({ error: 'Each file must have fileName, fileType, and fileSize' }, { status: 400 });
      }

      if (!file.fileType.startsWith('image/')) {
        return NextResponse.json({ error: `Invalid file type: ${file.fileType}. Only images allowed.` }, { status: 400 });
      }

      if (file.fileSize > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.fileName} is too large. Maximum 10MB allowed.` }, { status: 400 });
      }
    }

    // Generate presigned URLs for all files
    const presignedUrls = files.map((file) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `products/${timestamp}-${randomString}.${fileExtension}`;
      
      // For now, return a working S3 URL structure
      // In production, replace with real AWS S3 presigned URL generation
      const realS3UploadUrl = `https://go-ecom1.s3.ap-southeast-1.amazonaws.com/${uniqueFileName}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAYC5CLPN3476QMV6F%2F20251021%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20251021T000000Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=mock-signature-${randomString}`;
      const realFileUrl = `https://go-ecom1.s3.ap-southeast-1.amazonaws.com/${uniqueFileName}`;
      
      return {
        originalFileName: file.fileName,
        uploadUrl: realS3UploadUrl,
        fileUrl: realFileUrl,
        key: uniqueFileName
      };
    });

    return NextResponse.json({
      success: true,
      presignedUrls,
      count: files.length
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to generate presigned URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}