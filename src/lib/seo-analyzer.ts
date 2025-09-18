import { 
  SEOScore, 
  SEOBreakdown, 
  SEOMetric, 
  KeywordAnalysis, 
  ReadabilityMetrics, 
  ContentStructure 
} from '@/types/seo';
import { ParsedContent, ContentBlock } from '@/types/content';

export function calculateSEOScore(content: ParsedContent, targetKeyword?: string): SEOScore {
  const text = content.content.map(block => block.content).join(' ');
  
  const contentQuality = analyzeContentQuality(text, content.content);
  const keywordOptimization = analyzeKeywordOptimization(text, content, targetKeyword);
  const readability = analyzeReadability(text);
  const structure = analyzeStructure(content);
  const metaData = analyzeMetaData(content);
  
  const breakdown: SEOBreakdown = {
    contentQuality,
    keywordOptimization,
    readability,
    structure,
    metaData
  };
  
  const overall = Math.round(
    (contentQuality.score * contentQuality.weight +
     keywordOptimization.score * keywordOptimization.weight +
     readability.score * readability.weight +
     structure.score * structure.weight +
     metaData.score * metaData.weight) /
    (contentQuality.weight + keywordOptimization.weight + readability.weight + structure.weight + metaData.weight)
  );
  
  const recommendations = generateRecommendations(breakdown);
  
  return {
    overall,
    breakdown,
    recommendations,
    timestamp: new Date()
  };
}

function analyzeContentQuality(text: string, blocks: ContentBlock[]): SEOMetric {
  const details: string[] = [];
  let score = 0;
  
  const wordCount = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (wordCount >= 300) {
    score += 30;
    details.push(`Good content length: ${wordCount} words`);
  } else {
    details.push(`Content too short: ${wordCount} words (recommended: 300+)`);
  }
  
  const paragraphs = blocks.filter(b => b.type === 'paragraph');
  const avgParagraphLength = paragraphs.length > 0 ? 
    paragraphs.reduce((sum, p) => sum + p.content.split(/\s+/).length, 0) / paragraphs.length : 0;
  
  if (avgParagraphLength <= 150 && avgParagraphLength >= 50) {
    score += 25;
    details.push('Good paragraph length');
  } else if (avgParagraphLength > 150) {
    details.push('Paragraphs too long (break them up)');
  } else {
    details.push('Paragraphs too short');
  }
  
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  if (avgSentenceLength >= 15 && avgSentenceLength <= 25) {
    score += 20;
    details.push('Good sentence length variety');
  } else {
    details.push('Improve sentence length variety');
  }
  
  const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
  const uniquenessRatio = uniqueWords / wordCount;
  if (uniquenessRatio > 0.5) {
    score += 25;
    details.push('Good vocabulary variety');
  } else {
    details.push('Increase vocabulary variety');
  }
  
  return {
    score,
    status: getStatus(score),
    details,
    weight: 0.25
  };
}

function analyzeKeywordOptimization(text: string, content: ParsedContent, targetKeyword?: string): SEOMetric {
  const details: string[] = [];
  let score = 0;
  
  if (!targetKeyword) {
    return {
      score: 50,
      status: 'needs-improvement',
      details: ['No target keyword specified'],
      weight: 0.3
    };
  }
  
  const keyword = targetKeyword.toLowerCase();
  const textLower = text.toLowerCase();
  const titleLower = content.title.toLowerCase();
  
  // Keyword in title
  if (titleLower.includes(keyword)) {
    score += 30;
    details.push('Keyword found in title');
  } else {
    details.push('Add keyword to title');
  }
  
  // Keyword density
  const keywordOccurrences = (textLower.match(new RegExp(keyword, 'g')) || []).length;
  const wordCount = text.split(/\s+/).length;
  const density = (keywordOccurrences / wordCount) * 100;
  
  if (density >= 1 && density <= 3) {
    score += 40;
    details.push(`Good keyword density: ${density.toFixed(1)}%`);
  } else if (density > 3) {
    score += 20;
    details.push(`Keyword density too high: ${density.toFixed(1)}% (reduce to 1-3%)`);
  } else {
    details.push(`Keyword density too low: ${density.toFixed(1)}% (aim for 1-3%)`);
  }
  
  // Keyword in headings
  const headings = content.content.filter(b => b.type === 'heading' || b.type === 'subheading');
  const keywordInHeadings = headings.some(h => h.content.toLowerCase().includes(keyword));
  
  if (keywordInHeadings) {
    score += 30;
    details.push('Keyword found in headings');
  } else {
    details.push('Add keyword to at least one heading');
  }
  
  return {
    score,
    status: getStatus(score),
    details,
    weight: 0.3
  };
}

