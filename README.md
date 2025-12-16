# File Converter Pro - Vercel Edition

A modern, beautiful web-based file converter tool. Optimized for Vercel deployment.

## Features

✨ **Beautiful UI** - Modern glassmorphism design with smooth animations  
📁 **Drag & Drop** - Simply drag your files onto the page  
👁️ **Data Preview** - See your data before converting  
🔄 **Multiple Formats** - CSV, Excel, JSON, HTML, Markdown, XML, TSV  
📊 **Column Selection** - Choose specific columns to export  
⚡ **Client-Side Processing** - Fast conversion in your browser  
🚀 **Vercel Ready** - Deploy for free in minutes

## Supported Formats

| Format | Extension | Read | Write |
|--------|-----------|------|-------|
| CSV | .csv | ✅ | ✅ |
| Excel | .xlsx | ✅ | ✅ |
| JSON | .json | ✅ | ✅ |
| HTML | .html | ✅ | ✅ |
| Markdown | .md | ❌ | ✅ |
| XML | .xml | ✅ | ✅ |
| TSV | .tsv | ✅ | ✅ |

> **Note**: Parquet and SQLite formats are not supported in browser-based JavaScript.

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open **http://localhost:3000** in your browser.

## 🚀 Deploy to Vercel (FREE)

### Option 1: One-Click Deploy

1. Push this folder to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up/login with GitHub
3. Click **Add New Project**
4. Import your GitHub repository
5. Click **Deploy** - Vercel auto-detects Next.js!

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Technology Stack

- **Framework**: Next.js 14 (React)
- **CSV Processing**: PapaParse
- **Excel Processing**: SheetJS (xlsx)
- **XML Processing**: fast-xml-parser
- **Styling**: Custom CSS with glassmorphism effects
- **Deployment**: Vercel (Serverless)

## Project Structure

```
FileConverter-Vercel/
├── app/
│   ├── page.js          # Main page component
│   ├── layout.js        # Root layout
│   └── globals.css      # Glassmorphism styles
├── lib/
│   └── converter.js     # File conversion logic
├── package.json
└── next.config.js
```

## License

MIT License
