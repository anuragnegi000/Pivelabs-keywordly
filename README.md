# SEO AI Editor

Transform any webpage into SEO-optimized content with AI-powered r### **3. AI Rewrite**
- Select any text in the editor
- Click the "Rewrite with AI" button that appears
- Optionally add a target keyword for SEO optimization
- The AI will rewrite the text for better SEO and readability using Google Geminiing and real-time SEO scoring.

## 🚀 Features

- **Webpage Content Fetching**: Extract clean content from any URL
- **Interactive Rich Text Editor**: Built with TipTap for seamless editing
- **AI-Powered Rewriting**: Gemini API integration
- **Real-time SEO Analysis**: Dynamic scoring with detailed breakdown
- **Keyword Optimization**: Target specific keywords for better SEO
- **Export Functionality**: Export optimized content as HTML or Markdown
- **Beautiful UI**: Modern design with smooth animations using Framer Motion

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Rich Text Editor**: TipTap
- **Charts**: Recharts
- **Animations**: Framer Motion
- **AI Integration**: Google Gemini API (Free!)
- **Content Parsing**: Mozilla Readability + Cheerio

## 📋 Prerequisites

- Node.js 18+ and npm
- Google API account and API key (Free from Google AI Studio)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd seo-ai-editor
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Required: Google Gemini API Key (FREE!)
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**To get your Google API Key (FREE):**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy and paste it into your `.env.local` file

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🎯 How to Use

### 1. **Enter a URL**
- Paste any webpage URL in the input field
- Click "Start Optimizing" to fetch and parse the content

### 2. **Edit Content**
- Content will appear in the rich text editor
- All headings and paragraphs are editable
- Images are preserved but not editable

### 3. **AI Rewrite**
- Select any text in the editor
- Click the "Rewrite with AI" button that appears
- Optionally add a target keyword for SEO optimization
- The AI will rewrite the text for better SEO and readability

### 4. **Monitor SEO Score**
- Real-time SEO analysis appears in the right panel
- See breakdown by Content Quality, Keyword Optimization, Readability, etc.
- Get actionable recommendations for improvement

### 5. **Export Content**
- Export your optimized content as HTML or Markdown
- Use the export buttons in the SEO panel

## 🔧 Architecture

### API Endpoints

- `POST /api/fetch-content` - Fetches and parses webpage content
- `POST /api/ai-rewrite` - Rewrites text using Google Gemini
- `POST /api/seo-score` - Calculates SEO score and recommendations

### Key Components

- `TipTapEditor` - Rich text editor with AI integration
- `SEOScorePanel` - Real-time SEO analysis dashboard
- `DonutChart` - Visual SEO score representation

### SEO Analysis Features

- **Content Quality**: Word count, paragraph structure, sentence variety
- **Keyword Optimization**: Density, placement, prominence analysis
- **Readability**: Flesch reading score, sentence length analysis
- **Structure**: Heading hierarchy, meta data optimization
- **Real-time Updates**: Scores update as you edit content

## 🎨 Customization

### Modify AI Behavior

Edit `src/lib/ai-client.ts` to customize:
- Rewriting prompts
- Tone options
- Gemini model selection
- Response parsing

### Adjust SEO Scoring

Edit `src/lib/seo-analyzer.ts` to modify:
- Scoring algorithms
- Weight distributions
- Analysis criteria
- Recommendation logic

### Styling

The app uses Tailwind CSS and shadcn/ui components. Customize:
- Colors in `tailwind.config.js`
- Component styles in `src/components/ui/`
- Layout in page components

## 📊 SEO Scoring Algorithm

The SEO score (0-100) is calculated based on:

- **Content Quality (25%)**: Word count, paragraph length, sentence variety
- **Keyword Optimization (30%)**: Keyword density, placement in titles/headings
- **Readability (20%)**: Flesch reading score, sentence complexity
- **Structure (15%)**: Heading hierarchy, content organization
- **Meta Data (10%)**: Title length, description optimization

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

```bash
GOOGLE_API_KEY=your-production-google-api-key
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to fetch content"**
   - Check if the URL is accessible
   - Some sites block automated requests
   - Try different URLs for testing

2. **"Failed to rewrite content with AI"**
   - Verify your Google API key is correct
   - Check your Google AI Studio account
   - Ensure API key has proper permissions

3. **SEO score not updating**
   - Content changes trigger automatic updates
   - Check browser console for API errors
   - Verify content parsing is working

### Debug Mode

Add to `.env.local` for detailed logging:
```bash
NODE_ENV=development
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── fetch-content/   # Webpage fetching
│   │   ├── ai-rewrite/      # AI rewriting
│   │   └── seo-score/       # SEO analysis
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main application
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── editor/              # TipTap editor components
│   └── seo/                 # SEO analysis components
├── lib/
│   ├── utils.ts             # Utility functions
│   ├── content-parser.ts    # HTML content parsing
│   ├── seo-analyzer.ts      # SEO scoring algorithms
│   └── ai-client.ts         # Google Gemini integration
└── types/
    ├── content.ts           # Content type definitions
    └── seo.ts              # SEO type definitions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev) for free AI API
- [TipTap](https://tiptap.dev) for the rich text editor
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- [Mozilla Readability](https://github.com/mozilla/readability) for content extraction

