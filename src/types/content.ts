export interface ParsedContent {
  title: string;
  description: string;
  author?: string;
  publishDate?: string;
  content: ContentBlock[];
  originalUrl: string;
  images: ImageBlock[];
}

export interface ContentBlock {
  id: string;
  type: 'heading' | 'subheading' | 'paragraph' | 'list' | 'blockquote';
  content: string;
  level?: number; // for headings (h1=1, h2=2, etc.)
  isEdited?: boolean;
  originalContent?: string;
}

export interface ImageBlock {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

export interface RewriteRequest {
  text: string;
  targetKeyword?: string;
  tone?: 'professional' | 'casual' | 'technical' | 'marketing';
  length?: 'shorter' | 'same' | 'longer';
}

export interface RewriteResponse {
  rewrittenText: string;
  changes: string[];
  confidence: number;
}

export interface SEOKeywordSuggestion {
  word: string;
  suggestion: string;
  reason: string;
}

export interface SEOAnalysis {
  keywords: SEOKeywordSuggestion[];
}