'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CheckCircle, AlertTriangle, XCircle, Download, FileText } from 'lucide-react';
import { SEOScore } from '@/types/seo';
import { ParsedContent } from '@/types/content';
import DonutChart from './DonutChart';

interface SEOScorePanelProps {
  content: ParsedContent;
  targetKeyword?: string;
  onExport?: (format: 'html' | 'markdown') => void;
  lastUpdate?: number;
}

export default function SEOScorePanel({ content, targetKeyword, onExport, lastUpdate: externalUpdate }: SEOScorePanelProps) {
  const [seoScore, setSeoScore] = useState<SEOScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [scoreImprovement, setScoreImprovement] = useState<string | null>(null);
  
  // Cache and debouncing refs
  const lastRequestRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const calculateSEOScore = async () => {
    // Create unique key for this request to prevent duplicates
    const contentText = content.content.map(block => block.content).join(' ');
    const requestKey = `${contentText.substring(0, 100)}_${targetKeyword || ''}`;
    
    // If this is the same request as last time, skip it
    if (requestKey === lastRequestRef.current && seoScore) {
      console.log('Skipping duplicate SEO score request');
      return;
    }
    
    lastRequestRef.current = requestKey;
    setIsLoading(true);
    
    try {
      console.log('Calculating SEO score for content (debounced)');
      
      // Create a more unique storage key based on content hash
      const contentHash = btoa(contentText.substring(0, 100)).substring(0, 10);
      const storageKey = `seo_score_${content.title || 'content'}_${contentHash}`;
      const storedScore = localStorage.getItem(storageKey);
      const prevScore = storedScore ? JSON.parse(storedScore).overall : null;
      
      console.log('Storage key:', storageKey);
      console.log('Previous score found:', prevScore);
      
      const response = await fetch('/api/seo-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          targetKeyword,
          previousScore: prevScore
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('SEO score response:', data);
        
        const newScore = data.score;
        setSeoScore(newScore);
        
        // Store the new score with timestamp
        const scoreData = {
          overall: newScore.overall,
          timestamp: new Date().toISOString(),
          targetKeyword,
          contentHash
        };
        localStorage.setItem(storageKey, JSON.stringify(scoreData));
        console.log('Stored new score:', scoreData);
        
        // Set improvement information
        if (newScore.previousScore !== undefined) {
          setPreviousScore(newScore.previousScore);
          setScoreImprovement(newScore.improvement || null);
        }
        
      } else {
        console.error('Failed to calculate SEO score:', response.status);
      }
    } catch (error) {
      console.error('Failed to calculate SEO score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new debounced timer
    debounceTimerRef.current = setTimeout(() => {
      calculateSEOScore();
    }, 2000); // Increased debounce to 2 seconds

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, targetKeyword, lastUpdate, externalUpdate]); // Removed calculateSEOScore from dependencies

  const triggerUpdate = () => {
    setLastUpdate(Date.now());
  };

  // Debug function to clear stored scores (useful for testing)
  const clearStoredScores = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('seo_score_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('Cleared all stored SEO scores');
    triggerUpdate();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'needs-improvement':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'poor':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'needs-improvement':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6 h-[calc(100vh-180px)] overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5" />
        <h2 className="text-xl font-semibold">SEO Insights</h2>
        {process.env.NODE_ENV === 'development' && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={clearStoredScores}
            className="ml-auto text-xs"
          >
            Clear History
          </Button>
        )}
      </div>

      {/* Main Score */}
      <div className="text-center mb-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Analyzing content...</p>
            </motion.div>
          ) : seoScore ? (
            <motion.div
              key="score"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <DonutChart score={seoScore.overall} />
              <p className="text-gray-600 mt-2">Overall SEO Score</p>
              
              {/* Score Improvement Display */}
              {scoreImprovement && previousScore !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-2 rounded-lg text-center"
                  style={{
                    backgroundColor: scoreImprovement.includes('+') ? '#ecfdf5' : 
                                   scoreImprovement.includes('-') ? '#fef2f2' : '#f3f4f6',
                    color: scoreImprovement.includes('+') ? '#065f46' : 
                           scoreImprovement.includes('-') ? '#991b1b' : '#374151'
                  }}
                >
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="font-medium">
                      {scoreImprovement.includes('+') ? '📈' : 
                       scoreImprovement.includes('-') ? '📉' : '📊'}
                    </span>
                    <span>{scoreImprovement}</span>
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    Previous: {previousScore}/100
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-500"
            >
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <p>Waiting for content...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detailed Breakdown */}
      {seoScore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="font-semibold text-lg mb-4">Breakdown</h3>
          
          {Object.entries(seoScore.breakdown).map(([key, metric]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.score}/100
                </Badge>
              </div>
              <Progress value={metric.score} className="h-2" />
              
              {metric.details.length > 0 && (
                <div className="text-sm text-gray-600 ml-6">
                  <ul className="space-y-1">
                    {metric.details.slice(0, 2).map((detail: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Recommendations */}
      {seoScore && seoScore.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-blue-50 rounded-lg"
        >
          <h4 className="font-semibold mb-3 text-blue-900">Quick Wins</h4>
          <ul className="space-y-2">
            {seoScore.recommendations.slice(0, 3).map((recommendation, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Content Stats */}
      {content && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 grid grid-cols-2 gap-4 text-center"
        >
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {content.content.reduce((acc, block) => acc + block.content.split(' ').length, 0)}
            </div>
            <div className="text-xs text-gray-600">Words</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {content.content.filter(b => b.type === 'heading' || b.type === 'subheading').length}
            </div>
            <div className="text-xs text-gray-600">Headings</div>
          </div>
        </motion.div>
      )}

      {/* Export Buttons */}
      {onExport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 space-y-2"
        >
          <h4 className="font-semibold mb-3">Export</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => onExport('html')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Export as HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => onExport('markdown')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export as Markdown
            </Button>
          </div>
        </motion.div>
      )}

      {/* Update trigger for parent component */}
      <div style={{ display: 'none' }}></div>
    </Card>
  );
}