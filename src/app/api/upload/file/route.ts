import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    const uploadedFiles: string[] = [];
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await mkdir(uploadsDir, { recursive: true });
    
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue; // Skip non-image files
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExtension = file.name.split('.').pop() || '';
      const uniqueFileName = `${timestamp}-${randomString}.${fileExtension}`;
      
      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filePath = path.join(uploadsDir, uniqueFileName);
      await writeFile(filePath, buffer);
      
      // Return relative URL path
      const fileUrl = `/uploads/products/${uniqueFileName}`;
      uploadedFiles.push(fileUrl);
    }
    
    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid image files were uploaded' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      fileUrl: uploadedFiles[0], // For single file compatibility
      fileName: uploadedFiles[0]?.split('/').pop()
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}