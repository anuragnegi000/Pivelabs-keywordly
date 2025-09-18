'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { SEOHighlight } from '@/lib/tiptap-extensions/seo-highlight';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2, Target, Lightbulb } from 'lucide-react';
import { ContentBlock, SEOAnalysis } from '@/types/content';
import { RewriteResponse } from '@/types/content';

interface TipTapEditorProps {
  content: ContentBlock[];
  onContentChange: (blocks: ContentBlock[]) => void;
  onSEOUpdate?: () => void;
  url?: string;
}

export default function TipTapEditor({ content, onContentChange, onSEOUpdate, url }: TipTapEditorProps) {
  const [selectedText, setSelectedText] = useState('');
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);
  const [targetKeyword, setTargetKeyword] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [showRewriteButton, setShowRewriteButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      SEOHighlight,
    ],
    content: contentToHTML(content),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const updatedBlocks = parseHTMLToBlocks(html);
      onContentChange(updatedBlocks);
      onSEOUpdate?.();
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      
      if (text && text.length > 5) {
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

  const highlightKeywords = (keywords: string[]) => {
    if (!editor) return;

    // First, clear any existing highlights
    editor.chain().focus().unsetSEOHighlight().run();

    keywords.forEach((keyword, index) => {
      const content = editor.getHTML();
      
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        // Find all instances of the keyword in the document
        const doc = editor.state.doc;
        const text = doc.textContent;
        let searchIndex = 0;
        
        while (true) {
          const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase(), searchIndex);
          if (keywordIndex === -1) break;
          
          const from = keywordIndex;
          const to = keywordIndex + keyword.length;
          
          editor.chain()
            .focus()
            .setTextSelection({ from, to })
            .setSEOHighlight({
              'data-improvement-id': `keyword-${index}`,
              'data-improvement-type': 'keyword',
              'data-suggestion': `Improve this "${keyword}" for better SEO`
            })
            .run();
            
          searchIndex = keywordIndex + keyword.length;
        }
      }
    });
  };

  const handleSEOHighlightClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('seo-highlight')) {
      const suggestion = target.getAttribute('data-suggestion');
      
      if (suggestion && editor) {
        // Get the text content of the highlighted element
        const highlightedText = target.textContent || '';
        
        // Find the position of this text in the editor
        const doc = editor.state.doc;
        const text = doc.textContent;
        const position = text.indexOf(highlightedText);
        
        if (position !== -1) {
          const from = position;
          const to = position + highlightedText.length;
          
          // Set selection to the highlighted text
          editor.chain().focus().setTextSelection({ from, to }).run();
          
          // Set up rewrite dialog
          setSelectedText(highlightedText);
          setTargetKeyword(''); // Let AI suggest improvements
          setShowRewriteDialog(true);
        }
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
  }, [editor]);

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
      
      const { from, to } = editor.state.selection;
      editor.chain().focus().insertContentAt({ from, to }, result.rewrittenText).run();
      
      setShowRewriteDialog(false);
      setShowRewriteButton(false);
      setTargetKeyword('');
      onSEOUpdate?.();
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
      {/* SEO Analysis Button */}
      <div className="mb-4 flex gap-2">
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
                "{selectedText}"
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Target className="w-4 h-4" />
                Target Keyword (optional)
              </label>
              <Input
                placeholder="Enter keyword to optimize for..."
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
              />
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