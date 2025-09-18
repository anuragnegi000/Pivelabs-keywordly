import { GoogleGenerativeAI } from '@google/generative-ai';
import { RewriteRequest, RewriteResponse } from '@/types/content';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function rewriteWithAI(request: RewriteRequest): Promise<RewriteResponse> {
  try {
    const { text, targetKeyword, tone = 'professional', length = 'same' } = request;
    
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('Google API key not found. Please add GOOGLE_API_KEY to your environment variables.');
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = createRewritePrompt(text, targetKeyword, tone, length);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    if (!responseText) {
      throw new Error('No response from AI service');
    }
    console.log("AI rewrite raw response:", responseText);
    const lines = responseText.split('\n');
    const rewrittenTextIndex = lines.findIndex(line => line.toLowerCase().includes('rewritten:'));
    const changesIndex = lines.findIndex(line => line.toLowerCase().includes('changes:'));
    
    let rewrittenText = text; 
    let changes: string[] = [];
    
    if (rewrittenTextIndex !== -1) {
      rewrittenText = lines.slice(rewrittenTextIndex + 1, changesIndex !== -1 ? changesIndex : undefined)
        .join('\n')
        .trim();
    }
    
    if (changesIndex !== -1) {
      changes = lines.slice(changesIndex + 1)
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-*]\s*/, '').trim());
    }
    console.log("AI rewrite response------------", { rewrittenText, changes, responseText });

    if (!rewrittenText || rewrittenText === text) {
      const quotedMatch = responseText.match(/"([^"]+)"/);
      if (quotedMatch) {
        rewrittenText = quotedMatch[1];
      } else if (responseText.length > text.length * 0.5 && responseText.length < text.length * 2) {
       rewrittenText = responseText.trim();
      }
    }

    return {
      rewrittenText,
      changes: changes.length > 0 ? changes : ['Content rewritten for better SEO and readability'],
      confidence: 0.85
    };
  } catch (error) {
    console.error('AI rewrite error:', error);
    throw new Error('Failed to rewrite content with AI. Make sure your Google API key is valid.');
  }
}

function createRewritePrompt(
  text: string, 
  targetKeyword?: string, 
  tone: string = 'professional', 
  length: string = 'same'
): string {
  let prompt = `Rewrite this text:
- Tone: ${tone}
- Length: ${length === 'shorter' ? 'shorter' : length === 'longer' ? 'longer' : 'same'}`;

  if (targetKeyword) {
    prompt += `\n- Include keyword: "${targetKeyword}"`;
  }

  prompt += `\n\nText: "${text}"\n\nFormat:\nREWRITTEN:\n[new version]\n\nCHANGES:\n- [key changes]`;

  return prompt;
}

export async function generateSEOSuggestions(content: string, targetKeyword?: string): Promise<string[]> {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return ['Add your Google API key to get AI-powered SEO suggestions'];
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Analyze this content for SEO improvements${targetKeyword ? ` targeting the keyword "${targetKeyword}"` : ''}:

"${content}"

Provide 5 specific, actionable SEO improvement suggestions. Format each suggestion as a bullet point.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    if (!responseText) {
      return [];
    }

    return responseText
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
      .slice(0, 5);
  } catch (error) {
    console.error('SEO suggestions error:', error);
    return ['Error generating SEO suggestions. Check your Google API key.'];
  }
}