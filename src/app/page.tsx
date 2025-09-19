'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Edit3, AlertCircle, X } from 'lucide-react';
import { ParsedContent, ContentBlock } from '@/types/content';
import TipTapEditor from '@/components/editor/TipTapEditor';
import SEOScorePanel from '@/components/seo/SEOScorePanel';
import LightRays from '@/components/ui/Lightbackground';
import { LiquidButton } from '@/components/ui/LiquidGlassButton';
import { PlaceholdersAndVanishInput } from '@/components/ui/Placeholder';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [content, setContent] = useState<ParsedContent | null>(null);
  const [error, setError] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [targetKeyword, setTargetKeyword] = useState('');
  const [seoUpdateTrigger, setSeoUpdateTrigger] = useState(0);

  // Auto-hide error toast after 5 seconds
  useEffect(() => {
    if (error) {
      setShowErrorToast(true);
      const timer = setTimeout(() => {
        setShowErrorToast(false);
        setTimeout(() => setError(''), 300); // Clear error after animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const hideErrorToast = () => {
    setShowErrorToast(false);
    setTimeout(() => setError(''), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a valid URL to get started');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL format (e.g., https://example.com)');
      return;
    }

    setIsLoading(true);
    setError('');
    setShowErrorToast(false);

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
      
      if (showEditor) {
        setSeoUpdateTrigger(prev => prev + 1);
      } else {
        setIsTransitioning(true);
        
        setTimeout(() => {
          setShowEditor(true);
          setIsTransitioning(false);
        }, 800);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content';
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setError('Unable to access the webpage. Please check the URL and your internet connection.');
      } else if (errorMessage.includes('404')) {
        setError('Page not found. Please verify the URL is correct.');
      } else if (errorMessage.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else if (errorMessage.includes('CORS')) {
        setError('Unable to access this webpage due to security restrictions.');
      } else {
        setError(errorMessage);
      }
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
      <AnimatePresence mode="wait">
        <motion.div
          key="editor"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="min-h-screen bg-gray-50"
        >
          {/* Slide-down container for smooth transition */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              ease: "easeInOut",
              staggerChildren: 0.1
            }}
            className="w-full"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Header with URL input */}
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="lg:col-span-3 mb-4"
              >
                <Card className="p-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <form onSubmit={handleSubmit} className="flex gap-4 items-center">
                    <Input
                      type="url"
                      placeholder="Enter webpage URL..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 border-gray-200 focus:border-blue-400 transition-colors"
                    />
                    <Input
                      placeholder="Target keyword (optional)"
                      value={targetKeyword}
                      onChange={(e) => setTargetKeyword(e.target.value)}
                      className="w-48 border-gray-200 focus:border-blue-400 transition-colors"
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="min-w-[120px] bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing...</span>
                        </div>
                      ) : (
                        'Analyze'
                      )}
                    </Button>
                  </form>
                </Card>
              </motion.div>

              {/* Editor - 2/3 width */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
                className="lg:col-span-2"
              >
                <Card className="p-6 h-[calc(100vh-180px)] shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="flex items-center gap-2 mb-4"
                  >
                    <Edit3 className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Content Editor</h2>
                    <div className="ml-auto text-sm text-gray-500">
                      Select text to rewrite with AI
                    </div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
                    className="h-full overflow-y-auto"
                  >
                    <TipTapEditor
                      content={content.content}
                      onContentChange={handleContentChange}
                      onSEOUpdate={() => {
                        console.log('=== onSEOUpdate called ===');
                        console.log('Current seoUpdateTrigger:', seoUpdateTrigger);
                        setSeoUpdateTrigger(prev => {
                          const newValue = prev + 1;
                          console.log('Setting new seoUpdateTrigger:', newValue);
                          return newValue;
                        });
                      }}
                      url={url}
                      initialUrl={url}
                    />
                  </motion.div>
                </Card>
              </motion.div>

              {/* SEO Panel - 1/3 width */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
                className="lg:col-span-1"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <SEOScorePanel
                    content={content}
                    targetKeyword={targetKeyword}
                    onExport={handleExport}
                    lastUpdate={seoUpdateTrigger}
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="landing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="min-h-screen relative bg-black overflow-hidden"
      >
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
                <div className="space-y-2 lg:space-y-2">
                  <div className="">
                    {/* <Globe className="w-6 lg:w-8 h-6 lg:h-8 text-cyan-600 flex-shrink-0 mx-auto lg:mx-0" /> */}
                    <PlaceholdersAndVanishInput
                      placeholders={[
                        "Paste your webpage URL here to get started...",
                        "Transform any webpage into SEO-optimized content",
                        "Enter URL to analyze and optimize with AI",
                        "Start your SEO journey with any webpage URL"
                      ]}
                      onChange={(e) => setUrl(e.target.value)}
                      onSubmit={handleSubmit}
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
                  
                  <LiquidButton 
                    onClick={handleSubmit} 
                    disabled={isLoading || isTransitioning}
                    className={`mt-16 border-gray-500 text-white absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                      isLoading || isTransitioning ? 'min-w-[300px]' : 'min-w-[240px]'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-3 px-2"
                        >
                          <Loader2 className="w-5 lg:w-6 h-5 lg:h-6 animate-spin" />
                          <span className="text-sm lg:text-base font-medium">Analyzing webpage...</span>
                        </motion.div>
                      ) : isTransitioning ? (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="flex items-center gap-3 px-2"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 15 }}
                            className="w-5 lg:w-6 h-5 lg:h-6 bg-green-500 rounded-full flex items-center justify-center"
                          >
                            <motion.svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: 0.2, duration: 0.3 }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </motion.svg>
                          </motion.div>
                          <span className="text-sm lg:text-base font-medium">Analysis complete!</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="start"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-3 px-2"
                        >
                          <Edit3 className="w-5 lg:w-6 h-5 lg:h-6" />
                          <span className="text-sm lg:text-base font-medium">Start AI Optimization</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </LiquidButton>
                </div>
              </Card>
            </motion.div>

            {/* Features Grid */}
            
          </motion.div>
        </div>
      </div>
      
      {/* Modern Error Toast */}
      <AnimatePresence>
        {error && showErrorToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md mx-auto backdrop-blur-sm">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 text-sm font-medium">
                {error}
              </div>
              <button
                onClick={hideErrorToast}
                className="flex-shrink-0 ml-2 hover:bg-red-600 rounded-full p-1 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}