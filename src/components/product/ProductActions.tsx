'use client';

import { Heart, Share2 } from 'lucide-react';
import { useState } from 'react';

export default function ProductActions() {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // Add to favorites logic here
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Sản phẩm tuyệt vời',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link đã được sao chép!');
    }
  };

  return (
    <>
      <button 
        onClick={handleLike}
        className={`p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
          isLiked ? 'bg-red-50 border-red-300' : ''
        }`}
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600 dark:text-gray-400'}`} />
      </button>
      <button 
        onClick={handleShare}
        className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    </>
  );
}
