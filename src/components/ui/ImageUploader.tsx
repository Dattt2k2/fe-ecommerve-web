'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { uploadAPI, apiClient, API_ENDPOINTS } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface ImageUploaderProps {
  onImagesChange?: (imageUrls: string[]) => void;
  onS3KeysChange?: (s3Keys: string[]) => void;
  maxImages?: number;
  currentImages?: string[];
}

export default function ImageUploader({ 
  onImagesChange, 
  onS3KeysChange,
  maxImages = 5, 
  currentImages = [] 
}: ImageUploaderProps) {
  const { showError, showSuccess, showWarning } = useToast();
  const [images, setImages] = useState<string[]>(currentImages);
  const [s3Keys, setS3Keys] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    
    if (files.length === 0) return;
    
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        showWarning('Chỉ chấp nhận file ảnh');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        showWarning('Kích thước ảnh không được vượt quá 10MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    if (images.length + validFiles.length > maxImages) {
      showWarning(`Chỉ được tải lên tối đa ${maxImages} ảnh`);
      return;
    }

    setUploading(true);
    
    try {
     
      // Step 1: Send array format to BACKEND API (not mock)
      const filesRequest = validFiles.map(file => ({
        fileName: file.name,
        fileType: file.type
      }));
      
      

      const requestBody = JSON.stringify(filesRequest);

      // Use centralized apiClient to get presigned URLs via the Next.js proxy
      const data = await apiClient.post<any>(API_ENDPOINTS.UPLOAD.PRESIGNED_URL, filesRequest);

      // Normalize response
      
      // Backend returns { data: [...], success: true, total: N }
      const presignedData = data.data || data.results || [];
      
      // Step 2: Upload all files to S3 in parallel
      const uploadPromises = validFiles.map(async (file, index) => {
        const item = presignedData[index];
        
        
        const uploadResponse = await fetch(item.presigned_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
            'x-amz-acl': '' // Backend signed with empty x-amz-acl
          },
        });
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          showError(`Upload thất bại cho ${file.name}`);
          throw new Error(`Upload failed for ${file.name}: ${uploadResponse.status}`);
        }
        
        // Construct public URL
        const publicUrl = `https://go-ecom1.s3.ap-southeast-1.amazonaws.com/${item.s3_key}`;
        
        return {
          imageUrl: publicUrl,
          s3Key: item.s3_key,
          fileName: file.name
        };
      });

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      
      const newImageUrls = uploadResults.map(result => result.imageUrl);
      const newS3Keys = uploadResults.map(result => result.s3Key);

      const updatedImages = [...images, ...newImageUrls];
      const updatedS3Keys = [...s3Keys, ...newS3Keys];
      
      setImages(updatedImages);
      setS3Keys(updatedS3Keys);
      
      // Notify parent components
      onImagesChange?.(updatedImages);
      onS3KeysChange?.(updatedS3Keys);
      
      showSuccess(`Đã tải lên thành công ${uploadResults.length} ảnh`);
      
    } catch (error: any) {
      showError(error.message || 'Lỗi upload ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedS3Keys = s3Keys.filter((_, i) => i !== index);
    
    setImages(updatedImages);
    setS3Keys(updatedS3Keys);
    
    onImagesChange?.(updatedImages);
    onS3KeysChange?.(updatedS3Keys);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Ảnh sản phẩm ({images.length}/{maxImages})
      </h3>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          disabled={uploading || images.length >= maxImages}
        />
        
        <div className="space-y-2">
          <Upload className={`mx-auto h-12 w-12 ${uploading ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {uploading ? (
              <p className="text-blue-600 font-medium">Đang upload...</p>
            ) : (
              <div>
                <p className="font-medium">Kéo thả ảnh vào đây hoặc nhấn để chọn</p>
                <p>PNG, JPG, GIF tối đa 10MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={imageUrl}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* S3 Key indicator */}
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Key: {s3Keys[index]?.split('/').pop() || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Debug Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
        <div><strong>Images:</strong> {images.length}</div>
        <div><strong>S3 Keys:</strong> {s3Keys.length}</div>
        {s3Keys.length > 0 && (
          <div><strong>Latest Key:</strong> {s3Keys[s3Keys.length - 1]}</div>
        )}
      </div>
    </div>
  );
}