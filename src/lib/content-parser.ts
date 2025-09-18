import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { ParsedContent, ContentBlock, ImageBlock } from '@/types/content';

export async function fetchWebpageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch webpage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function parseHTMLContent(html: string, url: string): ParsedContent {
  const dom = new JSDOM(html);
  const reader = new Readability(dom.window.document);
  console.log("The reader is here:-------",reader)
  const article = reader.parse();
  console.log('Readability article:', article);
  const $ = cheerio.load(html);
  
  const title = article?.title || $('title').text() || $('h1').first().text() || 'Untitled';
  const description = $('meta[name="description"]').attr('content') || 
                     $('meta[property="og:description"]').attr('content') || 
                     article?.excerpt || '';
  
  const author = $('meta[name="author"]').attr('content') || 
                $('meta[property="article:author"]').attr('content');
  
  const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                     $('meta[name="date"]').attr('content');

  const contentBlocks: ContentBlock[] = [];
  const images: ImageBlock[] = [];
  
  if (article?.content) {
    const content$ = cheerio.load(article.content);
    
    content$('h1, h2, h3, h4, h5, h6, p, blockquote, ul, ol').each((index, element) => {
      const $el = content$(element);
      const tagName = element.tagName.toLowerCase();
      const text = $el.text().trim();
      
      if (!text) return;
      
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
      
      contentBlocks.push({
        id: `block-${index}`,
        type,
        content: text,
        level,
        isEdited: false
      });
    });
    
    content$('img').each((index, element) => {
      const $img = content$(element);
      const src = $img.attr('src');
      const alt = $img.attr('alt') || '';
      
      if (src) {
        images.push({
          id: `image-${index}`,
          src: src.startsWith('http') ? src : new URL(src, url).href,
          alt,
          caption: $img.closest('figure').find('figcaption').text()
        });
      }
    });
  }
  
  return {
    title,
    description,
    author,
    publishDate,
    content: contentBlocks,
    originalUrl: url,
    images
  };
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function generateContentHTML(blocks: ContentBlock[]): string {
  return blocks.map(block => {
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
}