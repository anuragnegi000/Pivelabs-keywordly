import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { content, url, targetKeyword } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = createSEOAnalysisPrompt(content, url, targetKeyword);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    if (!responseText) {
      throw new Error('No response from AI service');
    }

    const analysis = parseSEOAnalysis(responseText);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('SEO keywords error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SEO keywords' },
      { status: 500 }
    );
  }
}

function createSEOAnalysisPrompt(content: string, url?: string, targetKeyword?: string): string {
  let prompt = `You are an SEO expert. Analyze the following content and identify specific words or short phrases (2-4 words max) that should be improved for better SEO.

Content to analyze:
"${content}"
`;

  if (targetKeyword) {
    prompt += `\nTarget keyword: ${targetKeyword}`;
  }

  prompt += `

Return ONLY a JSON array of keywords/phrases to highlight for SEO improvement. Each item should be exactly as it appears in the content.

Format: ["keyword1", "phrase to improve", "another keyword"]

Focus on:
- Weak or generic words that could be more specific
- Missing important keywords
- Words that could be more SEO-friendly
- Phrases that need better keyword optimization

Example: ["click here", "read more", "great product", "amazing service"]

Only include text that exactly matches what appears in the content.`;

  return prompt;
}

function parseSEOAnalysis(responseText: string) {
  try {
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const keywords = JSON.parse(cleanedResponse);
    
    if (Array.isArray(keywords)) {
      return { keywords: keywords.slice(0, 10) }; // Limit to 10 keywords
    }
    
    return { keywords: [] };
  } catch (error) {
    console.error('Failed to parse SEO analysis:', error);
    
    // Fallback: extract potential keywords from response text
    const lines = responseText.split('\n');
    const keywords = [];
    
    for (const line of lines) {
      if (line.includes('"') && line.length < 50) {
        const match = line.match(/"([^"]+)"/);
        if (match && match[1].length > 2 && match[1].length < 30) {
          keywords.push(match[1]);
        }
      }
    }
    
    return { keywords: keywords.slice(0, 10) };
  }
}