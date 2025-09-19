'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { SEOHighlight } from '@/lib/tiptap-extensions/seo-highlight';
import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2, Target, Lightbulb } from 'lucide-react';
import { ContentBlock, SEOAnalysis, SEOKeywordSuggestion } from '@/types/content';
import { RewriteResponse } from '@/types/content';

interface TipTapEditorProps {
  content: ContentBlock[];
  onContentChange: (blocks: ContentBlock[]) => void;
  onSEOUpdate?: () => void;
  url?: string;
  initialUrl?: string;
}

export default function TipTapEditor({ content, onContentChange, onSEOUpdate, url, initialUrl }: TipTapEditorProps) {
  console.log('TipTapEditor props:', { content, url, initialUrl });
  const [currentUrl, setCurrentUrl] = useState(initialUrl || url || '');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [targetKeyword, setTargetKeyword] = useState('');
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteOptions, setRewriteOptions] = useState({
    tone: 'professional' as const,
    length: 'same' as const
  });
  const [showRewriteButton, setShowRewriteButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);

  const loadContentFromUrl = async (urlToLoad: string) => {
    if (!urlToLoad.trim() || !editor) return;
    
    setIsLoadingContent(true);
    console.log('Loading content from URL:', urlToLoad);
    
    try {
      // Use the new fetch-page API that preserves HTML structure
      const response = await fetch('/api/fetch-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToLoad }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      console.log('Received data from API:', data);
      
      // Set the HTML content directly in the editor with client-side sanitization
      if (data.content) {
        // Additional client-side sanitization
        const sanitizedContent = DOMPurify.sanitize(data.content, {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'b', 'em', 'i', 'u',
            'ul', 'ol', 'li',
            'blockquote',
            'img', 'a',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'div', 'span'
          ],
          ALLOWED_ATTR: [
            'src', 'alt', 'href', 'class', 'id',
            'title', 'target', 'rel'
          ],
          KEEP_CONTENT: true
        });
        
        console.log('Setting sanitized content in editor:', sanitizedContent.substring(0, 500) + '...');
        
        // Clear editor first, then set new content
        editor.commands.clearContent();
        editor.commands.setContent(sanitizedContent, { emitUpdate: true });
        
        // Convert HTML back to ContentBlocks for SEO analysis
        const updatedBlocks = parseHTMLToBlocks(sanitizedContent);
        onContentChange(updatedBlocks);
        
        // Trigger onSEOUpdate if available
        if (onSEOUpdate) {
          onSEOUpdate();
        }
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Debug function to test HTML rendering
  const testHTMLRendering = () => {
    if (!editor) return;
    
    const testHTML = `
      <h1>Test Heading 1</h1>
      <h2>Test Heading 2</h2>
      <p>This is a test paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
      <img src="https://via.placeholder.com/400x200.png?text=Test+Image" alt="Test Image" />
      <p>Another paragraph after the image.</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
      <a href="https://example.com">Test link</a>
    `;
    
    console.log('Testing HTML rendering with:', testHTML);
    editor.commands.setContent(testHTML);
  };

  const contentToHTML = (blocks: ContentBlock[]) => {
    return blocks.map(block => {
      switch (block.type) {
        case 'heading':
          return `<h${block.level || 1} data-block-id="${block.id}">${block.content}</h${block.level || 1}>`;
        case 'subheading':
          return `<h${block.level || 2} data-block-id="${block.id}">${block.content}</h${block.level || 2}>`;
        case 'paragraph':
          return `<p data-block-id="${block.id}">${block.content}</p>`;
        case 'blockquote':
          return `<blockquote data-block-id="${block.id}">${block.content}</blockquote>`;
        case 'list':
          const items = block.content.split('\n').map(item => `<li>${item}</li>`).join('');
          return `<ul data-block-id="${block.id}">${items}</ul>`;
        default:
          return `<p data-block-id="${block.id}">${block.content}</p>`;
      }
    }).join('\n');
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Enable proper HTML parsing
        paragraph: {
          HTMLAttributes: {
            class: 'mb-4',
          },
        },
        heading: {
          HTMLAttributes: {
            class: 'font-bold mb-4',
          },
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 transition-colors',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm my-4',
        },
      }),
      SEOHighlight,
    ],
    content: contentToHTML(content), 
    immediatelyRender: false,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h5:text-base prose-h6:text-sm prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-sm prose-img:mx-auto prose-img:max-w-full prose-img:h-auto prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-blue-500 max-w-none focus:outline-none min-h-[500px] p-6 border rounded-lg bg-white [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-sm [&_img]:my-4 [&_img]:block',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('Editor updated with HTML:', html.substring(0, 200) + '...');
      const updatedBlocks = parseHTMLToBlocks(html);
      onContentChange(updatedBlocks);
      //only after rewrite
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      
      // Show rewrite button for any selected text (even single words)
      if (text && text.trim().length > 0) {
        setSelectedText(text);
        setShowRewriteButton(true);
        
        const coords = editor.view.coordsAtPos(from);
        setButtonPosition({
          x: coords.left,
          y: coords.top - 40
        });
      } else {
        setShowRewriteButton(false);
        setSelectedText('');
      }
    },
  });

  // Effect to handle content updates from ContentBlocks
  useEffect(() => {
    if (editor && content && content.length > 0) {
      // Update content if not currently loading from URL
      if (!isLoadingContent) {
        const htmlContent = contentToHTML(content);
        console.log('Updating content from ContentBlocks:', htmlContent.substring(0, 200) + '...');
        editor.commands.setContent(htmlContent);
      }
    }
  }, [content, editor, isLoadingContent]);

  // Effect to handle URL changes from parent component - this takes priority
  useEffect(() => {
    if (url && url.trim() && url.startsWith('http') && url !== currentUrl && editor) {
      console.log('URL changed from parent:', url);
      setCurrentUrl(url);
      loadContentFromUrl(url);
    }
  }, [url, currentUrl, editor]);

  // Effect for debounced URL loading from manual input
  useEffect(() => {
    if (currentUrl && currentUrl.trim() && currentUrl !== url && currentUrl.startsWith('http') && editor) {
      console.log('Debouncing URL input:', currentUrl);
      const timeoutId = setTimeout(() => {
        loadContentFromUrl(currentUrl);
      }, 1000); // Increased debounce to prevent excessive calls
      return () => clearTimeout(timeoutId);
    }
  }, [currentUrl, url, editor]);

  const analyzeSEOKeywords = async () => {
    if (!editor || !content.length) return;
    
    setIsAnalyzing(true);
    try {
      const contentText = content.map(block => block.content).join(' ');
      
      const response = await fetch('/api/seo-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentText,
          url: url,
          targetKeyword: targetKeyword
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze SEO keywords');
      }

      const analysis: SEOAnalysis = await response.json();
      setSeoAnalysis(analysis);
      highlightKeywords(analysis.keywords);
    } catch (error) {
      console.error('SEO analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const highlightKeywords = (keywords: SEOKeywordSuggestion[]) => {
    if (!editor) return;

    console.log('Highlighting keywords:', keywords);

    // First, clear ALL existing highlights
    editor.chain().focus().unsetSEOHighlight().run();

    // Add a small delay to ensure the unset operation completes
    setTimeout(() => {
      keywords.forEach((keywordData, index) => {
        const searchTerm = keywordData.word.toLowerCase().trim();
        const doc = editor.state.doc;
        
        // Search through the document text nodes
        doc.descendants((node, pos) => {
          if (node.isText && node.text) {
            const text = node.text.toLowerCase();
            let searchIndex = 0;
            
            while (true) {
              const foundIndex = text.indexOf(searchTerm, searchIndex);
              if (foundIndex === -1) break;
              
              // Check if it's a whole word (not part of another word)
              const beforeChar = foundIndex > 0 ? text[foundIndex - 1] : ' ';
              const afterChar = foundIndex + searchTerm.length < text.length ? text[foundIndex + searchTerm.length] : ' ';
              
              if (/\W/.test(beforeChar) && /\W/.test(afterChar)) {
                const from = pos + foundIndex;
                const to = pos + foundIndex + searchTerm.length;
                
                // Verify the positions are valid
                if (from >= 0 && to <= doc.content.size && from < to) {
                  editor.chain()
                    .focus()
                    .setTextSelection({ from, to })
                    .setSEOHighlight({
                      'data-improvement-id': `keyword-${index}-${foundIndex}`,
                      'data-improvement-type': 'keyword',
                      'data-suggestion': keywordData.suggestion,
                      'data-reason': keywordData.reason,
                      'data-original-word': keywordData.word,
                      'data-from': from.toString(),
                      'data-to': to.toString()
                    })
                    .run();
                }
              }
              
              searchIndex = foundIndex + 1;
            }
          }
          return true; // Continue traversing
        });
      });
      
      // Clear selection after highlighting
      editor.commands.setTextSelection(0);
      console.log('Keyword highlighting completed');
    }, 100);
  };

  const handleSEOHighlightClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('seo-highlight')) {
      const suggestion = target.getAttribute('data-suggestion');
      // const reason = target.getAttribute('data-reason'); // Currently unused
      const originalWord = target.getAttribute('data-original-word');
      const fromPos = target.getAttribute('data-from');
      const toPos = target.getAttribute('data-to');
      
      if (suggestion && originalWord && fromPos && toPos && editor) {
        const from = parseInt(fromPos);
        const to = parseInt(toPos);
        
        // Set precise selection to just the highlighted word
        editor.chain().focus().setTextSelection({ from, to }).run();
        
        // Set up rewrite dialog with just the selected word
        const selectedWord = editor.state.doc.textBetween(from, to);
        setSelectedText(selectedWord);
        setTargetKeyword(suggestion);
        setShowRewriteDialog(true);
      }
    }
  };

  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom;
      editorElement.addEventListener('click', handleSEOHighlightClick);
      
      return () => {
        editorElement.removeEventListener('click', handleSEOHighlightClick);
      };
    }
  }, [editor, handleSEOHighlightClick]);

  const parseHTMLToBlocks = (html: string): ContentBlock[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = doc.body.children;
    const blocks: ContentBlock[] = [];

    Array.from(elements).forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent || '';
      const blockId = element.getAttribute('data-block-id') || `block-${index}`;

      if (!text.trim()) return;

      let type: ContentBlock['type'];
      let level: number | undefined;

      switch (tagName) {
        case 'h1':
          type = 'heading';
          level = 1;
          break;
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          type = 'subheading';
          level = parseInt(tagName.charAt(1));
          break;
        case 'p':
          type = 'paragraph';
          break;
        case 'blockquote':
          type = 'blockquote';
          break;
        case 'ul':
        case 'ol':
          type = 'list';
          break;
        default:
          type = 'paragraph';
      }

      blocks.push({
        id: blockId,
        type,
        content: text,
        level,
        isEdited: true
      });
    });

    return blocks;
  };

  const handleRewrite = async () => {
    if (!selectedText || !editor) return;

    setIsRewriting(true);
    
    try {
      console.log('Starting rewrite for:', selectedText);
      console.log('Target keyword:', targetKeyword);
      
      const { from, to } = editor.state.selection;
      
      const response = await fetch('/api/ai-rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: selectedText,
          targetKeyword: targetKeyword || undefined,
          tone: 'professional',
          length: 'same'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rewrite content');
      }

      const result: RewriteResponse = await response.json();
      console.log('Rewrite result:', result);
      
      console.log('Replacing text from', from, 'to', to);
      
      // First, remove any SEO highlights in the selected range
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetSEOHighlight()
        .run();
      
      // Then replace the selected text with the rewritten version
      editor.chain()
        .focus()
        .insertContentAt({ from, to }, result.rewrittenText)
        .run();
      
      console.log('Text replaced successfully');
      
      setShowRewriteDialog(false);
      setShowRewriteButton(false);
      setTargetKeyword('');
      
      // Trigger SEO update immediately after rewrite to show updated score
      setTimeout(() => {
        console.log('Triggering immediate SEO update after rewrite');
        onSEOUpdate?.(); // Call directly for immediate update after rewrite
      }, 500);
      
    } catch (error) {
      console.error('Rewrite error:', error);
      alert(error instanceof Error ? error.message : 'Failed to rewrite content');
    } finally {
      setIsRewriting(false);
    }
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* URL Input for testing */}
      

      <div className="mb-4 space-y-4">    
        <div className="flex gap-2">
          <Button
            onClick={analyzeSEOKeywords}
            disabled={isAnalyzing || !content.length}
            className="flex items-center gap-2"
            variant="outline"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze SEO Keywords'}
          </Button>
          
          {seoAnalysis && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {seoAnalysis.keywords.length} keywords highlighted
            </Badge>
          )}
          
          {/* Debug button for testing HTML rendering */}
          {/* <Button
            onClick={testHTMLRendering}
            variant="outline"
            size="sm"
            className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
          >
            🧪 Test HTML
          </Button> */}
        </div>
      </div>

      {/* Floating Rewrite Button */}
      {showRewriteButton && (
        <Button
          onClick={() => setShowRewriteDialog(true)}
          className="fixed z-50 shadow-lg"
          style={{
            left: buttonPosition.x,
            top: buttonPosition.y,
          }}
          size="sm"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Rewrite with AI
        </Button>
      )}

      {/* Editor */}
      <div className="border rounded-lg min-h-[500px] focus-within:ring-2 focus-within:ring-blue-500">
        <EditorContent editor={editor} />
      </div>

      {/* Rewrite Dialog */}
      <Dialog open={showRewriteDialog} onOpenChange={setShowRewriteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Rewrite with AI
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Selected Text:</label>
              <div className="bg-gray-50 p-3 rounded border text-sm">
                &ldquo;{selectedText}&rdquo;
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Target className="w-4 h-4" />
                Target Keyword for SEO Optimization
              </label>
              <Input
                placeholder="Enter keyword to optimize for..."
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                className="focus:ring-2 focus:ring-green-500"
              />
              {targetKeyword && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ This text will be optimized for &ldquo;{targetKeyword}&rdquo;
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Badge variant="outline">Professional Tone</Badge>
              <Badge variant="outline">Same Length</Badge>
              <Badge variant="outline">SEO Optimized</Badge>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRewriteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRewrite} disabled={isRewriting}>
                {isRewriting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Rewriting...
                  </>
                ) : (
                  'Rewrite'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}