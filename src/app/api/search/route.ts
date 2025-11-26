import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.example.com';


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
    
        // Build query string from search params
        const queryParams: string[] = [];
        
        // Forward all relevant params
        const paramsToForward = ['page', 'limit', 'category', 'sortBy', 'sortOrder', 'search', 'minPrice', 'maxPrice'];
        paramsToForward.forEach(param => {
            const value = searchParams.get(param);
            if (value) {
                queryParams.push(`${param}=${encodeURIComponent(value)}`);
            }
        });

        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        const endpoint = `/products/search${queryString}`;

        const forwardHeaders: Record<string, string> = {
            'Accept': request.headers.get('accept') || 'application/json',
        }

        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'GET',
            headers: forwardHeaders,
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json(
                {error: `Backend returned status: ${response.status}`},
                {status: response.status}
            )
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
    return NextResponse.json(
        {error: 'Failed to fetch products'},
            {status: 500}
        );
    }
}