export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';

// Railway backend URL - server-side only (no NEXT_PUBLIC_ prefix needed)
// Normalize Railway backend URL
const getBackendUrl = () => {
  // RAILWAY_API_URL should be the absolute URL for the backend
  let url = process.env.RAILWAY_API_URL;
  
  // If RAILWAY_API_URL is not set, we MUST have an absolute fallback.
  // We ignore NEXT_PUBLIC_API_URL if it's a relative path like "/api"
  if (!url || url.startsWith('/')) {
    url = 'https://crossfit-gym-production-3f5b.up.railway.app';
  }
  
  // Normalize Railway backend URL
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  
  // Ensure it ends with /api if it's the backend root
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  
  return url;
};

const RAILWAY_API = getBackendUrl();

async function handler(request, { params }) {
  const pathParts = params.path || [];
  const path = pathParts.join('/');
  const { searchParams } = request.nextUrl;
  const query = searchParams.toString();
  
  // Construct target URL ensuring exactly one slash between API and path
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

  // Ensure Authorization is explicitly captured if present
  const auth = request.headers.get('authorization') || request.headers.get('Authorization');
  if (auth) {
    headers.set('Authorization', auth);
  }

  // Debug: verify if Authorization makes it through
  if (!headers.has('Authorization')) {
    console.warn(`[Proxy] No Authorization header for ${request.method} ${targetUrl}`);
  }

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
        console.error(`❌ Backend error (${response.status}) on ${request.method} ${targetUrl}:`, data);
        return NextResponse.json({
          ...data,
          _proxyContext: {
            targetUrl,
            method: request.method,
            status: response.status
          }
        }, { 
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
