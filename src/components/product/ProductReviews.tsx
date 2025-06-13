'use client';

import { useState } from 'react';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';
import { Review } from '@/types';

interface ProductReviewsProps {
  productId: string;
}

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: '1',
    productId: '1',
    userId: '1',
    userName: 'Nguyễn Văn A',
    rating: 5,
    comment: 'Sản phẩm rất tuyệt vời, chất lượng tốt, giao hàng nhanh. Rất hài lòng với mua hàng này!',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    productId: '1',
    userId: '2',
    userName: 'Trần Thị B',
    rating: 4,
    comment: 'Sản phẩm ổn, đúng như mô tả. Giá cả hợp lý. Sẽ mua lại lần sau.',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    productId: '1',
    userId: '3',
    userName: 'Lê Văn C',
    rating: 5,
    comment: 'Chất lượng tuyệt vời, đáng tiền. Dịch vụ khách hàng rất tốt.',
    createdAt: new Date('2024-01-05'),
  },
];

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'write'>('reviews');
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
  });

  const reviews = mockReviews.filter(review => review.productId === productId);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the review to your API
    console.log('Submitting review:', newReview);
    // Reset form
    setNewReview({ rating: 5, comment: '' });
    setActiveTab('reviews');
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(rating => 
    reviews.filter(review => review.rating === rating).length
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Đánh giá sản phẩm
        </h2>
        
        {/* Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < averageRating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {reviews.length} đánh giá
            </p>
          </div>
          
          <div className="space-y-2">
            {ratingCounts.map((count, index) => {
              const rating = 5 - index;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-3">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Tất cả đánh giá ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('write')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'write'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Viết đánh giá
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'reviews' ? (
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Chưa có đánh giá nào cho sản phẩm này
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {review.userName.charAt(0)}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {review.userName}
                        </h4>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {review.comment}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <button className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          Hữu ích (0)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Đánh giá của bạn
              </label>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                      } hover:text-yellow-400 transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nhận xét
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                required
              />
            </div>
            
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Gửi đánh giá
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
