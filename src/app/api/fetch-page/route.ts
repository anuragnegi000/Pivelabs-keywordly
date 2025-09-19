import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { Readability } from '@mozilla/readability';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    // Fetch webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Use JSDOM to parse and process HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Use Readability to extract main content
    const reader = new Readability(document);
    const article = reader.parse();
    
    if (!article || !article.content) {
      throw new Error('Could not extract readable content from the webpage');
    }
    
    // Create a new JSDOM instance for the article content
    const contentDom = new JSDOM(article.content);
    const contentDoc = contentDom.window.document;
    
    // Convert relative URLs to absolute URLs for images and links
    const baseUrl = new URL(url);
    
    // Fix image sources
    contentDoc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http')) {
        try {
          const absoluteUrl = new URL(src, baseUrl.origin).href;
          img.setAttribute('src', absoluteUrl);
        } catch (e) {
          // Remove broken images
          img.remove();
        }
      }
      // Add responsive classes
      img.setAttribute('class', 'max-w-full h-auto rounded-lg shadow-sm my-4');
    });
    
    // Fix link hrefs
    contentDoc.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        try {
          const absoluteUrl = new URL(href, baseUrl.origin).href;
          link.setAttribute('href', absoluteUrl);
        } catch (e) {
          // Remove href for broken links
          link.removeAttribute('href');
        }
      }
      // Add styling classes
      link.setAttribute('class', 'text-blue-600 underline hover:text-blue-800 transition-colors');
    });
    
    // Get the cleaned HTML content
    let cleanedHTML = contentDoc.body.innerHTML;
    
    // Server-side DOMPurify setup
    const createDOMPurify = DOMPurify(contentDom.window as any);
    
    // Sanitize the HTML content
    cleanedHTML = createDOMPurify.sanitize(cleanedHTML, {
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
    
    return NextResponse.json({
      title: article.title || 'Untitled',
      content: cleanedHTML,
      excerpt: article.excerpt || '',
      url: url
    });
    
  } catch (error) {
    console.error('Fetch page error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch page content';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}