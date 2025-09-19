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
    } catch (error: unknown) {
      const isRateLimitError = (error as { status?: number; message?: string })?.status === 503 || 
                               (error as { message?: string })?.message?.includes('overloaded') ||
                               (error as { message?: string })?.message?.includes('503');
      
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

function createSEOScorePrompt(content: ParsedContent, targetKeyword?: string, previousScore?: number): string {
  console.log("Creating SEO score prompt for content with", content.content.length, "blocks");
  const contentText = content.content.map(block => block.content).join(' ');
  console.log("Total content length:", contentText.length, "characters");
  
  const words = contentText.split(' ');
  console.log("Total words:", words.length);
  
  // Increase limit to handle larger content but stay within API limits
  const truncatedContent = words.slice(0, 800).join(' '); // Increased from 300 to 800 words
  const headings = content.content.filter(b => b.type === 'heading' || b.type === 'subheading').length;
  
  
  const contentHash = contentText.length + words.length + headings;
  const keywordCount = targetKeyword ? (contentText.toLowerCase().match(new RegExp(targetKeyword.toLowerCase(), 'g')) || []).length : 0;
  
  const previousScoreContext = previousScore ? 
    `\nPREVIOUS SCORE: ${previousScore}/100
    
CONTEXT: This content has been AI-optimized from the previous version. AI rewriting typically improves SEO through:
- Better keyword integration
- Enhanced readability
- Stronger vocabulary
- Improved structure
- More engaging language

Analyze this optimized version and score accordingly. If genuine improvements were made, reflect this in a higher score.` : 
    '\nFirst analysis of original content.';
  
  return `
SEO Analysis Task:
Title: "${content.title}"
Target Keyword: "${targetKeyword || 'None'}"
Content Length: ${words.length} words
Headings: ${headings}
Keyword Usage: ${keywordCount} times
Content ID: ${contentHash}${previousScoreContext}

Content Sample: "${truncatedContent}"

IMPORTANT: Score this content objectively based on SEO quality. Look for:
- Natural keyword usage and density
- Clear, engaging writing style  
- Good readability and flow
- Proper structure and formatting
- SEO-optimized language choices

Return exact JSON:
{
  "overall": [calculate weighted average from breakdown scores],
  "previousScore": ${previousScore || 0},
  "improvement": "[describe specific improvements or changes]",
  "contentAnalyzed": "${contentHash}",
  "breakdown": {
    "contentQuality": {"score": [0-100], "status": "[status]", "details": ["Quality assessment"], "weight": 0.25},
    "keywordOptimization": {"score": [0-100], "status": "[status]", "details": ["Keyword analysis"], "weight": 0.3},
    "structure": {"score": [0-100], "status": "[status]", "details": ["Structure review"], "weight": 0.2},
    "readability": {"score": [0-100], "status": "[status]", "details": ["Readability notes"], "weight": 0.15},
    "metaData": {"score": [0-100], "status": "[status]", "details": ["Meta assessment"], "weight": 0.1}
  },
  "recommendations": ["Actionable improvement suggestions"]
}

Status: "excellent"(90-100), "good"(70-89), "needs-improvement"(50-69), "poor"(0-49)
`;
}

export async function POST(request: NextRequest) {
  try {
    const { content, targetKeyword, previousScore } = await request.json();
    
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = createSEOScorePrompt(parsedContent, targetKeyword, previousScore);
    
      const result = await retryWithBackoff(async () => {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      });

      const cleanResponse = result.replace(/```json\s*|\s*```/g, '').trim();
      const aiScore = JSON.parse(cleanResponse);
      
      aiScore.timestamp = new Date();
      
      return NextResponse.json({ 
        score: aiScore,
        source: 'ai'
      });

    } catch (aiError: unknown) {
      console.log('AI SEO analysis failed, using fallback:', (aiError as Error).message);
      
      const seoScore = calculateSEOScore(parsedContent, targetKeyword);
      
      if (previousScore) {
        const improvement = seoScore.overall - previousScore;
        (seoScore as unknown as Record<string, unknown>).previousScore = previousScore;
        (seoScore as unknown as Record<string, unknown>).improvement = improvement > 0 ? `+${improvement} points better` : 
                                       improvement < 0 ? `${improvement} points worse` : 'No change';
      } else {
        (seoScore as unknown as Record<string, unknown>).previousScore = 0;
        (seoScore as unknown as Record<string, unknown>).improvement = 'First analysis';
      }
      
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