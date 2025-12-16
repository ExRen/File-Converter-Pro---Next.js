'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import ThemeToggle from '@/components/ThemeToggle';

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('qrcode');
  const [toast, setToast] = useState(null);
  
  // QR Code states
  const [qrText, setQrText] = useState('https://example.com');
  const [qrSize, setQrSize] = useState(300);
  const [qrColor, setQrColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrLogo, setQrLogo] = useState(null);
  const [qrLogoPreview, setQrLogoPreview] = useState(null);
  const [qrLogoSize, setQrLogoSize] = useState(20); // percentage
  const [qrResult, setQrResult] = useState(null);
  const [qrSvg, setQrSvg] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // JSON Formatter states
  const [jsonInput, setJsonInput] = useState('{"name":"John","age":30,"city":"New York"}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState(null);
  
  const logoInputRef = useRef(null);
  const canvasRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // QR Code Generator
  const generateQRCode = async () => {
    if (!qrText.trim()) {
      showToast('Masukkan teks atau URL', 'error');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = qrSize;
      canvas.height = qrSize;
      
      await QRCode.toCanvas(canvas, qrText, {
        width: qrSize,
        margin: 2,
        color: {
          dark: qrColor,
          light: qrBgColor
        },
        errorCorrectionLevel: 'H' // High error correction for logo support
      });
      
      const ctx = canvas.getContext('2d');
      
      // Add logo if provided
      if (qrLogo) {
        const logoImg = new Image();
        logoImg.src = qrLogoPreview;
        
        await new Promise((resolve) => {
          logoImg.onload = resolve;
        });
        
        const logoSizePixels = (qrSize * qrLogoSize) / 100;
        const logoX = (qrSize - logoSizePixels) / 2;
        const logoY = (qrSize - logoSizePixels) / 2;
        
        // Draw white background for logo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(logoX - 5, logoY - 5, logoSizePixels + 10, logoSizePixels + 10);
        
        // Draw logo
        ctx.drawImage(logoImg, logoX, logoY, logoSizePixels, logoSizePixels);
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      setQrResult(dataUrl);
      
      // Generate SVG version (without logo for clean SVG)
      const svgString = await QRCode.toString(qrText, {
        type: 'svg',
        width: qrSize,
        margin: 2,
        color: {
          dark: qrColor,
          light: qrBgColor
        }
      });
      setQrSvg(svgString);
      
      showToast('QR Code berhasil dibuat!');
    } catch (error) {
      console.error('QR generation error:', error);
      showToast('Gagal membuat QR code', 'error');
    }
    
    setIsGenerating(false);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setQrLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => setQrLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const downloadQR = () => {
    if (!qrResult) return;
    const a = document.createElement('a');
    a.href = qrResult;
    a.download = 'qrcode.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('PNG downloaded!');
  };

  const downloadQRSVG = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('SVG downloaded!');
  };

  // JSON Formatter
  const formatJSON = (beautify = true) => {
    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = beautify 
        ? JSON.stringify(parsed, null, 2)
        : JSON.stringify(parsed);
      setJsonOutput(formatted);
      setJsonError(null);
      showToast(beautify ? 'JSON beautified!' : 'JSON minified!');
    } catch (error) {
      setJsonError(error.message);
      showToast('Invalid JSON', 'error');
    }
  };

  const copyJSON = () => {
    if (jsonOutput) {
      navigator.clipboard.writeText(jsonOutput);
      showToast('Copied to clipboard!');
    }
  };

  const tools = [
    { id: 'qrcode', name: 'QR Code', icon: 'fa-qrcode', color: '#9b59b6' },
    { id: 'json', name: 'JSON', icon: 'fa-code', color: '#f39c12' },
    { id: 'base64', name: 'Base64', icon: 'fa-lock', color: '#3498db' },
    { id: 'sql', name: 'SQL', icon: 'fa-database', color: '#e74c3c' },
    { id: 'color', name: 'Color', icon: 'fa-palette', color: '#e91e63' },
    { id: 'lorem', name: 'Lorem', icon: 'fa-paragraph', color: '#00bcd4' },
    { id: 'password', name: 'Password', icon: 'fa-key', color: '#4caf50' },
    { id: 'markdown', name: 'Markdown', icon: 'fa-markdown', color: '#607d8b' },
    { id: 'units', name: 'Units', icon: 'fa-exchange-alt', color: '#ff5722' },
    { id: 'regex', name: 'Regex', icon: 'fa-asterisk', color: '#795548' },
    { id: 'hash', name: 'Hash', icon: 'fa-fingerprint', color: '#009688' },
    { id: 'textcase', name: 'Case', icon: 'fa-font', color: '#673ab7' },
    { id: 'timestamp', name: 'Time', icon: 'fa-clock', color: '#ff9800' },
    { id: 'wordcount', name: 'Counter', icon: 'fa-calculator', color: '#2196f3' },
    { id: 'urlcode', name: 'URL', icon: 'fa-link', color: '#8bc34a' },
  ];

  // Base64 states
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [base64Mode, setBase64Mode] = useState('encode');
  
  const processBase64 = () => {
    try {
      if (base64Mode === 'encode') {
        setBase64Output(btoa(base64Input));
      } else {
        setBase64Output(atob(base64Input));
      }
      showToast(`${base64Mode === 'encode' ? 'Encoded' : 'Decoded'} successfully!`);
    } catch (error) {
      showToast('Invalid input', 'error');
    }
  };

  // SQL Generator states
  const [sqlInput, setSqlInput] = useState('[\n  {"id": 1, "name": "John", "email": "john@example.com"},\n  {"id": 2, "name": "Jane", "email": "jane@example.com"}\n]');
  const [sqlOutput, setSqlOutput] = useState('');
  const [sqlTable, setSqlTable] = useState('users');
  const [sqlDialect, setSqlDialect] = useState('mysql');

  const generateSQL = () => {
    try {
      const data = JSON.parse(sqlInput);
      if (!Array.isArray(data) || data.length === 0) {
        showToast('Input should be a JSON array', 'error');
        return;
      }

      const columns = Object.keys(data[0]);
      let sql = '';

      // Generate CREATE TABLE
      sql += `-- Create table\nCREATE TABLE ${sqlTable} (\n`;
      sql += columns.map(col => `  ${col} VARCHAR(255)`).join(',\n');
      sql += '\n);\n\n';

      // Generate INSERT statements
      sql += `-- Insert data\n`;
      
      if (sqlDialect === 'mysql') {
        sql += `INSERT INTO ${sqlTable} (${columns.join(', ')}) VALUES\n`;
        sql += data.map(row => {
          const values = columns.map(col => {
            const val = row[col];
            return typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;
          });
          return `  (${values.join(', ')})`;
        }).join(',\n');
        sql += ';';
      } else {
        // Individual INSERTs for other dialects
        data.forEach(row => {
          const values = columns.map(col => {
            const val = row[col];
            return typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;
          });
          sql += `INSERT INTO ${sqlTable} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        });
      }

      setSqlOutput(sql);
      showToast(`Generated SQL for ${data.length} rows!`);
    } catch (error) {
      showToast('Invalid JSON input', 'error');
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(sqlOutput);
    showToast('SQL copied to clipboard!');
  };

  // Color Picker states
  const [pickerColor, setPickerColor] = useState('#6366f1');
  
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const copyColor = (format) => {
    const rgb = hexToRgb(pickerColor);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
    let text = pickerColor;
    
    if (format === 'rgb' && rgb) text = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    if (format === 'hsl' && hsl) text = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    
    navigator.clipboard.writeText(text);
    showToast(`Copied ${text}`);
  };

  // Lorem Ipsum states
  const [loremType, setLoremType] = useState('paragraphs');
  const [loremCount, setLoremCount] = useState(3);
  const [loremOutput, setLoremOutput] = useState('');

  const loremWords = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');

  const generateLorem = () => {
    const getWords = (count) => {
      let result = [];
      for (let i = 0; i < count; i++) {
        result.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
      }
      return result.join(' ');
    };

    const getSentence = () => {
      const words = getWords(8 + Math.floor(Math.random() * 12));
      return words.charAt(0).toUpperCase() + words.slice(1) + '.';
    };

    const getParagraph = () => {
      const sentences = [];
      for (let i = 0; i < 4 + Math.floor(Math.random() * 4); i++) {
        sentences.push(getSentence());
      }
      return sentences.join(' ');
    };

    let output = '';
    if (loremType === 'words') {
      output = getWords(loremCount);
    } else if (loremType === 'sentences') {
      const sentences = [];
      for (let i = 0; i < loremCount; i++) sentences.push(getSentence());
      output = sentences.join(' ');
    } else {
      const paragraphs = [];
      for (let i = 0; i < loremCount; i++) paragraphs.push(getParagraph());
      output = paragraphs.join('\n\n');
    }
    
    setLoremOutput(output);
    showToast(`Generated ${loremCount} ${loremType}!`);
  };

  // Password Generator states
  const [pwLength, setPwLength] = useState(16);
  const [pwUppercase, setPwUppercase] = useState(true);
  const [pwLowercase, setPwLowercase] = useState(true);
  const [pwNumbers, setPwNumbers] = useState(true);
  const [pwSymbols, setPwSymbols] = useState(true);
  const [pwOutput, setPwOutput] = useState('');

  const generatePassword = () => {
    let chars = '';
    if (pwLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (pwUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (pwNumbers) chars += '0123456789';
    if (pwSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      showToast('Select at least one character type', 'error');
      return;
    }

    let password = '';
    for (let i = 0; i < pwLength; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPwOutput(password);
    showToast('Password generated!');
  };

  const getPasswordStrength = () => {
    let score = 0;
    if (pwLength >= 12) score++;
    if (pwLength >= 16) score++;
    if (pwUppercase && pwLowercase) score++;
    if (pwNumbers) score++;
    if (pwSymbols) score++;
    
    if (score >= 4) return { text: 'Strong', color: '#4caf50' };
    if (score >= 3) return { text: 'Medium', color: '#f59e0b' };
    return { text: 'Weak', color: '#ef4444' };
  };

  // Markdown Preview states
  const [mdInput, setMdInput] = useState('# Hello World\n\nThis is **bold** and *italic* text.\n\n## Features\n- Item 1\n- Item 2\n- Item 3\n\n```javascript\nconsole.log("Hello!");\n```\n\n> Quote block\n\n[Link](https://example.com)');

  const parseMarkdown = (text) => {
    return text
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  };

  // Unit Converter states
  const [unitCategory, setUnitCategory] = useState('length');
  const [unitFrom, setUnitFrom] = useState('m');
  const [unitTo, setUnitTo] = useState('ft');
  const [unitValue, setUnitValue] = useState('1');
  const [unitResult, setUnitResult] = useState('');

  const unitCategories = {
    length: {
      name: 'Length',
      units: { m: 'Meters', ft: 'Feet', km: 'Kilometers', mi: 'Miles', cm: 'Centimeters', in: 'Inches' },
      toBase: { m: 1, ft: 0.3048, km: 1000, mi: 1609.34, cm: 0.01, in: 0.0254 }
    },
    weight: {
      name: 'Weight',
      units: { kg: 'Kilograms', lb: 'Pounds', g: 'Grams', oz: 'Ounces' },
      toBase: { kg: 1, lb: 0.453592, g: 0.001, oz: 0.0283495 }
    },
    temperature: {
      name: 'Temperature',
      units: { c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin' },
      special: true
    },
    data: {
      name: 'Data',
      units: { b: 'Bytes', kb: 'KB', mb: 'MB', gb: 'GB', tb: 'TB' },
      toBase: { b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776 }
    }
  };

  const convertUnit = () => {
    const val = parseFloat(unitValue);
    if (isNaN(val)) {
      showToast('Enter a valid number', 'error');
      return;
    }

    let result;
    const cat = unitCategories[unitCategory];

    if (unitCategory === 'temperature') {
      // Temperature requires special conversion
      if (unitFrom === unitTo) {
        result = val;
      } else if (unitFrom === 'c' && unitTo === 'f') {
        result = (val * 9/5) + 32;
      } else if (unitFrom === 'f' && unitTo === 'c') {
        result = (val - 32) * 5/9;
      } else if (unitFrom === 'c' && unitTo === 'k') {
        result = val + 273.15;
      } else if (unitFrom === 'k' && unitTo === 'c') {
        result = val - 273.15;
      } else if (unitFrom === 'f' && unitTo === 'k') {
        result = (val - 32) * 5/9 + 273.15;
      } else if (unitFrom === 'k' && unitTo === 'f') {
        result = (val - 273.15) * 9/5 + 32;
      }
    } else {
      // Standard conversion via base unit
      const baseValue = val * cat.toBase[unitFrom];
      result = baseValue / cat.toBase[unitTo];
    }

    setUnitResult(result.toFixed(6).replace(/\.?0+$/, ''));
    showToast('Converted!');
  };

  // Regex Tester states
  const [regexPattern, setRegexPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexText, setRegexText] = useState('Contact us at test@example.com or info@company.org');
  const [regexMatches, setRegexMatches] = useState([]);
  const [regexError, setRegexError] = useState(null);

  const testRegex = () => {
    try {
      const regex = new RegExp(regexPattern, regexFlags);
      const matches = [...regexText.matchAll(regex)];
      setRegexMatches(matches.map(m => ({ value: m[0], index: m.index })));
      setRegexError(null);
      showToast(`Found ${matches.length} match${matches.length !== 1 ? 'es' : ''}!`);
    } catch (error) {
      setRegexError(error.message);
      setRegexMatches([]);
      showToast('Invalid regex', 'error');
    }
  };

  const highlightMatches = () => {
    if (regexMatches.length === 0) return regexText;
    let result = regexText;
    let offset = 0;
    regexMatches.forEach(match => {
      const start = '<mark>';
      const end = '</mark>';
      result = result.slice(0, match.index + offset) + start + match.value + end + result.slice(match.index + offset + match.value.length);
      offset += start.length + end.length;
    });
    return result;
  };

  // Hash Generator states
  const [hashInput, setHashInput] = useState('Hello World');
  const [hashResults, setHashResults] = useState({});

  const generateHashes = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    
    const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
    const results = {};
    
    for (const algo of algorithms) {
      const hashBuffer = await crypto.subtle.digest(algo, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      results[algo] = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    setHashResults(results);
    showToast('Hashes generated!');
  };

  // Text Case Converter states
  const [caseInput, setCaseInput] = useState('Hello World, this is a sample text!');
  const [caseOutput, setCaseOutput] = useState('');

  const textCases = {
    upper: { name: 'UPPERCASE', fn: (t) => t.toUpperCase() },
    lower: { name: 'lowercase', fn: (t) => t.toLowerCase() },
    title: { name: 'Title Case', fn: (t) => t.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) },
    sentence: { name: 'Sentence case', fn: (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() },
    camel: { name: 'camelCase', fn: (t) => t.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase()) },
    snake: { name: 'snake_case', fn: (t) => t.toLowerCase().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') },
    kebab: { name: 'kebab-case', fn: (t) => t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') },
    reverse: { name: 'esreveR', fn: (t) => t.split('').reverse().join('') },
  };

  const convertCase = (caseType) => {
    setCaseOutput(textCases[caseType].fn(caseInput));
    showToast(`Converted to ${textCases[caseType].name}!`);
  };

  // Timestamp Converter states
  const [tsInput, setTsInput] = useState(Math.floor(Date.now() / 1000).toString());
  const [tsFormat, setTsFormat] = useState('seconds');
  const [tsOutput, setTsOutput] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const convertTimestamp = () => {
    let ms = parseInt(tsInput);
    if (tsFormat === 'seconds') ms *= 1000;
    
    const date = new Date(ms);
    if (isNaN(date.getTime())) {
      showToast('Invalid timestamp', 'error');
      return;
    }

    setTsOutput({
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      relative: getRelativeTime(date)
    });
    showToast('Timestamp converted!');
  };

  const getRelativeTime = (date) => {
    const diff = Date.now() - date.getTime();
    const abs = Math.abs(diff);
    const isFuture = diff < 0;
    
    if (abs < 60000) return isFuture ? 'in a few seconds' : 'just now';
    if (abs < 3600000) return `${Math.floor(abs / 60000)} minutes ${isFuture ? 'from now' : 'ago'}`;
    if (abs < 86400000) return `${Math.floor(abs / 3600000)} hours ${isFuture ? 'from now' : 'ago'}`;
    if (abs < 2592000000) return `${Math.floor(abs / 86400000)} days ${isFuture ? 'from now' : 'ago'}`;
    return date.toLocaleDateString();
  };

  // Word Counter states
  const [wcText, setWcText] = useState('');
  
  const getTextStats = (text) => {
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;
    const readingTime = Math.ceil(words / 200); // avg 200 wpm
    
    return { chars, charsNoSpace, words, sentences, paragraphs, readingTime };
  };

  // URL Encoder/Decoder states
  const [urlInput, setUrlInput] = useState('');
  const [urlOutput, setUrlOutput] = useState('');
  const [urlMode, setUrlMode] = useState('encode');

  const processUrl = () => {
    try {
      if (urlMode === 'encode') {
        setUrlOutput(encodeURIComponent(urlInput));
      } else {
        setUrlOutput(decodeURIComponent(urlInput));
      }
      showToast(`URL ${urlMode}d successfully!`);
    } catch (error) {
      showToast('Invalid input', 'error');
    }
  };

  return (
    <>
      <div className="bg-animation">
        <div className="floating-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </div>

      <header>
        <div className="logo">
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #9b59b6, #3498db)' }}>
            <i className="fas fa-tools"></i>
          </div>
          <span>Dev<span style={{ color: 'var(--secondary)' }}>Tools</span></span>
        </div>
        <nav className="nav-links">
          <Link href="/"><i className="fas fa-exchange-alt"></i> File Converter</Link>
          <Link href="/pdf-tools"><i className="fas fa-file-pdf"></i> PDF Tools</Link>
          <Link href="/image-converter"><i className="fas fa-images"></i> Image</Link>
          <Link href="/batch-converter"><i className="fas fa-layer-group"></i> Batch</Link>
          <Link href="/tools" className="active"><i className="fas fa-tools"></i> Tools</Link>
        </nav>
        <ThemeToggle />
      </header>

      <div className="container">
        <section className="hero">
          <h1>Developer Tools</h1>
          <p>QR Code Generator, JSON Formatter, Base64, dan utilitas lainnya</p>
        </section>

        {/* Tool Tabs */}
        <div className="tool-tabs">
          {tools.map(tool => (
            <button 
              key={tool.id}
              className={`tool-tab ${activeTab === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tool.id)}
              style={{ '--tab-color': tool.color }}
            >
              <i className={`fas ${tool.icon}`}></i>
              {tool.name}
            </button>
          ))}
        </div>

        {/* QR Code Generator */}
        {activeTab === 'qrcode' && (
          <div className="tool-panel">
            <div className="panel-grid">
              <div className="panel-left">
                <div className="input-group full">
                  <label>Text or URL</label>
                  <input 
                    type="text" 
                    value={qrText} 
                    onChange={(e) => setQrText(e.target.value)}
                    placeholder="Enter text or URL"
                  />
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Size (px)</label>
                    <input 
                      type="number" 
                      value={qrSize} 
                      onChange={(e) => setQrSize(parseInt(e.target.value) || 300)}
                      min="100" max="1000"
                    />
                  </div>
                  <div className="input-group">
                    <label>QR Color</label>
                    <input 
                      type="color" 
                      value={qrColor} 
                      onChange={(e) => setQrColor(e.target.value)}
                      style={{ width: '100%', height: '42px', cursor: 'pointer' }}
                    />
                  </div>
                  <div className="input-group">
                    <label>Background</label>
                    <input 
                      type="color" 
                      value={qrBgColor} 
                      onChange={(e) => setQrBgColor(e.target.value)}
                      style={{ width: '100%', height: '42px', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div className="logo-section">
                  <h4>Logo (Optional)</h4>
                  <div className="logo-upload" onClick={() => logoInputRef.current?.click()}>
                    {qrLogoPreview ? (
                      <img src={qrLogoPreview} alt="Logo" className="logo-preview" />
                    ) : (
                      <>
                        <i className="fas fa-image"></i>
                        <span>Click to upload logo</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={logoInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoUpload}
                    />
                  </div>
                  {qrLogo && (
                    <>
                      <div className="input-group" style={{ marginTop: '15px' }}>
                        <label>Logo Size: {qrLogoSize}%</label>
                        <input 
                          type="range" 
                          min="10" max="40" 
                          value={qrLogoSize}
                          onChange={(e) => setQrLogoSize(parseInt(e.target.value))}
                          className="slider"
                        />
                      </div>
                      <button className="remove-logo-btn" onClick={() => { setQrLogo(null); setQrLogoPreview(null); }}>
                        <i className="fas fa-times"></i> Remove Logo
                      </button>
                    </>
                  )}
                </div>

                <button className="convert-btn" onClick={generateQRCode} disabled={isGenerating}>
                  {isGenerating ? (
                    <><div className="spinner-small"></div>Generating...</>
                  ) : (
                    <><i className="fas fa-qrcode"></i> Generate QR Code</>
                  )}
                </button>
              </div>

              <div className="panel-right">
                <div className="qr-preview">
                  {qrResult ? (
                    <>
                      <img src={qrResult} alt="QR Code" />
                      <div className="button-group">
                        <button className="download-btn" onClick={downloadQR}>
                          <i className="fas fa-download"></i> PNG
                        </button>
                        <button className="download-btn svg" onClick={downloadQRSVG}>
                          <i className="fas fa-download"></i> SVG
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="qr-placeholder">
                      <i className="fas fa-qrcode"></i>
                      <p>QR Code akan muncul di sini</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JSON Formatter */}
        {activeTab === 'json' && (
          <div className="tool-panel">
            <div className="json-grid">
              <div className="json-input">
                <h4>Input JSON</h4>
                <textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your JSON here..."
                />
                {jsonError && <div className="json-error">{jsonError}</div>}
                <div className="button-group">
                  <button className="action-btn primary" onClick={() => formatJSON(true)}>
                    <i className="fas fa-indent"></i> Beautify
                  </button>
                  <button className="action-btn" onClick={() => formatJSON(false)}>
                    <i className="fas fa-compress"></i> Minify
                  </button>
                </div>
              </div>
              <div className="json-output">
                <h4>Output</h4>
                <textarea value={jsonOutput} readOnly placeholder="Formatted JSON will appear here..." />
                <button className="action-btn" onClick={copyJSON} disabled={!jsonOutput}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Base64 Encoder/Decoder */}
        {activeTab === 'base64' && (
          <div className="tool-panel">
            <div className="base64-toggle">
              <button className={base64Mode === 'encode' ? 'active' : ''} onClick={() => setBase64Mode('encode')}>
                Encode
              </button>
              <button className={base64Mode === 'decode' ? 'active' : ''} onClick={() => setBase64Mode('decode')}>
                Decode
              </button>
            </div>
            <div className="json-grid">
              <div className="json-input">
                <h4>Input</h4>
                <textarea 
                  value={base64Input}
                  onChange={(e) => setBase64Input(e.target.value)}
                  placeholder={base64Mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
                />
                <button className="action-btn primary" onClick={processBase64}>
                  <i className={`fas ${base64Mode === 'encode' ? 'fa-lock' : 'fa-unlock'}`}></i>
                  {base64Mode === 'encode' ? 'Encode' : 'Decode'}
                </button>
              </div>
              <div className="json-output">
                <h4>Output</h4>
                <textarea value={base64Output} readOnly />
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(base64Output); showToast('Copied!'); }}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SQL Generator */}
        {activeTab === 'sql' && (
          <div className="tool-panel">
            <div className="json-grid">
              <div className="json-input">
                <h4>JSON Input (Array of Objects)</h4>
                <div className="input-row" style={{ marginBottom: '15px' }}>
                  <div className="input-group">
                    <label>Table Name</label>
                    <input type="text" value={sqlTable} onChange={(e) => setSqlTable(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Dialect</label>
                    <select value={sqlDialect} onChange={(e) => setSqlDialect(e.target.value)}
                      style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text)' }}>
                      <option value="mysql">MySQL (Batch Insert)</option>
                      <option value="postgres">PostgreSQL</option>
                      <option value="sqlite">SQLite</option>
                    </select>
                  </div>
                </div>
                <textarea 
                  value={sqlInput}
                  onChange={(e) => setSqlInput(e.target.value)}
                  placeholder='[{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]'
                />
                <button className="action-btn primary" onClick={generateSQL} style={{ marginTop: '15px' }}>
                  <i className="fas fa-database"></i> Generate SQL
                </button>
              </div>
              <div className="json-output">
                <h4>SQL Output</h4>
                <textarea value={sqlOutput} readOnly placeholder="Generated SQL will appear here..." />
                <button className="action-btn" onClick={copySql} disabled={!sqlOutput} style={{ marginTop: '15px' }}>
                  <i className="fas fa-copy"></i> Copy SQL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Color Picker */}
        {activeTab === 'color' && (
          <div className="tool-panel">
            <div className="color-picker-layout">
              <div className="color-preview-large" style={{ backgroundColor: pickerColor }}>
                <span style={{ color: pickerColor.match(/^#[0-7]/) ? '#fff' : '#000' }}>{pickerColor}</span>
              </div>
              <div className="color-controls">
                <div className="input-group">
                  <label>Pick a Color</label>
                  <input type="color" value={pickerColor} onChange={(e) => setPickerColor(e.target.value)}
                    style={{ width: '100%', height: '60px', cursor: 'pointer', borderRadius: '12px' }} />
                </div>
                <div className="input-group">
                  <label>HEX</label>
                  <input type="text" value={pickerColor} onChange={(e) => setPickerColor(e.target.value)} />
                </div>
                <div className="color-formats">
                  <div className="format-row">
                    <span>RGB: {hexToRgb(pickerColor) ? `${hexToRgb(pickerColor).r}, ${hexToRgb(pickerColor).g}, ${hexToRgb(pickerColor).b}` : '-'}</span>
                    <button onClick={() => copyColor('rgb')}><i className="fas fa-copy"></i></button>
                  </div>
                  <div className="format-row">
                    <span>HSL: {hexToRgb(pickerColor) ? `${rgbToHsl(hexToRgb(pickerColor).r, hexToRgb(pickerColor).g, hexToRgb(pickerColor).b).h}°, ${rgbToHsl(hexToRgb(pickerColor).r, hexToRgb(pickerColor).g, hexToRgb(pickerColor).b).s}%, ${rgbToHsl(hexToRgb(pickerColor).r, hexToRgb(pickerColor).g, hexToRgb(pickerColor).b).l}%` : '-'}</span>
                    <button onClick={() => copyColor('hsl')}><i className="fas fa-copy"></i></button>
                  </div>
                  <div className="format-row">
                    <span>HEX: {pickerColor}</span>
                    <button onClick={() => copyColor('hex')}><i className="fas fa-copy"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lorem Ipsum Generator */}
        {activeTab === 'lorem' && (
          <div className="tool-panel">
            <div className="lorem-controls">
              <div className="input-row">
                <div className="input-group">
                  <label>Type</label>
                  <div className="button-group">
                    {['words', 'sentences', 'paragraphs'].map(type => (
                      <button key={type} className={`option-btn ${loremType === type ? 'active' : ''}`}
                        onClick={() => setLoremType(type)}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label>Count: {loremCount}</label>
                  <input type="range" min="1" max="10" value={loremCount}
                    onChange={(e) => setLoremCount(parseInt(e.target.value))} className="slider" />
                </div>
              </div>
              <button className="action-btn primary" onClick={generateLorem}>
                <i className="fas fa-paragraph"></i> Generate Lorem Ipsum
              </button>
            </div>
            {loremOutput && (
              <div className="lorem-output">
                <textarea value={loremOutput} readOnly />
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(loremOutput); showToast('Copied!'); }}>
                  <i className="fas fa-copy"></i> Copy Text
                </button>
              </div>
            )}
          </div>
        )}

        {/* Password Generator */}
        {activeTab === 'password' && (
          <div className="tool-panel">
            <div className="password-layout">
              <div className="password-output-box">
                {pwOutput ? (
                  <>
                    <span className="password-text">{pwOutput}</span>
                    <button onClick={() => { navigator.clipboard.writeText(pwOutput); showToast('Password copied!'); }}>
                      <i className="fas fa-copy"></i>
                    </button>
                  </>
                ) : (
                  <span className="password-placeholder">Click Generate to create password</span>
                )}
              </div>
              {pwOutput && (
                <div className="strength-bar">
                  <span style={{ color: getPasswordStrength().color }}>{getPasswordStrength().text}</span>
                  <div className="bar" style={{ backgroundColor: getPasswordStrength().color }}></div>
                </div>
              )}
              <div className="password-options">
                <div className="input-group">
                  <label>Length: {pwLength}</label>
                  <input type="range" min="8" max="32" value={pwLength}
                    onChange={(e) => setPwLength(parseInt(e.target.value))} className="slider" />
                </div>
                <div className="checkbox-grid">
                  <label className="checkbox-item">
                    <input type="checkbox" checked={pwLowercase} onChange={(e) => setPwLowercase(e.target.checked)} />
                    <span>Lowercase (a-z)</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" checked={pwUppercase} onChange={(e) => setPwUppercase(e.target.checked)} />
                    <span>Uppercase (A-Z)</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" checked={pwNumbers} onChange={(e) => setPwNumbers(e.target.checked)} />
                    <span>Numbers (0-9)</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" checked={pwSymbols} onChange={(e) => setPwSymbols(e.target.checked)} />
                    <span>Symbols (!@#$)</span>
                  </label>
                </div>
              </div>
              <button className="action-btn primary full" onClick={generatePassword}>
                <i className="fas fa-key"></i> Generate Password
              </button>
            </div>
          </div>
        )}

        {/* Markdown Preview */}
        {activeTab === 'markdown' && (
          <div className="tool-panel">
            <div className="markdown-grid">
              <div className="markdown-input">
                <h4>Markdown Input</h4>
                <textarea 
                  value={mdInput} 
                  onChange={(e) => setMdInput(e.target.value)}
                  placeholder="Write your markdown here..."
                />
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(mdInput); showToast('Copied!'); }}>
                  <i className="fas fa-copy"></i> Copy MD
                </button>
              </div>
              <div className="markdown-preview">
                <h4>Preview</h4>
                <div 
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: `<p>${parseMarkdown(mdInput)}</p>` }}
                />
                <button className="action-btn" onClick={() => { 
                  navigator.clipboard.writeText(parseMarkdown(mdInput)); 
                  showToast('HTML Copied!'); 
                }}>
                  <i className="fas fa-code"></i> Copy HTML
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unit Converter */}
        {activeTab === 'units' && (
          <div className="tool-panel">
            <div className="unit-converter">
              <div className="input-group">
                <label>Category</label>
                <div className="button-group">
                  {Object.entries(unitCategories).map(([key, cat]) => (
                    <button key={key} className={`option-btn ${unitCategory === key ? 'active' : ''}`}
                      onClick={() => { 
                        setUnitCategory(key); 
                        setUnitFrom(Object.keys(cat.units)[0]); 
                        setUnitTo(Object.keys(cat.units)[1]); 
                        setUnitResult('');
                      }}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="converter-row">
                <div className="input-group">
                  <label>Value</label>
                  <input type="number" value={unitValue} onChange={(e) => setUnitValue(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>From</label>
                  <select value={unitFrom} onChange={(e) => setUnitFrom(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text)' }}>
                    {Object.entries(unitCategories[unitCategory].units).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="swap-icon" onClick={() => { const temp = unitFrom; setUnitFrom(unitTo); setUnitTo(temp); }}>
                  <i className="fas fa-exchange-alt"></i>
                </div>
                <div className="input-group">
                  <label>To</label>
                  <select value={unitTo} onChange={(e) => setUnitTo(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text)' }}>
                    {Object.entries(unitCategories[unitCategory].units).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button className="action-btn primary full" onClick={convertUnit}>
                <i className="fas fa-calculator"></i> Convert
              </button>

              {unitResult && (
                <div className="result-box">
                  <span className="result-value">{unitValue} {unitCategories[unitCategory].units[unitFrom]}</span>
                  <span className="result-equals">=</span>
                  <span className="result-value highlight">{unitResult} {unitCategories[unitCategory].units[unitTo]}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regex Tester */}
        {activeTab === 'regex' && (
          <div className="tool-panel">
            <div className="regex-layout">
              <div className="input-row">
                <div className="input-group" style={{ flex: 2 }}>
                  <label>Pattern</label>
                  <input type="text" value={regexPattern} onChange={(e) => setRegexPattern(e.target.value)} 
                    placeholder="Enter regex pattern..." />
                </div>
                <div className="input-group" style={{ flex: 0.5 }}>
                  <label>Flags</label>
                  <input type="text" value={regexFlags} onChange={(e) => setRegexFlags(e.target.value)}
                    placeholder="gi" />
                </div>
              </div>
              {regexError && <div className="regex-error">{regexError}</div>}
              
              <div className="input-group">
                <label>Test String</label>
                <textarea value={regexText} onChange={(e) => setRegexText(e.target.value)}
                  placeholder="Enter text to test against..." />
              </div>

              <button className="action-btn primary full" onClick={testRegex}>
                <i className="fas fa-search"></i> Test Regex
              </button>

              {regexMatches.length > 0 && (
                <div className="regex-results">
                  <h4>Matches ({regexMatches.length})</h4>
                  <div className="highlighted-text" dangerouslySetInnerHTML={{ __html: highlightMatches() }} />
                  <div className="matches-list">
                    {regexMatches.map((m, i) => (
                      <span key={i} className="match-badge">{m.value}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hash Generator */}
        {activeTab === 'hash' && (
          <div className="tool-panel">
            <div className="hash-layout">
              <div className="input-group full">
                <label>Input Text</label>
                <textarea value={hashInput} onChange={(e) => setHashInput(e.target.value)}
                  placeholder="Enter text to hash..." />
              </div>

              <button className="action-btn primary full" onClick={generateHashes}>
                <i className="fas fa-fingerprint"></i> Generate Hashes
              </button>

              {Object.keys(hashResults).length > 0 && (
                <div className="hash-results">
                  {Object.entries(hashResults).map(([algo, hash]) => (
                    <div key={algo} className="hash-row">
                      <span className="hash-label">{algo}</span>
                      <span className="hash-value">{hash}</span>
                      <button onClick={() => { navigator.clipboard.writeText(hash); showToast(`${algo} copied!`); }}>
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Case Converter */}
        {activeTab === 'textcase' && (
          <div className="tool-panel">
            <div className="textcase-layout">
              <div className="input-group">
                <label>Input Text</label>
                <textarea value={caseInput} onChange={(e) => setCaseInput(e.target.value)}
                  placeholder="Enter text to convert..." />
              </div>

              <div className="case-buttons">
                {Object.entries(textCases).map(([key, val]) => (
                  <button key={key} className="case-btn" onClick={() => convertCase(key)}>
                    {val.name}
                  </button>
                ))}
              </div>

              {caseOutput && (
                <div className="case-output">
                  <h4>Result</h4>
                  <div className="output-box">{caseOutput}</div>
                  <button className="action-btn" onClick={() => { navigator.clipboard.writeText(caseOutput); showToast('Copied!'); }}>
                    <i className="fas fa-copy"></i> Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamp Converter */}
        {activeTab === 'timestamp' && (
          <div className="tool-panel">
            <div className="timestamp-layout">
              <div className="current-time-box">
                <span className="label">Current Time</span>
                <span className="time">{currentTime.toLocaleString()}</span>
                <span className="epoch">Epoch: {Math.floor(currentTime.getTime() / 1000)}</span>
              </div>

              <div className="input-row">
                <div className="input-group" style={{ flex: 2 }}>
                  <label>Timestamp</label>
                  <input type="text" value={tsInput} onChange={(e) => setTsInput(e.target.value)} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Format</label>
                  <div className="button-group">
                    <button className={`option-btn ${tsFormat === 'seconds' ? 'active' : ''}`}
                      onClick={() => setTsFormat('seconds')}>Seconds</button>
                    <button className={`option-btn ${tsFormat === 'ms' ? 'active' : ''}`}
                      onClick={() => setTsFormat('ms')}>Milliseconds</button>
                  </div>
                </div>
              </div>

              <button className="action-btn primary full" onClick={convertTimestamp}>
                <i className="fas fa-clock"></i> Convert Timestamp
              </button>

              {Object.keys(tsOutput).length > 0 && (
                <div className="timestamp-results">
                  {Object.entries(tsOutput).map(([key, val]) => (
                    <div key={key} className="ts-row">
                      <span className="ts-label">{key.toUpperCase()}</span>
                      <span className="ts-value">{val}</span>
                      <button onClick={() => { navigator.clipboard.writeText(val); showToast('Copied!'); }}>
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Word Counter */}
        {activeTab === 'wordcount' && (
          <div className="tool-panel">
            <div className="wordcount-layout">
              <div className="input-group">
                <label>Enter your text</label>
                <textarea value={wcText} onChange={(e) => setWcText(e.target.value)}
                  placeholder="Start typing or paste your text here..." />
              </div>

              <div className="stats-grid">
                <div className="stat-box">
                  <span className="stat-value">{getTextStats(wcText).chars}</span>
                  <span className="stat-label">Characters</span>
                </div>
                <div className="stat-box">
                  <span className="stat-value">{getTextStats(wcText).charsNoSpace}</span>
                  <span className="stat-label">No Spaces</span>
                </div>
                <div className="stat-box">
                  <span className="stat-value">{getTextStats(wcText).words}</span>
                  <span className="stat-label">Words</span>
                </div>
                <div className="stat-box">
                  <span className="stat-value">{getTextStats(wcText).sentences}</span>
                  <span className="stat-label">Sentences</span>
                </div>
                <div className="stat-box">
                  <span className="stat-value">{getTextStats(wcText).paragraphs}</span>
                  <span className="stat-label">Paragraphs</span>
                </div>
                <div className="stat-box">
                  <span className="stat-value">{getTextStats(wcText).readingTime}</span>
                  <span className="stat-label">Min Read</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* URL Encoder/Decoder */}
        {activeTab === 'urlcode' && (
          <div className="tool-panel">
            <div className="mode-toggle" style={{ marginBottom: '20px' }}>
              <button className={`option-btn ${urlMode === 'encode' ? 'active' : ''}`}
                onClick={() => setUrlMode('encode')}>
                <i className="fas fa-lock"></i> Encode
              </button>
              <button className={`option-btn ${urlMode === 'decode' ? 'active' : ''}`}
                onClick={() => setUrlMode('decode')}>
                <i className="fas fa-unlock"></i> Decode
              </button>
            </div>
            <div className="json-grid">
              <div className="json-input">
                <h4>Input</h4>
                <textarea value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={urlMode === 'encode' ? 'Enter URL or text to encode...' : 'Enter encoded URL to decode...'} />
                <button className="action-btn primary" onClick={processUrl}>
                  <i className={`fas ${urlMode === 'encode' ? 'fa-lock' : 'fa-unlock'}`}></i>
                  {urlMode === 'encode' ? 'Encode' : 'Decode'}
                </button>
              </div>
              <div className="json-output">
                <h4>Output</h4>
                <textarea value={urlOutput} readOnly />
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(urlOutput); showToast('Copied!'); }}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer>
        <p>Made with <span style={{ color: 'var(--secondary)' }}>❤</span> by FileConverter Pro</p>
      </footer>

      {toast && (
        <div className={`toast show ${toast.type}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <style jsx>{`
        .tool-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 25px;
        }
        
        .tool-tab {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s ease;
        }
        
        .tool-tab:hover, .tool-tab.active {
          background: var(--tab-color);
          border-color: var(--tab-color);
        }
        
        .tool-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 30px;
        }
        
        .panel-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        
        @media (max-width: 768px) {
          .panel-grid, .json-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .input-group {
          margin-bottom: 15px;
        }
        
        .input-group.full {
          width: 100%;
        }
        
        .input-group label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        
        .input-group input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          color: var(--text);
          font-size: 14px;
        }
        
        .input-group input:focus {
          outline: none;
          border-color: var(--primary);
        }
        
        .input-row {
          display: flex;
          gap: 15px;
        }
        
        .input-row .input-group {
          flex: 1;
        }
        
        .logo-section h4 {
          font-size: 14px;
          margin-bottom: 12px;
        }
        
        .logo-upload {
          background: rgba(255,255,255,0.03);
          border: 2px dashed var(--glass-border);
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .logo-upload:hover {
          border-color: var(--primary);
        }
        
        .logo-upload i {
          font-size: 32px;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        
        .logo-upload span {
          display: block;
          color: var(--text-muted);
          font-size: 13px;
        }
        
        .logo-preview {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 8px;
        }
        
        .remove-logo-btn {
          background: transparent;
          border: 1px solid var(--danger);
          color: var(--danger);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.3s ease;
        }
        
        .remove-logo-btn:hover {
          background: var(--danger);
          color: white;
        }
        
        .slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
          outline: none;
          -webkit-appearance: none;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
        }
        
        .qr-preview {
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 350px;
        }
        
        .qr-preview img {
          max-width: 100%;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .qr-placeholder {
          text-align: center;
          color: var(--text-muted);
        }
        
        .qr-placeholder i {
          font-size: 64px;
          margin-bottom: 15px;
          opacity: 0.3;
        }
        
        .json-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .json-input, .json-output {
          display: flex;
          flex-direction: column;
        }
        
        .json-input h4, .json-output h4 {
          font-size: 14px;
          margin-bottom: 12px;
        }
        
        .json-input textarea, .json-output textarea {
          flex: 1;
          min-height: 250px;
          padding: 15px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          color: var(--text);
          font-family: 'Fira Code', monospace;
          font-size: 13px;
          resize: vertical;
        }
        
        .json-input textarea:focus, .json-output textarea:focus {
          outline: none;
          border-color: var(--primary);
        }
        
        .json-error {
          color: var(--danger);
          font-size: 12px;
          margin-top: 8px;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        
        .action-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        
        .action-btn:hover {
          border-color: var(--primary);
        }
        
        .action-btn.primary {
          background: var(--primary);
          border-color: var(--primary);
        }
        
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .base64-toggle {
          display: flex;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 5px;
          margin-bottom: 20px;
          width: fit-content;
        }
        
        .base64-toggle button {
          background: transparent;
          border: none;
          color: var(--text);
          padding: 10px 25px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .base64-toggle button.active {
          background: var(--primary);
        }
        
        .coming-soon {
          text-align: center;
          padding: 60px;
        }
        
        .coming-soon i {
          font-size: 64px;
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        
        .coming-soon h3 {
          font-size: 24px;
          margin-bottom: 10px;
        }
        
        .coming-soon p {
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        
        .coming-soon .badge {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
        }
        
        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .nav-links a.active {
          color: var(--primary-light);
        }

        /* Color Picker */
        .color-picker-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .color-preview-large {
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          min-height: 200px;
        }

        .color-formats {
          margin-top: 20px;
        }

        .format-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--glass-border);
        }

        .format-row button {
          background: transparent;
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .format-row button:hover {
          background: var(--primary);
          border-color: var(--primary);
        }

        /* Lorem Ipsum */
        .lorem-controls {
          margin-bottom: 20px;
        }

        .lorem-output {
          margin-top: 20px;
        }

        .lorem-output textarea {
          width: 100%;
          min-height: 200px;
          padding: 15px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--text);
          font-family: inherit;
          resize: vertical;
          margin-bottom: 15px;
        }

        .option-btn.active {
          background: var(--primary);
          border-color: var(--primary);
        }

        /* Password Generator */
        .password-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .password-output-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .password-text {
          font-family: 'Fira Code', monospace;
          font-size: 18px;
          word-break: break-all;
        }

        .password-placeholder {
          color: var(--text-muted);
        }

        .password-output-box button {
          background: var(--primary);
          border: none;
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          margin-left: 15px;
        }

        .strength-bar {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .strength-bar .bar {
          flex: 1;
          height: 8px;
          border-radius: 4px;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .checkbox-item input {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
        }

        .action-btn.full {
          width: 100%;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .color-picker-layout {
            grid-template-columns: 1fr;
          }
          .checkbox-grid {
            grid-template-columns: 1fr;
          }
          .markdown-grid {
            grid-template-columns: 1fr;
          }
          .converter-row {
            grid-template-columns: 1fr;
          }
        }

        /* Markdown Preview */
        .markdown-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .markdown-input textarea, .markdown-preview .preview-content {
          width: 100%;
          min-height: 300px;
          padding: 15px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--text);
          font-family: inherit;
          margin-bottom: 15px;
        }

        .markdown-input textarea {
          resize: vertical;
        }

        .preview-content {
          overflow: auto;
          line-height: 1.6;
        }

        .preview-content h1 { font-size: 24px; margin: 15px 0; }
        .preview-content h2 { font-size: 20px; margin: 12px 0; color: var(--primary-light); }
        .preview-content h3 { font-size: 16px; margin: 10px 0; }
        .preview-content code { background: rgba(99,102,241,0.2); padding: 2px 6px; border-radius: 4px; }
        .preview-content pre { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; overflow-x: auto; }
        .preview-content blockquote { border-left: 3px solid var(--primary); padding-left: 15px; color: var(--text-muted); }
        .preview-content ul { padding-left: 25px; }
        .preview-content a { color: var(--primary-light); }

        /* Unit Converter */
        .converter-row {
          display: grid;
          grid-template-columns: 1fr 1fr auto 1fr;
          gap: 15px;
          align-items: end;
          margin: 20px 0;
        }

        .swap-icon {
          width: 44px;
          height: 44px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .swap-icon:hover {
          background: var(--primary);
          border-color: var(--primary);
        }

        .result-box {
          background: rgba(99,102,241,0.1);
          border: 1px solid var(--primary);
          border-radius: 16px;
          padding: 25px;
          text-align: center;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .result-value {
          font-size: 20px;
          font-weight: 600;
        }

        .result-value.highlight {
          color: var(--primary-light);
          font-size: 24px;
        }

        .result-equals {
          color: var(--text-muted);
        }

        /* Regex Tester */
        .regex-layout textarea {
          width: 100%;
          min-height: 100px;
          padding: 15px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--text);
          font-family: inherit;
          margin-bottom: 15px;
        }

        .regex-error {
          background: rgba(239,68,68,0.2);
          border: 1px solid #ef4444;
          padding: 10px 15px;
          border-radius: 8px;
          color: #ef4444;
          margin-bottom: 15px;
        }

        .regex-results {
          margin-top: 20px;
        }

        .highlighted-text {
          background: rgba(255,255,255,0.03);
          padding: 15px;
          border-radius: 12px;
          line-height: 1.8;
          margin: 15px 0;
        }

        .highlighted-text mark {
          background: rgba(99,102,241,0.4);
          color: white;
          padding: 2px 4px;
          border-radius: 4px;
        }

        .matches-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .match-badge {
          background: var(--primary);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
        }

        /* Hash Generator */
        .hash-layout textarea {
          width: 100%;
          min-height: 80px;
          padding: 15px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--text);
          margin-bottom: 15px;
        }

        .hash-results {
          margin-top: 20px;
        }

        .hash-row {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          margin-bottom: 10px;
        }

        .hash-label {
          background: var(--primary);
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          min-width: 70px;
          text-align: center;
        }

        .hash-value {
          flex: 1;
          font-family: 'Fira Code', monospace;
          font-size: 11px;
          word-break: break-all;
          color: var(--text-muted);
        }

        .hash-row button {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .hash-row button:hover {
          background: var(--primary);
          border-color: var(--primary);
        }

        /* Text Case Converter */
        .textcase-layout textarea {
          width: 100%;
          min-height: 100px;
          padding: 15px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--text);
          margin-bottom: 15px;
        }

        .case-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }

        .case-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .case-btn:hover {
          background: var(--primary);
          border-color: var(--primary);
        }

        .output-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 15px;
          margin: 15px 0;
          word-break: break-word;
        }

        /* Timestamp Converter */
        .current-time-box {
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2));
          border: 1px solid var(--primary);
          border-radius: 16px;
          padding: 25px;
          text-align: center;
          margin-bottom: 25px;
        }

        .current-time-box .label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 5px;
        }

        .current-time-box .time {
          display: block;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .current-time-box .epoch {
          display: block;
          font-family: 'Fira Code', monospace;
          font-size: 14px;
          color: var(--primary-light);
        }

        .timestamp-results {
          margin-top: 20px;
        }

        .ts-row {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          margin-bottom: 10px;
        }

        .ts-label {
          background: var(--primary);
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          min-width: 70px;
          text-align: center;
        }

        .ts-value {
          flex: 1;
          font-size: 13px;
          word-break: break-all;
        }

        .ts-row button {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .ts-row button:hover {
          background: var(--primary);
          border-color: var(--primary);
        }

        /* Word Counter */
        .wordcount-layout textarea {
          width: 100%;
          min-height: 150px;
          padding: 15px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--text);
          margin-bottom: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .stat-box {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: var(--primary-light);
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 5px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
}
