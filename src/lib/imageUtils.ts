/**
 * Utility functions for image processing and WebP conversion
 */

export interface ImageProcessingOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export interface ImageProcessingResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Convert image file to WebP format with optional resizing
 */
export const convertToWebP = (
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<ImageProcessingResult> => {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1920,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not supported'));
      return;
    }
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const originalSize = file.size;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }
        
        // Set canvas dimensions
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        
        // Enable image smoothing for better quality when resizing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw resized image on canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to specified format
        const mimeType = `image/${format}`;
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image'));
              return;
            }
            
            // Create new file with proper extension
            const originalName = file.name.split('.')[0];
            const timestamp = Date.now();
            const extension = format === 'jpeg' ? 'jpg' : format;
            const convertedFile = new File([blob], `${originalName}_${timestamp}.${extension}`, {
              type: mimeType,
              lastModified: Date.now()
            });
            
            const compressedSize = convertedFile.size;
            const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
            
            resolve({
              file: convertedFile,
              originalSize,
              compressedSize,
              compressionRatio
            });
          },
          mimeType,
          quality
        );
        
        // Clean up object URL
        URL.revokeObjectURL(img.src);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Process multiple images concurrently
 */
export const processImages = async (
  files: File[], 
  options: ImageProcessingOptions = {},
  onProgress?: (processed: number, total: number) => void
): Promise<ImageProcessingResult[]> => {
  const results: ImageProcessingResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Skip non-image files
    if (!file.type.startsWith('image/')) {
      continue;
    }
    
    try {
      const result = await convertToWebP(file, options);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
      
    
    } catch (error) {
      
      // Create fallback result with original file
      results.push({
        file: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0
      });
    }
  }
  
  return results;
};

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Get image dimensions from file
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};