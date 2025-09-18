export interface SEOScore {
  overall: number; // 0-100
  breakdown: SEOBreakdown;
  recommendations: string[];
  timestamp: Date;
}

export interface SEOBreakdown {
  contentQuality: SEOMetric;
  keywordOptimization: SEOMetric;
  readability: SEOMetric;
  structure: SEOMetric;
  metaData: SEOMetric;
}

export interface SEOMetric {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  details: string[];
  weight: number; // importance weight for overall score
}

export interface KeywordAnalysis {
  keyword: string;
  density: number;
  occurrences: number;
  prominence: number; // position weight (title, headings, etc.)
  variations: string[];
}

export interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
  sentenceCount: number;
  wordCount: number;
  paragraphCount: number;
}

export interface ContentStructure {
  hasTitle: boolean;
  hasDescription: boolean;
  headingHierarchy: HeadingStructure[];
  imageAltTexts: number;
  internalLinks: number;
  externalLinks: number;
}

export interface HeadingStructure {
  level: number;
  text: string;
  position: number;
}