'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle, AlertCircle } from 'lucide-react';
import { Review } from '@/types';
import { useRouter } from 'next/navigation';
import { reviewsAPI } from '@/lib/api';

interface ProductReviewsProps {
  productId: string;
}

interface ReviewData {
  id: string;
  product_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'reviews' | 'write'>('reviews');
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  });

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await reviewsAPI.getReviews(productId);
        setReviews(data.reviews || data.data || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        
        // Parse error to check for 401 - don't show error for unauthenticated users
        try {
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errorData = JSON.parse(errorMessage);
          
          if (errorData.status === 401) {
            // Not authenticated - just show empty reviews, no error
            setReviews([]);
            setError(null);
            return;
          }
        } catch {
          // Not a JSON error, continue with generic error
        }
        
        setError('Không thể tải đánh giá. Vui lòng thử lại sau.');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Check authentication
    if (!isAuthenticated) {
      setSubmitError('Bạn cần đăng nhập để đánh giá sản phẩm');
      return;
    }

    if (!newReview.comment.trim()) {
      setSubmitError('Vui lòng nhập nhận xét của bạn');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('auth_token');

      const data = await reviewsAPI.createReview(productId, {
        rating: newReview.rating,
        title: newReview.title || 'Đánh giá sản phẩm',
        body_review: newReview.comment,
      });

      // Success - add new review to list
      const newReviewData: ReviewData = {
        id: data.id || Date.now().toString(),
        product_id: productId,
        user_id: data.user_id || '',
        user_name: data.user_name || 'Bạn',
        rating: newReview.rating,
        comment: newReview.comment,
        created_at: new Date().toISOString(),
      };
      
      setReviews([newReviewData, ...reviews]);
      setNewReview({ rating: 5, title: '', comment: '' });
      setActiveTab('reviews');
      setSubmitError(null);
    } catch (err) {
      // Parse nested error structure
      try {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const outerError = JSON.parse(errorMessage);
        
        // Check if there's a nested error in the message field
        let errorData = outerError;
        if (outerError.message && typeof outerError.message === 'string') {
          try {
            errorData = JSON.parse(outerError.message);
          } catch {
            // If message is not JSON, use outer error
          }
        }
        
        if (errorData.status === 401) {
          setSubmitError('Bạn cần đăng nhập để đánh giá sản phẩm');
          setIsAuthenticated(false);
        } else if (errorData.status === 403) {
          setSubmitError('Bạn không có quyền đánh giá sản phẩm này. Chỉ những khách hàng đã mua sản phẩm mới có thể đánh giá.');
        } else {
          setSubmitError(errorData.data?.error || errorData.data?.message || 'Không thể gửi đánh giá');
        }
      } catch {
        setSubmitError(err instanceof Error ? err.message : 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginRedirect = () => {
    // Save current URL to redirect back after login
    localStorage.setItem('redirectUrl', window.location.pathname);
    router.push('/auth/login');
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
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Đang tải đánh giá...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            ) : reviews.length === 0 ? (
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
                        {(review.user_name || 'U').charAt(0)}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {review.user_name || 'Người dùng'}
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
                          {new Date(review.created_at).toLocaleDateString('vi-VN')}
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
            {/* Show authentication warning if not logged in */}
            {!isAuthenticated && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                    Yêu cầu đăng nhập
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                    Bạn cần đăng nhập để viết đánh giá cho sản phẩm này.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoginRedirect}
                    className="text-sm font-medium text-yellow-800 dark:text-yellow-400 underline hover:no-underline"
                  >
                    Đăng nhập ngay
                  </button>
                </div>
              </div>
            )}

            {/* Show error message if submission failed */}
            {submitError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {submitError}
                  </p>
                  {submitError.includes('đăng nhập') && (
                    <button
                      type="button"
                      onClick={handleLoginRedirect}
                      className="text-sm font-medium text-red-800 dark:text-red-400 underline hover:no-underline mt-2"
                    >
                      Đăng nhập ngay
                    </button>
                  )}
                </div>
              </div>
            )}
            
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
                    disabled={!isAuthenticated}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                      } ${isAuthenticated ? 'hover:text-yellow-400' : 'cursor-not-allowed opacity-50'} transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Tóm tắt đánh giá của bạn..."
                disabled={!isAuthenticated}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nhận xét
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                required
                disabled={!isAuthenticated}
              />
            </div>
            
            <button
              type="submit"
              disabled={!isAuthenticated || submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
