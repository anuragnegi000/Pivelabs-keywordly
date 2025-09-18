import { NextRequest, NextResponse } from 'next/server';
import { rewriteWithAI } from '@/lib/ai-client';
import { RewriteRequest } from '@/types/content';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { text, targetKeyword, tone, length } = body as RewriteRequest;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long (max 5000 characters)' },
        { status: 400 }
      );
    }
    
    const rewriteRequest: RewriteRequest = {
      text,
      targetKeyword,
      tone,
      length
    };
    
    const result = await rewriteWithAI(rewriteRequest);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI rewrite error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to rewrite content';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}