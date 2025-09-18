'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Globe, Edit3, TrendingUp } from 'lucide-react';
import { ParsedContent, ContentBlock } from '@/types/content';
import TipTapEditor from '@/components/editor/TipTapEditor';
import SEOScorePanel from '@/components/seo/SEOScorePanel';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [content, setContent] = useState<ParsedContent | null>(null);
  const [error, setError] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [seoUpdateTrigger, setSeoUpdateTrigger] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/fetch-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch content');
      }

      setContent(data.content);
      setShowEditor(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (blocks: ContentBlock[]) => {
    if (content) {
      setContent({ ...content, content: blocks });
    }
  };

  const handleExport = (format: 'html' | 'markdown') => {
    if (!content) return;

    const generateHTML = () => {
      return content.content.map(block => {
        switch (block.type) {
          case 'heading':
            return `<h${block.level || 1}>${block.content}</h${block.level || 1}>`;
          case 'subheading':
            return `<h${block.level || 2}>${block.content}</h${block.level || 2}>`;
          case 'paragraph':
            return `<p>${block.content}</p>`;
          case 'blockquote':
            return `<blockquote>${block.content}</blockquote>`;
          case 'list':
            return `<ul><li>${block.content.split('\n').join('</li><li>')}</li></ul>`;
          default:
            return `<p>${block.content}</p>`;
        }
      }).join('\n');
    };

    const generateMarkdown = () => {
      return content.content.map(block => {
        switch (block.type) {
          case 'heading':
            return `${'#'.repeat(block.level || 1)} ${block.content}`;
          case 'subheading':
            return `${'#'.repeat(block.level || 2)} ${block.content}`;
          case 'paragraph':
            return block.content;
          case 'blockquote':
            return `> ${block.content}`;
          case 'list':
            return block.content.split('\n').map(item => `- ${item}`).join('\n');
          default:
            return block.content;
        }
      }).join('\n\n');
    };

    const content_text = format === 'html' ? generateHTML() : generateMarkdown();
    const blob = new Blob([content_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-content.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (showEditor && content) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gray-50"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Header with URL input */}
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: -20 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-3 mb-4"
          >
            <Card className="p-4">
              <form onSubmit={handleSubmit} className="flex gap-4 items-center">
                <Globe className="w-5 h-5 text-gray-500" />
                <Input
                  type="url"
                  placeholder="Enter webpage URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Target keyword (optional)"
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                  className="w-48"
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Analyze'
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Editor - 2/3 width */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 h-[calc(100vh-180px)]">
              <div className="flex items-center gap-2 mb-4">
                <Edit3 className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Content Editor</h2>
                <div className="ml-auto text-sm text-gray-500">
                  Select text to rewrite with AI
                </div>
              </div>
              <div className="h-full overflow-y-auto">
                <TipTapEditor
                  content={content.content}
                  onContentChange={handleContentChange}
                  onSEOUpdate={() => {
                    setSeoUpdateTrigger(prev => prev + 1);
                  }}
                  url={url}
                />
              </div>
            </Card>
          </motion.div>

          {/* SEO Panel - 1/3 width */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-1"
          >
            <SEOScorePanel
              content={content}
              targetKeyword={targetKeyword}
              onExport={handleExport}
              lastUpdate={seoUpdateTrigger}
            />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl mx-auto"
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl font-bold text-gray-900 mb-6"
        >
          SEO AI Editor
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-gray-600 mb-12"
        >
          Transform any webpage into SEO-optimized content with AI-powered rewriting
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Card className="p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Globe className="w-6 h-6 text-gray-500" />
                <Input
                  type="url"
                  placeholder="Enter webpage URL to get started..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="border-0 bg-transparent text-lg placeholder:text-gray-400 focus:ring-0"
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-red-600 text-sm bg-red-50 p-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full text-lg py-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Analyzing webpage...
                  </>
                ) : (
                  'Start Optimizing'
                )}
              </Button>
            </form>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Fetch Content</h3>
            <p className="text-gray-600 text-sm">Extract and parse webpage content automatically</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit3 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">AI Rewrite</h3>
            <p className="text-gray-600 text-sm">Enhance content with AI-powered optimization</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">SEO Score</h3>
            <p className="text-gray-600 text-sm">Real-time SEO analysis and recommendations</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}