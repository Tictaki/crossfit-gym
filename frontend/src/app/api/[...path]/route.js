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

    // Get response content
    const contentType = response.headers.get('content-type');
    let data;
    
    // Process response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!restrictedHeaders.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Handle JSON or Binary response
    if (contentType?.includes('application/json')) {
      data = await response.json();
      
      // If backend returned an error, relay it instead of a generic 502
      if (!response.ok) {
        console.error(`Backend error (${response.status}):`, data);
        return NextResponse.json(data, { 
          status: response.status,
          headers: responseHeaders 
        });
      }
      
      return NextResponse.json(data, {
        status: response.status,
        headers: responseHeaders
      });
    } else {
      // Binary data (PDFs, Images, etc)
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        headers: responseHeaders
      });
    }
  } catch (error) {
    console.error('Proxy fetch failed:', error);
    return NextResponse.json({ 
      error: 'Incapaz de contactar o servidor backend', 
      details: error.message,
      target: targetUrl,
      timestamp: new Date().toISOString()
    }, { status: 504 }); // 504 Gateway Timeout is often more accurate for unreachable backends
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
