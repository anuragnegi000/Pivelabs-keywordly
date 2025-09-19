'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Lightbulb, Target, BookOpen, Settings, FileText } from 'lucide-react';
import { SEOAnalysis } from '@/types/content';

interface SEOSuggestionsProps {
  analysis: SEOAnalysis | null;
  isVisible: boolean;
  onClose: () => void;
}

const typeIcons = {
  keyword: Target,
  readability: BookOpen,
  structure: Settings,
  metadata: FileText,
  general: Lightbulb,
};

const typeColors = {
  keyword: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  readability: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  structure: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  metadata: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  general: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export default function SEOSuggestions({ analysis, isVisible, onClose }: SEOSuggestionsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['improvements']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!isVisible || !analysis) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            SEO Analysis Results
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Improvements Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Content Improvements</h3>
                <Badge variant="secondary">{analysis.improvements.length}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('improvements')}
              >
                {expandedSections.has('improvements') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {expandedSections.has('improvements') && (
              <div className="space-y-3">
                {analysis.improvements.map((improvement, index) => {
                  const Icon = typeIcons[improvement.type] || Lightbulb;
                  const colorClass = typeColors[improvement.type] || typeColors.general;
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 mt-1 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={colorClass} variant="secondary">
                              {improvement.type}
                            </Badge>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-sm font-mono">
                            &ldquo;{improvement.text}&rdquo;
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Why:</strong> {improvement.reason}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              <strong>Suggestion:</strong> {improvement.suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Keywords Section */}
          {analysis.keywords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Keyword Opportunities</h3>
                  <Badge variant="secondary">{analysis.keywords.length}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('keywords')}
                >
                  {expandedSections.has('keywords') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {expandedSections.has('keywords') && (
                <div className="space-y-3">
                  {analysis.keywords.map((keyword, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <strong className="text-blue-600 dark:text-blue-400">{keyword.keyword}</strong>
                        <Badge variant="outline">Frequency: {keyword.frequency}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {keyword.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Overall Suggestions */}
          {analysis.overallSuggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">General Recommendations</h3>
                  <Badge variant="secondary">{analysis.overallSuggestions.length}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('overall')}
                >
                  {expandedSections.has('overall') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {expandedSections.has('overall') && (
                <div className="space-y-2">
                  {analysis.overallSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Lightbulb className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">{suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 text-center text-sm text-gray-500">
            Click on highlighted text in the editor to rewrite with AI suggestions
          </div>
        </CardContent>
      </Card>
    </div>
  );
}