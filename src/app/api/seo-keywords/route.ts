import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

function createSEOAnalysisPrompt(content: string, url: string, targetKeyword?: string): string {
  // Truncate content to first 500 words to reduce token usage
  const words = content.split(' ');
  const truncatedContent = words.slice(0, 500).join(' ');
  
  return `
Find weak SEO words in this text. Look for: generic adjectives (good, nice, great), vague words (things, stuff), overused words (very, really), non-specific terms.

${targetKeyword ? `Target keyword: ${targetKeyword}` : ''}

Text: ${truncatedContent}

Return JSON array (max 8 words):
[{"word": "good", "reason": "Generic", "suggestions": ["excellent", "outstanding"]}]
`;
}

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
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms due to API overload`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

function getFallbackKeywords(content: string): Array<{word: string, reason: string, suggestions: string[]}> {
  const weakWords = [
    { word: 'good', reason: 'Generic adjective', suggestions: ['excellent', 'outstanding', 'superior'] },
    { word: 'great', reason: 'Overused positive adjective', suggestions: ['exceptional', 'remarkable', 'impressive'] },
    { word: 'nice', reason: 'Weak descriptor', suggestions: ['appealing', 'attractive', 'elegant'] },
    { word: 'amazing', reason: 'Overused superlative', suggestions: ['extraordinary', 'remarkable', 'innovative'] },
    { word: 'awesome', reason: 'Informal superlative', suggestions: ['impressive', 'outstanding', 'exceptional'] },
    { word: 'very', reason: 'Weak intensifier', suggestions: ['extremely', 'significantly', 'considerably'] },
    { word: 'really', reason: 'Informal intensifier', suggestions: ['genuinely', 'truly', 'notably'] },
    { word: 'quite', reason: 'Vague qualifier', suggestions: ['notably', 'considerably', 'substantially'] },
    { word: 'stuff', reason: 'Vague noun', suggestions: ['materials', 'components', 'elements'] },
    { word: 'things', reason: 'Non-specific noun', suggestions: ['elements', 'components', 'aspects'] },
    { word: 'easy', reason: 'Generic adjective', suggestions: ['straightforward', 'intuitive', 'streamlined'] },
    { word: 'simple', reason: 'Basic descriptor', suggestions: ['streamlined', 'elegant', 'refined'] },
    { word: 'big', reason: 'Generic size descriptor', suggestions: ['substantial', 'comprehensive', 'extensive'] },
    { word: 'small', reason: 'Basic size descriptor', suggestions: ['compact', 'concise', 'focused'] },
    { word: 'fast', reason: 'Generic speed descriptor', suggestions: ['rapid', 'efficient', 'streamlined'] }
  ];

  const foundWords: Array<{word: string, reason: string, suggestions: string[]}> = [];
  const contentLower = content.toLowerCase();
  
  for (const weakWord of weakWords) {
    // Use word boundaries to match whole words only
    const regex = new RegExp(`\\b${weakWord.word}\\b`, 'gi');
    if (regex.test(contentLower) && foundWords.length < 10) {
      foundWords.push(weakWord);
    }
  }
  
  return foundWords;
}

export async function POST(request: NextRequest) {
  try {
    const { content, url, targetKeyword } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Limit content length to reduce API usage
    const contentText = typeof content === 'string' ? content : 
      (content.content ? content.content.map((block: { content: string }) => block.content).join(' ') : content);
    
    if (contentText.length > 10000) {
      return NextResponse.json(
        { error: 'Content too long. Please reduce to under 10,000 characters.' },
        { status: 400 }
      );
    }

    try {
      // Try AI analysis with retry logic
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = createSEOAnalysisPrompt(contentText, url, targetKeyword);
      
      const result = await retryWithBackoff(async () => {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      });

      // Parse the AI response
      const cleanResponse = result.replace(/```json\s*|\s*```/g, '').trim();
      const keywords = JSON.parse(cleanResponse);

      return NextResponse.json({ keywords });

    } catch (aiError: unknown) {
      console.log('AI analysis failed, using fallback keywords:', (aiError as Error).message);
      
      // Use fallback keyword detection
      const keywords = getFallbackKeywords(contentText);
      
      return NextResponse.json({ 
        keywords,
        fallback: true,
        message: 'AI service temporarily unavailable. Using basic keyword detection.'
      });
    }

  } catch (error) {
    console.error('SEO keywords error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content for SEO keywords' },
      { status: 500 }
    );
  }
}