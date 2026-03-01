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
  const restrictedRequestHeaders = ['host', 'connection', 'content-length'];
  request.headers.forEach((value, key) => {
    if (!restrictedRequestHeaders.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  let body;
  if (!['GET', 'HEAD'].includes(request.method)) {
    // For uploads and binary data, read as arrayBuffer instead of text
    body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });

    // Read response binary data
    const data = await response.arrayBuffer();
    
    // Forward filtered headers from backend response
    const responseHeaders = new Headers();
    const restrictedResponseHeaders = ['transfer-encoding', 'content-encoding', 'content-length'];
    response.headers.forEach((value, key) => {
      if (!restrictedResponseHeaders.includes(key.toLowerCase())) {
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
