import { NextRequest, NextResponse } from 'next/server';
import { calculateSEOScore } from '@/lib/seo-analyzer';
import { ParsedContent } from '@/types/content';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimitError = error?.status === 503 || 
                               error?.message?.includes('overloaded') ||
                               error?.message?.includes('503');
      
      if (!isRateLimitError || i === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
      console.log(`SEO Score API retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

function createSEOScorePrompt(content: ParsedContent, targetKeyword?: string): string {
  // Truncate content to reduce token usage
  const contentText = content.content.map(block => block.content).join(' ');
  const words = contentText.split(' ');
  const truncatedContent = words.slice(0, 300).join(' ');
  const headings = content.content.filter(b => b.type === 'heading' || b.type === 'subheading').length;
  
  return `
Analyze SEO for: ${content.title}
Target: ${targetKeyword || 'None'}
Headings: ${headings}
Words: ${words.length}

Text: ${truncatedContent}

Score 0-100 each: content quality, keyword optimization, structure, readability, meta.

JSON:
{
  "overall": 85,
  "breakdown": {
    "contentQuality": {"score": 85, "status": "good", "details": ["Brief feedback"], "weight": 0.25},
    "keywordOptimization": {"score": 75, "status": "good", "details": ["Brief feedback"], "weight": 0.3},
    "structure": {"score": 90, "status": "excellent", "details": ["Brief feedback"], "weight": 0.2},
    "readability": {"score": 80, "status": "good", "details": ["Brief feedback"], "weight": 0.15},
    "metaData": {"score": 70, "status": "needs-improvement", "details": ["Brief feedback"], "weight": 0.1}
  },
  "recommendations": ["Brief suggestions"]
}

Status: excellent(90-100), good(70-89), needs-improvement(50-69), poor(0-49)
`;
}

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

    try {
      // Try AI-powered SEO analysis first
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = createSEOScorePrompt(parsedContent, targetKeyword);
      
      const result = await retryWithBackoff(async () => {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      });

      // Parse AI response
      const cleanResponse = result.replace(/```json\s*|\s*```/g, '').trim();
      const aiScore = JSON.parse(cleanResponse);
      
      // Add timestamp
      aiScore.timestamp = new Date();
      
      return NextResponse.json({ 
        score: aiScore,
        source: 'ai'
      });

    } catch (aiError: any) {
      console.log('AI SEO analysis failed, using fallback:', aiError.message);
      
      // Fallback to static analysis
      const seoScore = calculateSEOScore(parsedContent, targetKeyword);
      
      return NextResponse.json({ 
        score: seoScore,
        source: 'fallback',
        message: 'AI analysis temporarily unavailable. Using basic SEO scoring.'
      });
    }
    
  } catch (error) {
    console.error('SEO score calculation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate SEO score';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}