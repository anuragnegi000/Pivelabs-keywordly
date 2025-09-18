import { NextRequest, NextResponse } from 'next/server';
import { calculateSEOScore } from '@/lib/seo-analyzer';
import { ParsedContent } from '@/types/content';

export async function POST(request: NextRequest) {
  try {
    const { content, targetKeyword } = await request.json();
    
    if (!content || typeof content !== 'object') {
      return NextResponse.json(
        { error: 'Content is required and must be an object' },
        { status: 400 }
      );
    }
    
    if (!content.title || !Array.isArray(content.content)) {
      return NextResponse.json(
        { error: 'Invalid content structure' },
        { status: 400 }
      );
    }
    
    const parsedContent = content as ParsedContent;
    const seoScore = calculateSEOScore(parsedContent, targetKeyword);
    
    return NextResponse.json({ score: seoScore });
  } catch (error) {
    console.error('SEO score calculation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate SEO score';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}