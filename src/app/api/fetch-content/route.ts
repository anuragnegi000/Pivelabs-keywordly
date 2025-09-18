import { NextRequest, NextResponse } from 'next/server';
import { fetchWebpageContent, parseHTMLContent, validateUrl } from '@/lib/content-parser';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (!validateUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    const html = await fetchWebpageContent(url);
    
    const parsedContent = parseHTMLContent(html, url);
    
    return NextResponse.json({ content: parsedContent });
  } catch (error) {
    console.error('Fetch content error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch content';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}