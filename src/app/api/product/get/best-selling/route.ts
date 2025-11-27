import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// GET /api/product/get/best-selling - Get best selling products
export async function GET(request: NextRequest) {
  try {
    let backendUrl = `${BACKEND_URL}/products/get/best-selling`;
    
    console.log('[BestSeller API] Calling backend:', backendUrl);
    
    let response = await fetch(backendUrl, {
      method: 'GET',
     
    });
    
    // Nếu 404, thử path khác
    if (response.status === 404) {
      console.log('[BestSeller API] 404 with /products/get/best-selling, trying /products/best-selling');
      backendUrl = `${BACKEND_URL}/products/best-selling`;
      response = await fetch(backendUrl, {
        method: 'GET',
      });
    }
    


    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    if (!response.ok) {
      // For 401 or 404, return empty array instead of error (public endpoint)
      if (response.status === 401 || response.status === 404) {
        console.log('[BestSeller API] 401/404 - returning empty array');
        return NextResponse.json({ data: [] }, { status: 200 });
      }
      return NextResponse.json(
        { error: data?.error || `Backend returned status: ${response.status}`, details: data || text },
        { status: response.status }
      );
    }

    console.log('[BestSeller API] Success, products count:', Array.isArray(data?.data) ? data.data.length : Array.isArray(data?.best_seller) ? data.best_seller.length : 0);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[BestSeller API] Error:', error);
    // Return empty array on error instead of 500 (public endpoint)
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}