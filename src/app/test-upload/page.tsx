'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';

export default function ImageUploadTest() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [s3Keys, setS3Keys] = useState<string[]>([]);

  const handleCreateProduct = () => {
    
    alert(`Product ready to create with ${s3Keys.length} images!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Image Upload Test
          </h1>
          
          <ImageUploader
            onImagesChange={setImageUrls}
            onS3KeysChange={setS3Keys}
            maxImages={5}
          />
          
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">Current State:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Image URLs ({imageUrls.length}):</strong>
                <ul className="list-disc list-inside ml-4 text-xs">
                  {imageUrls.map((url, index) => (
                    <li key={index} className="break-all">{url}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <strong>S3 Keys ({s3Keys.length}):</strong>
                <ul className="list-disc list-inside ml-4 text-xs">
                  {s3Keys.map((key, index) => (
                    <li key={index} className="break-all">{key}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCreateProduct}
              disabled={s3Keys.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Tạo sản phẩm với {s3Keys.length} ảnh
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              🎯 Workflow Test:
            </h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>Chọn ảnh từ máy tính</li>
              <li>Ảnh được upload qua presigned URL lên S3</li>
              <li>S3 key được lưu để truyền vào API tạo sản phẩm</li>
              <li>Backend sẽ dùng S3 key để tạo product record</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}