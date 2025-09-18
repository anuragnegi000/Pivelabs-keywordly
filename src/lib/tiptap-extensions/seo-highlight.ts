import { Mark, mergeAttributes } from '@tiptap/core';

export interface SEOHighlightOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    seoHighlight: {
      setSEOHighlight: (attributes?: { 
        'data-improvement-id': string;
        'data-improvement-type': string;
        'data-suggestion': string;
        'data-reason'?: string;
        'data-original-word'?: string;
        'data-from'?: string;
        'data-to'?: string;
      }) => ReturnType;
      toggleSEOHighlight: (attributes?: { 
        'data-improvement-id': string;
        'data-improvement-type': string;
        'data-suggestion': string;
        'data-reason'?: string;
        'data-original-word'?: string;
        'data-from'?: string;
        'data-to'?: string;
      }) => ReturnType;
      unsetSEOHighlight: () => ReturnType;
    };
  }
}

export const SEOHighlight = Mark.create<SEOHighlightOptions>({
  name: 'seoHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      'data-improvement-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-improvement-id'),
        renderHTML: attributes => {
          if (!attributes['data-improvement-id']) {
            return {};
          }
          return {
            'data-improvement-id': attributes['data-improvement-id'],
          };
        },
      },
      'data-improvement-type': {
        default: null,
        parseHTML: element => element.getAttribute('data-improvement-type'),
        renderHTML: attributes => {
          if (!attributes['data-improvement-type']) {
            return {};
          }
          return {
            'data-improvement-type': attributes['data-improvement-type'],
          };
        },
      },
      'data-suggestion': {
        default: null,
        parseHTML: element => element.getAttribute('data-suggestion'),
        renderHTML: attributes => {
          if (!attributes['data-suggestion']) {
            return {};
          }
          return {
            'data-suggestion': attributes['data-suggestion'],
          };
        },
      },
      'data-reason': {
        default: null,
        parseHTML: element => element.getAttribute('data-reason'),
        renderHTML: attributes => {
          if (!attributes['data-reason']) {
            return {};
          }
          return {
            'data-reason': attributes['data-reason'],
          };
        },
      },
      'data-original-word': {
        default: null,
        parseHTML: element => element.getAttribute('data-original-word'),
        renderHTML: attributes => {
          if (!attributes['data-original-word']) {
            return {};
          }
          return {
            'data-original-word': attributes['data-original-word'],
          };
        },
      },
      'data-from': {
        default: null,
        parseHTML: element => element.getAttribute('data-from'),
        renderHTML: attributes => {
          if (!attributes['data-from']) {
            return {};
          }
          return {
            'data-from': attributes['data-from'],
          };
        },
      },
      'data-to': {
        default: null,
        parseHTML: element => element.getAttribute('data-to'),
        renderHTML: attributes => {
          if (!attributes['data-to']) {
            return {};
          }
          return {
            'data-to': attributes['data-to'],
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-improvement-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'seo-highlight',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setSEOHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleSEOHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetSEOHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});