function analyzeReadability(text: string): SEOMetric {
  const details: string[] = [];
  let score = 0;
  
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  // Flesch Reading Ease
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  if (fleschScore >= 60) {
    score += 40;
    details.push(`Good readability score: ${Math.round(fleschScore)}`);
  } else {
    details.push(`Improve readability: ${Math.round(fleschScore)} (aim for 60+)`);
  }
  
  // Sentence length variety
  if (avgSentenceLength <= 20) {
    score += 30;
    details.push('Good average sentence length');
  } else {
    details.push('Shorten sentences for better readability');
  }
  
  // Transition words (basic check)
  const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'consequently', 'additionally'];
  const hasTransitions = transitionWords.some(word => text.toLowerCase().includes(word));
  
  if (hasTransitions) {
    score += 30;
    details.push('Good use of transition words');
  } else {
    details.push('Add transition words to improve flow');
  }
  
  return {
    score,
    status: getStatus(score),
    details,
    weight: 0.2
  };
}

function analyzeStructure(content: ParsedContent): SEOMetric {
  const details: string[] = [];
  let score = 0;
  
  // Title presence
  if (content.title && content.title.length > 0) {
    score += 20;
    details.push('Title present');
  } else {
    details.push('Add a title');
  }
  
  // Description presence
  if (content.description && content.description.length > 0) {
    score += 20;
    details.push('Description present');
  } else {
    details.push('Add a meta description');
  }
  
  // Heading hierarchy
  const headings = content.content.filter(b => b.type === 'heading' || b.type === 'subheading');
  if (headings.length >= 2) {
    score += 30;
    details.push(`Good heading structure: ${headings.length} headings`);
  } else {
    details.push('Add more headings to structure content');
  }
  
  // Content organization
  const paragraphs = content.content.filter(b => b.type === 'paragraph');
  if (paragraphs.length >= 3) {
    score += 30;
    details.push('Good content organization');
  } else {
    details.push('Break content into more paragraphs');
  }
  
  return {
    score,
    status: getStatus(score),
    details,
    weight: 0.15
  };
}

function analyzeMetaData(content: ParsedContent): SEOMetric {
  const details: string[] = [];
  let score = 0;
  
  // Title length
  if (content.title.length >= 30 && content.title.length <= 60) {
    score += 50;
    details.push(`Good title length: ${content.title.length} characters`);
  } else if (content.title.length > 60) {
    details.push(`Title too long: ${content.title.length} chars (max 60)`);
  } else {
    details.push(`Title too short: ${content.title.length} chars (min 30)`);
  }
  
  // Description length
  if (content.description && content.description.length >= 120 && content.description.length <= 160) {
    score += 50;
    details.push(`Good description length: ${content.description.length} characters`);
  } else if (content.description && content.description.length > 160) {
    details.push(`Description too long: ${content.description.length} chars (max 160)`);
  } else if (content.description) {
    details.push(`Description too short: ${content.description.length} chars (min 120)`);
  } else {
    details.push('Add a meta description');
  }
  
  return {
    score,
    status: getStatus(score),
    details,
    weight: 0.1
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function getStatus(score: number): SEOMetric['status'] {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'needs-improvement';
  return 'poor';
}

function generateRecommendations(breakdown: SEOBreakdown): string[] {
  const recommendations: string[] = [];
  
  Object.entries(breakdown).forEach(([key, metric]) => {
    if (metric.status === 'poor' || metric.status === 'needs-improvement') {
      recommendations.push(...metric.details.filter((detail: string) => !detail.includes(':')));
    }
  });
  
  return recommendations.slice(0, 5); // Top 5 recommendations
}