import { NextResponse } from 'next/server';

// Railway backend URL - server-side only (no NEXT_PUBLIC_ prefix needed)
const RAILWAY_API = process.env.RAILWAY_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://crossfit-gym-production-944c.up.railway.app/api';

async function handler(request, { params }) {
  const path = params.path?.join('/') || '';
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const targetUrl = `${RAILWAY_API}/${path}${query ? `?${query}` : ''}`;

  const headers = new Headers();
  // Forward relevant headers
  const auth = request.headers.get('Authorization');
  const contentType = request.headers.get('Content-Type');
  if (auth) headers.set('Authorization', auth);
  if (contentType) headers.set('Content-Type', contentType);

  let body;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.text();
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy request failed', details: error.message }, { status: 502 });
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
