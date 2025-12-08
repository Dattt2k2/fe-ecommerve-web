import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

const SearchDropdown = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const MAX_DROPDOWN_ITEMS = 3;

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (query.trim()) {
        fetchResults(query);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(debounceTimeout);
  }, [query]);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const fetchResults = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      console.log(`Fetching results for query: ${searchQuery}`);
      const response = await apiClient.get<any>(`/search?query=${searchQuery}`);
      setResults(response || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm sản phẩm, thương hiệu..."
          className="w-full bg-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 pr-9 sm:pr-10 text-sm text-gray-700 placeholder-gray-500 border-none outline-none focus:ring-2 focus:ring-orange-200 transition-all shadow-sm "
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && results.length > 0 && setShowDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              e.preventDefault();
              setShowDropdown(false);
              router.push(`/?search=${encodeURIComponent(query.trim())}`);
            }
          }}
        />
        <button 
          onClick={() => {
            if (query.trim()) {
              setShowDropdown(false);
              router.push(`/?search=${encodeURIComponent(query.trim())}`);
            }
          }}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 sm:p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-all"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
      
      {/* Dropdown Results */}
      {showDropdown && (query.trim() || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <p className="mt-2">Đang tìm kiếm...</p>
            </div>
          )}
          {!isLoading && results.length === 0 && query.trim() && (
            <div className="p-4 text-center text-gray-500">
              Không tìm thấy sản phẩm nào
            </div>
          )}
          {!isLoading && results.length > 0 && (
            <ul className="py-2">
              {results.slice(0, MAX_DROPDOWN_ITEMS).map((product: any) => (
                <li key={product.id || product.ID}>
                  <Link
                    href={`/products/${product.id || product.ID}`}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setShowDropdown(false);
                      setQuery('');
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Product Image */}
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden relative">
                        {(() => {
                          let imageUrl = null;
                          
                          if (product.image_path) {
                            if (Array.isArray(product.image_path) && product.image_path.length > 0) {
                              imageUrl = product.image_path[0];
                            } 
                            else if (typeof product.image_path === 'string') {
                              imageUrl = product.image_path;
                            }
                          }
                          
                          if (imageUrl) {
                            try {
                              const originalUrl = imageUrl;
                              
                              while (imageUrl.includes('%')) {
                                const decoded = decodeURIComponent(imageUrl);
                                if (decoded === imageUrl) break;
                                imageUrl = decoded;
                              }
                              
                              const urlMatch = imageUrl.match(/https?:\/\/[^\/]+\/https?:\/?\/?([^\/]+\.s3\.[^\/]+)(.+)/);
                              if (urlMatch) {
                                imageUrl = `https://${urlMatch[1]}${urlMatch[2]}`;
                              } else {
                                imageUrl = imageUrl.replace(/https:\/(?!\/)/g, 'https://');
                                const httpsMatches = imageUrl.matchAll(/https?:\/\/[^\s"']+/g);
                                const matches = Array.from(httpsMatches) as RegExpMatchArray[];
                                if (matches.length > 1) {
                                  const lastMatch = matches[matches.length - 1];
                                  if (lastMatch && lastMatch[0]) {
                                    imageUrl = lastMatch[0];
                                  }
                                }
                              }
                              
                              console.log('[SearchDropdown] Image URL processing:', {
                                original: originalUrl,
                                decoded: imageUrl,
                                productId: product.id || product.ID
                              });
                            } catch (e) {
                              console.error('[SearchDropdown] Error processing URL:', e);
                            }
                          }
                          
                          return imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name || product.Name}
                              className="w-full h-full object-cover"
                              style={{ display: 'block' }}
                              onError={(e) => {
                                console.error('[SearchDropdown] Image load error for:', imageUrl);
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const existingPlaceholder = parent.querySelector('.placeholder-icon');
                                  if (!existingPlaceholder) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'placeholder-icon absolute inset-0 w-full h-full flex items-center justify-center text-gray-400 bg-gray-100';
                                    placeholder.innerHTML = `
                                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    `;
                                    parent.appendChild(placeholder);
                                  }
                                }
                              }}
                              onLoad={() => {
                                console.log('[SearchDropdown] Image loaded successfully');
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name || product.Name}</p>
                        <p className="text-sm text-orange-600 font-semibold">
                          {(product.price || product.Price)?.toLocaleString()} VND
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && results.length > MAX_DROPDOWN_ITEMS && (
            <div className="border-t px-4 py-2 text-center">
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => {
                  setShowDropdown(false);
                  setQuery('');
                  router.push(`/products?search=${encodeURIComponent(query)}`);
                }}
              >
                Xem thêm {results.length - MAX_DROPDOWN_ITEMS} kết quả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;