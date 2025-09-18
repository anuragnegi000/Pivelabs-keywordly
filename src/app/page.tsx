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
import LightRays from '@/components/ui/Lightbackground';
import RotatingText from '@/components/ui/RotatingText';

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
    <div className="min-h-screen relative bg-black overflow-hidden">
      {/* Light Background with Rays */}
      <div className="absolute inset-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#00ffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="w-full h-full"
        />
      </div>
      
      {/* Content over the light background */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-4 lg:mb-6"
          >
            {/* <h1>
              KEYWORDLY
            </h1>
            <RotatingText
              texts={['Keywordly', 'AI SEO', 'OPTIMIZER', 'EDITOR']}
              mainClassName="inline-flex px-3 sm:px-4 md:px-6 bg-blue-600 text-black font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl py-1 sm:py-2 md:py-3 justify-center rounded-lg shadow-lg"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            /> */}
          </motion.div>
            
            {/* <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg lg:text-2xl text-white/90 mb-8 lg:mb-12 drop-shadow-md px-4"
            >
              Transform any webpage into SEO-optimized content with AI-powered rewriting
            </motion.p> */}

            {/* Main URL Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-8 lg:mb-16 px-4"
            >
              <Card className="p-4  lg:p-8 shadow-2xl bg-transparent backdrop-blur-sm border-0 max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-2 lg:space-y-2">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 p-4 lg:p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-cyan-100">
                    {/* <Globe className="w-6 lg:w-8 h-6 lg:h-8 text-cyan-600 flex-shrink-0 mx-auto lg:mx-0" /> */}
                    <Input
                      type="url"
                      placeholder="Paste your webpage URL here to get started..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="border-0 bg-transparent text-base lg:text-xl placeholder:text-gray-500 focus:ring-0 font-medium"
                      disabled={isLoading}
                    />
                  </div>
                  
                  {/* Optional keyword input */}
                  {/* <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mx-auto lg:mx-0">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <Input
                      placeholder="Target keyword for SEO optimization (optional)"
                      value={targetKeyword}
                      onChange={(e) => setTargetKeyword(e.target.value)}
                      className="border-0 bg-transparent placeholder:text-gray-400 focus:ring-0"
                      disabled={isLoading}
                    />
                  </div> */}
                  
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-red-600 text-sm bg-red-50 p-3 lg:p-4 rounded-lg border border-red-200"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    size="sm"
                    className="w-1/2 text-md  lg:text-xl py-6 lg:py-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 lg:w-6 h-5 lg:h-6 animate-spin mr-2 lg:mr-3" />
                        Analyzing webpage...
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-5 lg:w-6 h-5 lg:h-6 mr-2 lg:mr-3" />
                        Start AI Optimization
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Features Grid */}
            
          </motion.div>
        </div>
      </div>
    </div>
  );
}