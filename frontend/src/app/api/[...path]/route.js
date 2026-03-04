import { NextResponse } from 'next/server';

// Railway backend URL - server-side only (no NEXT_PUBLIC_ prefix needed)
const RAILWAY_API = process.env.RAILWAY_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://crossfit-gym-production-944c.up.railway.app/api';

async function handler(request, { params }) {
  const path = params.path?.join('/') || '';
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const targetUrl = `${RAILWAY_API}/${path}${query ? `?${query}` : ''}`;

  // Forward filtered headers from the request
  const headers = new Headers();
  const restrictedHeaders = [
    'host',
    'connection',
    'content-length',
    'transfer-encoding',
    'keep-alive',
    'te', // Keep-alive chunking
    'trailer',
    'upgrade',
  ];

  request.headers.forEach((value, key) => {
    if (!restrictedHeaders.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const fetchOptions = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    try {
      // Use arrayBuffer for all body types to support file uploads (multer) and JSON
      fetchOptions.body = await request.arrayBuffer();
    } catch (e) {
      console.warn('Failed to read request body', e);
    }
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);

    // Get response body
    const data = await response.arrayBuffer();
    
    // Process response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!restrictedHeaders.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    
    // Ensure CORS and basic security
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ 
      error: 'Proxy request failed', 
      details: error.message,
      target: targetUrl 
    }, { status: 502 });
  }
}

export async function GET(request, context) { return handler(request, context); }
export async function POST(request, context) { return handler(request, context); }
export async function PUT(request, context) { return handler(request, context); }
export async function DELETE(request, context) { return handler(request, context); }
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
