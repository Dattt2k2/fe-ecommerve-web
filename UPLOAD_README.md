# Upload Configuration

Ứng dụng hỗ trợ hai phương pháp upload ảnh:

## 1. Upload lên AWS S3 (Khuyến nghị cho production)

### Cấu hình Environment Variables:

Thêm vào file `.env.local`:

```env
# AWS S3 Configuration
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Cài đặt AWS SDK:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Cập nhật API Route:

Uncomment phần code thực trong `/src/app/api/upload/presigned-url/route.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

const command = new PutObjectCommand({
  Bucket: bucketName,
  Key: uniqueFileName,
  ContentType: fileType,
});

const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
```

### Cấu hình S3 Bucket:

1. Tạo bucket trên AWS S3
2. Cấu hình CORS policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

3. Cấu hình IAM user với quyền:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`

## 2. Upload lên Server Local (Fallback)

Phương pháp này tự động được sử dụng khi S3 không khả dụng.

Ảnh được lưu trong thư mục `/public/uploads/products/`

### Lưu ý:
- Không phù hợp cho production với nhiều server
- Cần backup thường xuyên thư mục uploads
- Giới hạn dung lượng storage

## Sử dụng trong Component

```typescript
import { uploadAPI } from '@/lib/api';

// Upload với presigned URL
const { uploadUrl, fileUrl } = await uploadAPI.getPresignedUrl(fileName, fileType);

// Hoặc upload trực tiếp
const formData = new FormData();
formData.append('files', file);
const { fileUrl } = await uploadAPI.uploadFile(formData);
```

## Features của Inventory Management

✅ **CRUD Operations**: Thêm, sửa, xóa sản phẩm
✅ **Image Upload**: Upload nhiều ảnh với presigned URL
✅ **Search & Filter**: Tìm kiếm theo tên, mô tả, SKU
✅ **Category Filter**: Lọc theo danh mục
✅ **Status Management**: Quản lý trạng thái sản phẩm
✅ **Sorting**: Sắp xếp theo tên, giá, số lượng
✅ **Responsive Design**: Tương thích mobile
✅ **Real-time Updates**: Cập nhật danh sách ngay lập tức
✅ **Error Handling**: Xử lý lỗi và fallback
✅ **Loading States**: Hiển thị trạng thái loading
✅ **Form Validation**: Validate input fields

## API Endpoints Cần Thiết

- `GET /api/seller/products/user` - Lấy danh sách sản phẩm
- `POST /api/seller/products` - Tạo sản phẩm mới
- `PUT /api/seller/products/:id` - Cập nhật sản phẩm
- `DELETE /api/seller/products/:id` - Xóa sản phẩm
- `POST /api/upload/presigned-url` - Lấy presigned URL
- `POST /api/upload/file` - Upload file trực tiếp