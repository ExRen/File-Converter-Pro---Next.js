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
    { id: 'diff', name: 'Diff', icon: 'fa-columns', color: '#ff4081' },
    { id: 'minify', name: 'Minify', icon: 'fa-compress', color: '#00acc1' },
    { id: 'basenum', name: 'Base', icon: 'fa-hashtag', color: '#7c4dff' },
    { id: 'ascii', name: 'ASCII', icon: 'fa-text-width', color: '#ffc107' },
    { id: 'uuid', name: 'UUID', icon: 'fa-id-badge', color: '#e040fb' },
    { id: 'cron', name: 'Cron', icon: 'fa-calendar-alt', color: '#00e676' },
    { id: 'htmlent', name: 'HTML', icon: 'fa-code', color: '#ff6e40' },
    { id: 'slug', name: 'Slug', icon: 'fa-link', color: '#64ffda' },
    { id: 'jwt', name: 'JWT', icon: 'fa-user-shield', color: '#536dfe' },
    { id: 'escape', name: 'Escape', icon: 'fa-shield-alt', color: '#ffab40' },
    { id: 'jsoncsv', name: 'CSV', icon: 'fa-table', color: '#69f0ae' },
    { id: 'lipsum', name: 'Image', icon: 'fa-image', color: '#ff80ab' },
    { id: 'device', name: 'Device', icon: 'fa-mobile-alt', color: '#7e57c2' },
    { id: 'keycode', name: 'Key', icon: 'fa-keyboard', color: '#26a69a' },
    { id: 'meta', name: 'Meta', icon: 'fa-tags', color: '#ff7043' },
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

  // Diff Viewer states
  const [diffText1, setDiffText1] = useState('Hello World\nThis is line 2\nLine 3 here');
  const [diffText2, setDiffText2] = useState('Hello World\nThis is line 2 modified\nLine 3 here\nNew line 4');
  const [diffResult, setDiffResult] = useState([]);

  const compareDiff = () => {
    const lines1 = diffText1.split('\n');
    const lines2 = diffText2.split('\n');
    const maxLen = Math.max(lines1.length, lines2.length);
    const result = [];

    for (let i = 0; i < maxLen; i++) {
      const l1 = lines1[i] || '';
      const l2 = lines2[i] || '';
      if (l1 === l2) {
        result.push({ type: 'same', line1: l1, line2: l2 });
      } else if (!l1) {
        result.push({ type: 'added', line1: '', line2: l2 });
      } else if (!l2) {
        result.push({ type: 'removed', line1: l1, line2: '' });
      } else {
        result.push({ type: 'changed', line1: l1, line2: l2 });
      }
    }
    setDiffResult(result);
    showToast('Comparison complete!');
  };

  // Minify states
  const [minifyInput, setMinifyInput] = useState('');
  const [minifyOutput, setMinifyOutput] = useState('');
  const [minifyType, setMinifyType] = useState('css');

  const minifyCode = () => {
    let output = minifyInput;
    if (minifyType === 'css') {
      // Remove comments, whitespace, newlines
      output = output
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*;\s*/g, ';')
        .replace(/\s*:\s*/g, ':')
        .replace(/\s*,\s*/g, ',')
        .trim();
    } else {
      // JS minification (basic)
      output = output
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}()[\];,=+\-*/<>!&|])\s*/g, '$1')
        .trim();
    }
    setMinifyOutput(output);
    const saved = ((minifyInput.length - output.length) / minifyInput.length * 100).toFixed(1);
    showToast(`Minified! Saved ${saved}%`);
  };

  // Number Base Converter states
  const [baseInput, setBaseInput] = useState('255');
  const [baseFrom, setBaseFrom] = useState('10');
  const [baseResults, setBaseResults] = useState({});

  const convertBase = () => {
    try {
      const decimal = parseInt(baseInput, parseInt(baseFrom));
      if (isNaN(decimal)) throw new Error('Invalid');
      
      setBaseResults({
        binary: decimal.toString(2),
        octal: decimal.toString(8),
        decimal: decimal.toString(10),
        hex: decimal.toString(16).toUpperCase()
      });
      showToast('Converted!');
    } catch (error) {
      showToast('Invalid number', 'error');
    }
  };

  // ASCII Converter states
  const [asciiText, setAsciiText] = useState('Hello');
  const [asciiMode, setAsciiMode] = useState('toAscii');
  const [asciiResult, setAsciiResult] = useState('');

  const convertAscii = () => {
    if (asciiMode === 'toAscii') {
      const codes = asciiText.split('').map(c => c.charCodeAt(0));
      setAsciiResult(codes.join(' '));
    } else {
      try {
        const chars = asciiText.split(/\s+/).map(n => String.fromCharCode(parseInt(n)));
        setAsciiResult(chars.join(''));
      } catch {
        showToast('Invalid codes', 'error');
        return;
      }
    }
    showToast('Converted!');
  };

  // UUID Generator states
  const [uuidList, setUuidList] = useState([]);
  const [uuidCount, setUuidCount] = useState(5);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generateUUIDs = () => {
    const uuids = [];
    for (let i = 0; i < uuidCount; i++) {
      uuids.push(generateUUID());
    }
    setUuidList(uuids);
    showToast(`Generated ${uuidCount} UUIDs!`);
  };

  // Cron Parser states
  const [cronInput, setCronInput] = useState('0 9 * * 1-5');
  const [cronResult, setCronResult] = useState('');

  const parseCron = () => {
    const parts = cronInput.trim().split(/\s+/);
    if (parts.length !== 5) {
      setCronResult('Invalid cron expression (need 5 parts: min hour day month weekday)');
      showToast('Invalid format', 'error');
      return;
    }

    const [min, hour, day, month, weekday] = parts;
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    let description = 'Runs ';
    
    // Time
    if (min === '0' && hour !== '*') description += `at ${hour}:00 `;
    else if (min !== '*' && hour !== '*') description += `at ${hour}:${min.padStart(2, '0')} `;
    else if (min === '*') description += 'every minute ';
    else description += `at minute ${min} `;

    // Day
    if (day === '*' && weekday === '*') description += 'every day';
    else if (day !== '*' && day !== '?') description += `on day ${day} of the month`;
    else if (weekday !== '*') {
      if (weekday.includes('-')) {
        const [start, end] = weekday.split('-').map(n => weekdays[parseInt(n)] || n);
        description += `${start} to ${end}`;
      } else if (weekday.includes(',')) {
        const days = weekday.split(',').map(n => weekdays[parseInt(n)] || n);
        description += days.join(', ');
      } else {
        description += weekdays[parseInt(weekday)] || weekday;
      }
    }

    // Month
    if (month !== '*') {
      description += ` in ${months[parseInt(month)] || month}`;
    }

    setCronResult(description);
    showToast('Parsed!');
  };

  // HTML Entity states
  const [htmlInput, setHtmlInput] = useState('<div class="test">Hello & "World"</div>');
  const [htmlOutput, setHtmlOutput] = useState('');
  const [htmlMode, setHtmlMode] = useState('encode');

  const processHtmlEntity = () => {
    if (htmlMode === 'encode') {
      const div = document.createElement('div');
      div.textContent = htmlInput;
      setHtmlOutput(div.innerHTML);
    } else {
      const div = document.createElement('div');
      div.innerHTML = htmlInput;
      setHtmlOutput(div.textContent || '');
    }
    showToast(`HTML entities ${htmlMode}d!`);
  };

  // Slug Generator states
  const [slugInput, setSlugInput] = useState('Hello World! This is a Test Title #123');
  const [slugOutput, setSlugOutput] = useState('');
  const [slugSeparator, setSlugSeparator] = useState('-');

  const generateSlug = () => {
    const slug = slugInput
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, slugSeparator)
      .replace(new RegExp(`${slugSeparator}+`, 'g'), slugSeparator)
      .replace(new RegExp(`^${slugSeparator}|${slugSeparator}$`, 'g'), '');
    setSlugOutput(slug);
    showToast('Slug generated!');
  };

  // JWT Decoder states
  const [jwtInput, setJwtInput] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  const [jwtResult, setJwtResult] = useState(null);

  const decodeJWT = () => {
    try {
      const parts = jwtInput.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT');
      
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      setJwtResult({ header, payload });
      showToast('JWT decoded!');
    } catch (error) {
      showToast('Invalid JWT token', 'error');
      setJwtResult(null);
    }
  };

  // Escape String states
  const [escapeInput, setEscapeInput] = useState('Hello "World"\nNew Line\tTab');
  const [escapeOutput, setEscapeOutput] = useState('');
  const [escapeMode, setEscapeMode] = useState('escape');

  const processEscape = () => {
    if (escapeMode === 'escape') {
      const escaped = escapeInput
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      setEscapeOutput(escaped);
    } else {
      const unescaped = escapeInput
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
      setEscapeOutput(unescaped);
    }
    showToast(`String ${escapeMode}d!`);
  };

  // JSON to CSV states
  const [csvJsonInput, setCsvJsonInput] = useState('[{"name":"John","age":30},{"name":"Jane","age":25}]');
  const [csvOutput, setCsvOutput] = useState('');

  const jsonToCsv = () => {
    try {
      const data = JSON.parse(csvJsonInput);
      if (!Array.isArray(data) || data.length === 0) throw new Error('Need array');
      
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      setCsvOutput(csv);
      showToast('Converted to CSV!');
    } catch (error) {
      showToast('Invalid JSON array', 'error');
    }
  };

  // Placeholder Image states
  const [imgWidth, setImgWidth] = useState(400);
  const [imgHeight, setImgHeight] = useState(300);
  const [imgBgColor, setImgBgColor] = useState('#6366f1');
  const [imgTextColor, setImgTextColor] = useState('#ffffff');
  const [imgText, setImgText] = useState('');

  const getPlaceholderUrl = () => {
    const text = imgText || `${imgWidth}x${imgHeight}`;
    return `https://via.placeholder.com/${imgWidth}x${imgHeight}/${imgBgColor.slice(1)}/${imgTextColor.slice(1)}?text=${encodeURIComponent(text)}`;
  };

  // Device Info states
  const [deviceInfo, setDeviceInfo] = useState({});
  useEffect(() => {
    if (activeTab === 'device') {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenRes: `${window.screen.width}x${window.screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        pixelRatio: window.devicePixelRatio,
        cookiesEnabled: navigator.cookieEnabled ? 'Yes' : 'No',
        online: navigator.onLine ? 'Yes' : 'No'
      };
      setDeviceInfo(info);

      const handleResize = () => {
        setDeviceInfo(prev => ({
          ...prev,
          windowSize: `${window.innerWidth}x${window.innerHeight}`,
          screenRes: `${window.screen.width}x${window.screen.height}`
        }));
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [activeTab]);

  // Keycode states
  const [keyEvent, setKeyEvent] = useState(null);
  useEffect(() => {
    if (activeTab === 'keycode') {
      const handleKeyDown = (e) => {
        e.preventDefault();
        setKeyEvent({
          key: e.key === ' ' ? 'Space' : e.key,
          keyCode: e.keyCode,
          code: e.code,
          which: e.which,
          location: e.location,
          modifiers: [
            e.ctrlKey ? 'Ctrl' : null,
            e.altKey ? 'Alt' : null,
            e.shiftKey ? 'Shift' : null,
            e.metaKey ? 'Meta' : null
          ].filter(Boolean).join(' + ')
        });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeTab]);

  // Meta Tag Generator states
  const [metaInfo, setMetaInfo] = useState({
    title: '', description: '', keywords: '', author: '',
    ogTitle: '', ogDesc: '', ogImage: '', themeColor: '#000000'
  });
  const [metaOutput, setMetaOutput] = useState('');

  const generateMeta = () => {
    const tags = [
      `<!-- Primary Meta Tags -->`,
      `<title>${metaInfo.title}</title>`,
      `<meta name="title" content="${metaInfo.title}">`,
      `<meta name="description" content="${metaInfo.description}">`,
      `<meta name="keywords" content="${metaInfo.keywords}">`,
      `<meta name="author" content="${metaInfo.author}">`,
      `<meta name="theme-color" content="${metaInfo.themeColor}">`,
      '',
      `<!-- Open Graph / Facebook -->`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:title" content="${metaInfo.ogTitle || metaInfo.title}">`,
      `<meta property="og:description" content="${metaInfo.ogDesc || metaInfo.description}">`,
      `<meta property="og:image" content="${metaInfo.ogImage}">`,
      '',
      `<!-- Twitter -->`,
      `<meta property="twitter:card" content="summary_large_image">`,
      `<meta property="twitter:title" content="${metaInfo.ogTitle || metaInfo.title}">`,
      `<meta property="twitter:description" content="${metaInfo.ogDesc || metaInfo.description}">`,
      `<meta property="twitter:image" content="${metaInfo.ogImage}">`,
    ].join('\n');
    setMetaOutput(tags);
    showToast('Meta tags generated!');
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

        {/* Diff Viewer */}
        {activeTab === 'diff' && (
          <div className="tool-panel">
            <div className="diff-layout">
              <div className="diff-inputs">
                <div className="input-group">
                  <label>Original Text</label>
                  <textarea value={diffText1} onChange={(e) => setDiffText1(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Modified Text</label>
                  <textarea value={diffText2} onChange={(e) => setDiffText2(e.target.value)} />
                </div>
              </div>
              <button className="action-btn primary full" onClick={compareDiff}>
                <i className="fas fa-columns"></i> Compare
              </button>
              
              {diffResult.length > 0 && (
                <div className="diff-result">
                  {diffResult.map((line, i) => (
                    <div key={i} className={`diff-line ${line.type}`}>
                      <span className="line-num">{i + 1}</span>
                      <span className="line-content left">{line.line1 || '—'}</span>
                      <span className="line-content right">{line.line2 || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Minifier */}
        {activeTab === 'minify' && (
          <div className="tool-panel">
            <div className="mode-toggle" style={{ marginBottom: '20px' }}>
              <button className={`option-btn ${minifyType === 'css' ? 'active' : ''}`}
                onClick={() => setMinifyType('css')}>CSS</button>
              <button className={`option-btn ${minifyType === 'js' ? 'active' : ''}`}
                onClick={() => setMinifyType('js')}>JavaScript</button>
            </div>
            <div className="json-grid">
              <div className="json-input">
                <h4>Input ({minifyInput.length} chars)</h4>
                <textarea value={minifyInput} onChange={(e) => setMinifyInput(e.target.value)}
                  placeholder={`Paste your ${minifyType.toUpperCase()} code here...`} />
                <button className="action-btn primary" onClick={minifyCode}>
                  <i className="fas fa-compress"></i> Minify
                </button>
              </div>
              <div className="json-output">
                <h4>Output ({minifyOutput.length} chars)</h4>
                <textarea value={minifyOutput} readOnly />
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(minifyOutput); showToast('Copied!'); }}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Number Base Converter */}
        {activeTab === 'basenum' && (
          <div className="tool-panel">
            <div className="base-layout">
              <div className="input-row">
                <div className="input-group" style={{ flex: 2 }}>
                  <label>Number</label>
                  <input type="text" value={baseInput} onChange={(e) => setBaseInput(e.target.value)} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>From Base</label>
                  <div className="button-group">
                    {[{v:'2',n:'Bin'},{v:'8',n:'Oct'},{v:'10',n:'Dec'},{v:'16',n:'Hex'}].map(b => (
                      <button key={b.v} className={`option-btn ${baseFrom === b.v ? 'active' : ''}`}
                        onClick={() => setBaseFrom(b.v)}>{b.n}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button className="action-btn primary full" onClick={convertBase}>
                <i className="fas fa-exchange-alt"></i> Convert
              </button>
              
              {Object.keys(baseResults).length > 0 && (
                <div className="base-results">
                  {Object.entries(baseResults).map(([base, val]) => (
                    <div key={base} className="base-row">
                      <span className="base-label">{base.toUpperCase()}</span>
                      <span className="base-value">{val}</span>
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

        {/* ASCII Converter */}
        {activeTab === 'ascii' && (
          <div className="tool-panel">
            <div className="mode-toggle" style={{ marginBottom: '20px' }}>
              <button className={`option-btn ${asciiMode === 'toAscii' ? 'active' : ''}`}
                onClick={() => setAsciiMode('toAscii')}>Text → ASCII</button>
              <button className={`option-btn ${asciiMode === 'toText' ? 'active' : ''}`}
                onClick={() => setAsciiMode('toText')}>ASCII → Text</button>
            </div>
            <div className="json-grid">
              <div className="json-input">
                <h4>{asciiMode === 'toAscii' ? 'Text' : 'ASCII Codes (space separated)'}</h4>
                <textarea value={asciiText} onChange={(e) => setAsciiText(e.target.value)}
                  placeholder={asciiMode === 'toAscii' ? 'Enter text...' : 'Enter codes like 72 101 108...'} />
                <button className="action-btn primary" onClick={convertAscii}>
                  <i className="fas fa-exchange-alt"></i> Convert
                </button>
              </div>
              <div className="json-output">
                <h4>{asciiMode === 'toAscii' ? 'ASCII Codes' : 'Text'}</h4>
                <textarea value={asciiResult} readOnly />
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(asciiResult); showToast('Copied!'); }}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UUID Generator */}
        {activeTab === 'uuid' && (
          <div className="tool-panel">
            <div className="uuid-layout">
              <div className="input-row" style={{ alignItems: 'end' }}>
                <div className="input-group">
                  <label>Generate Count: {uuidCount}</label>
                  <input type="range" min="1" max="20" value={uuidCount}
                    onChange={(e) => setUuidCount(parseInt(e.target.value))} className="slider" />
                </div>
                <button className="action-btn primary" onClick={generateUUIDs}>
                  <i className="fas fa-sync"></i> Generate UUIDs
                </button>
              </div>
              
              {uuidList.length > 0 && (
                <div className="uuid-results">
                  {uuidList.map((uuid, i) => (
                    <div key={i} className="uuid-row">
                      <span className="uuid-value">{uuid}</span>
                      <button onClick={() => { navigator.clipboard.writeText(uuid); showToast('Copied!'); }}>
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  ))}
                  <button className="action-btn full" onClick={() => { 
                    navigator.clipboard.writeText(uuidList.join('\n')); 
                    showToast('All UUIDs copied!'); 
                  }}>
                    <i className="fas fa-copy"></i> Copy All
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cron Parser */}
        {activeTab === 'cron' && (
          <div className="tool-panel">
            <div className="cron-layout">
              <div className="input-group">
                <label>Cron Expression (5 parts: min hour day month weekday)</label>
                <input type="text" value={cronInput} onChange={(e) => setCronInput(e.target.value)}
                  placeholder="0 9 * * 1-5" />
              </div>
              <button className="action-btn primary full" onClick={parseCron}>
                <i className="fas fa-calendar-alt"></i> Parse Cron
              </button>
              
              {cronResult && (
                <div className="cron-result">
                  <i className="fas fa-clock"></i>
                  <span>{cronResult}</span>
                </div>
              )}

              <div className="cron-examples">
                <h4>Common Examples</h4>
                <div className="example-grid">
                  {[
                    { cron: '0 0 * * *', desc: 'Daily at midnight' },
                    { cron: '0 9 * * 1-5', desc: 'Weekdays at 9am' },
                    { cron: '*/15 * * * *', desc: 'Every 15 minutes' },
                    { cron: '0 0 1 * *', desc: '1st of month' },
                  ].map((ex, i) => (
                    <div key={i} className="example-item" onClick={() => setCronInput(ex.cron)}>
                      <code>{ex.cron}</code>
                      <span>{ex.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HTML Entity Encoder */}
        {activeTab === 'htmlent' && (
          <div className="tool-panel">
            <div className="mode-toggle" style={{ marginBottom: '20px' }}>
              <button className={`option-btn ${htmlMode === 'encode' ? 'active' : ''}`}
                onClick={() => setHtmlMode('encode')}>Encode</button>
              <button className={`option-btn ${htmlMode === 'decode' ? 'active' : ''}`}
                onClick={() => setHtmlMode('decode')}>Decode</button>
            </div>
            <div className="json-grid">
              <div className="json-input">
                <h4>{htmlMode === 'encode' ? 'HTML/Text' : 'Encoded Text'}</h4>
                <textarea value={htmlInput} onChange={(e) => setHtmlInput(e.target.value)}
                  placeholder={htmlMode === 'encode' ? 'Enter HTML/text...' : 'Enter encoded text...'} />
                <button className="action-btn primary" onClick={processHtmlEntity}>
                  <i className={`fas ${htmlMode === 'encode' ? 'fa-code' : 'fa-file-code'}`}></i>
                  {htmlMode === 'encode' ? 'Encode' : 'Decode'}
                </button>
              </div>
              <div className="json-output">
                <h4>{htmlMode === 'encode' ? 'Encoded' : 'Decoded'}</h4>
                <textarea value={htmlOutput} readOnly />
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(htmlOutput); showToast('Copied!'); }}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slug Generator */}
        {activeTab === 'slug' && (
          <div className="tool-panel">
            <div className="slug-layout">
              <div className="input-group">
                <label>Title / Text</label>
                <input type="text" value={slugInput} onChange={(e) => setSlugInput(e.target.value)}
                  placeholder="Enter title or text to slugify..." />
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>Separator</label>
                  <div className="button-group">
                    <button className={`option-btn ${slugSeparator === '-' ? 'active' : ''}`}
                      onClick={() => setSlugSeparator('-')}>Hyphen (-)</button>
                    <button className={`option-btn ${slugSeparator === '_' ? 'active' : ''}`}
                      onClick={() => setSlugSeparator('_')}>Underscore (_)</button>
                  </div>
                </div>
              </div>
              <button className="action-btn primary full" onClick={generateSlug}>
                <i className="fas fa-link"></i> Generate Slug
              </button>
              
              {slugOutput && (
                <div className="slug-result">
                  <span className="slug-value">{slugOutput}</span>
                  <button onClick={() => { navigator.clipboard.writeText(slugOutput); showToast('Slug copied!'); }}>
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* JWT Decoder */}
        {activeTab === 'jwt' && (
          <div className="tool-panel">
            <div className="jwt-layout">
              <div className="input-group">
                <label>JWT Token</label>
                <textarea value={jwtInput} onChange={(e) => setJwtInput(e.target.value)}
                  placeholder="Paste your JWT token here..." style={{ fontFamily: 'Fira Code, monospace', fontSize: '12px' }} />
              </div>
              <button className="action-btn primary full" onClick={decodeJWT}>
                <i className="fas fa-unlock"></i> Decode JWT
              </button>
              
              {jwtResult && (
                <div className="jwt-results">
                  <div className="jwt-section">
                    <h4>Header</h4>
                    <pre>{JSON.stringify(jwtResult.header, null, 2)}</pre>
                  </div>
                  <div className="jwt-section">
                    <h4>Payload</h4>
                    <pre>{JSON.stringify(jwtResult.payload, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Escape String */}
        {activeTab === 'escape' && (
          <div className="tool-panel">
            <div className="mode-toggle" style={{ marginBottom: '20px' }}>
              <button className={`option-btn ${escapeMode === 'escape' ? 'active' : ''}`}
                onClick={() => setEscapeMode('escape')}>Escape</button>
              <button className={`option-btn ${escapeMode === 'unescape' ? 'active' : ''}`}
                onClick={() => setEscapeMode('unescape')}>Unescape</button>
            </div>
            <div className="json-grid">
              <div className="json-input">
                <h4>Input</h4>
                <textarea value={escapeInput} onChange={(e) => setEscapeInput(e.target.value)} />
                <button className="action-btn primary" onClick={processEscape}>
                  <i className="fas fa-shield-alt"></i> {escapeMode === 'escape' ? 'Escape' : 'Unescape'}
                </button>
              </div>
              <div className="json-output">
                <h4>Output</h4>
                <textarea value={escapeOutput} readOnly />
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(escapeOutput); showToast('Copied!'); }}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* JSON to CSV */}
        {activeTab === 'jsoncsv' && (
          <div className="tool-panel">
            <div className="json-grid">
              <div className="json-input">
                <h4>JSON Array</h4>
                <textarea value={csvJsonInput} onChange={(e) => setCsvJsonInput(e.target.value)}
                  placeholder='[{"name":"John","age":30}]' />
                <button className="action-btn primary" onClick={jsonToCsv}>
                  <i className="fas fa-table"></i> Convert to CSV
                </button>
              </div>
              <div className="json-output">
                <h4>CSV Output</h4>
                <textarea value={csvOutput} readOnly />
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(csvOutput); showToast('Copied!'); }}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder Image */}
        {activeTab === 'lipsum' && (
          <div className="tool-panel">
            <div className="image-placeholder-layout">
              <div className="input-row">
                <div className="input-group">
                  <label>Width</label>
                  <input type="number" value={imgWidth} onChange={(e) => setImgWidth(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Height</label>
                  <input type="number" value={imgHeight} onChange={(e) => setImgHeight(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>BG Color</label>
                  <input type="color" value={imgBgColor} onChange={(e) => setImgBgColor(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Text Color</label>
                  <input type="color" value={imgTextColor} onChange={(e) => setImgTextColor(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Custom Text (optional)</label>
                <input type="text" value={imgText} onChange={(e) => setImgText(e.target.value)} placeholder="Leave empty for dimensions" />
              </div>
              
              <div className="placeholder-preview">
                <img src={getPlaceholderUrl()} alt="Placeholder" />
              </div>
              
              <div className="input-row">
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(getPlaceholderUrl()); showToast('URL copied!'); }}>
                  <i className="fas fa-link"></i> Copy URL
                </button>
                <button className="action-btn" onClick={() => { navigator.clipboard.writeText(`<img src="${getPlaceholderUrl()}" alt="Placeholder">`); showToast('HTML copied!'); }}>
                  <i className="fas fa-code"></i> Copy HTML
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Device Info */}
        {activeTab === 'device' && (
          <div className="tool-panel">
            <div className="json-grid">
              <div className="device-info-grid">
                {Object.entries(deviceInfo).map(([key, val]) => (
                  <div key={key} className="device-card">
                    <span className="device-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="device-value">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Keycode Viewer */}
        {activeTab === 'keycode' && (
          <div className="tool-panel">
            {!keyEvent ? (
              <div className="keycode-placeholder">
                <i className="fas fa-keyboard" style={{ fontSize: '48px', marginBottom: '20px', color: 'var(--text-muted)' }}></i>
                <h3>Press any key on your keyboard</h3>
              </div>
            ) : (
              <div className="keycode-display">
                <div className="main-key">
                  <span>{keyEvent.key}</span>
                  <div className="key-label">event.key</div>
                </div>
                <div className="key-details">
                  {[
                    { l: 'event.keyCode', v: keyEvent.keyCode },
                    { l: 'event.code', v: keyEvent.code },
                    { l: 'event.which', v: keyEvent.which },
                    { l: 'event.location', v: keyEvent.location },
                    { l: 'Modifiers', v: keyEvent.modifiers || 'None' }
                  ].map((item, i) => (
                    <div key={i} className="key-detail-card">
                      <span className="detail-value">{item.v}</span>
                      <span className="detail-label">{item.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Meta Tag Generator */}
        {activeTab === 'meta' && (
          <div className="tool-panel">
            <div className="meta-layout">
              <div className="input-row">
                <div className="input-group">
                  <label>Site Title</label>
                  <input type="text" value={metaInfo.title} onChange={(e) => setMetaInfo({...metaInfo, title: e.target.value})} placeholder="My Awesome Site" />
                </div>
                <div className="input-group">
                  <label>Theme Color</label>
                  <input type="color" value={metaInfo.themeColor} onChange={(e) => setMetaInfo({...metaInfo, themeColor: e.target.value})} style={{ height: '42px' }} />
                </div>
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea value={metaInfo.description} onChange={(e) => setMetaInfo({...metaInfo, description: e.target.value})} placeholder="Site description..." style={{ minHeight: '80px' }} />
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>Keywords</label>
                  <input type="text" value={metaInfo.keywords} onChange={(e) => setMetaInfo({...metaInfo, keywords: e.target.value})} placeholder="react, tools, converter" />
                </div>
                <div className="input-group">
                  <label>Author</label>
                  <input type="text" value={metaInfo.author} onChange={(e) => setMetaInfo({...metaInfo, author: e.target.value})} placeholder="John Doe" />
                </div>
              </div>
              
              <div className="section-divider"><span>Open Graph / Social</span></div>
              
              <div className="input-row">
                <div className="input-group">
                  <label>OG Title (optional)</label>
                  <input type="text" value={metaInfo.ogTitle} onChange={(e) => setMetaInfo({...metaInfo, ogTitle: e.target.value})} placeholder="Same as title if empty" />
                </div>
                <div className="input-group">
                  <label>OG Image URL</label>
                  <input type="text" value={metaInfo.ogImage} onChange={(e) => setMetaInfo({...metaInfo, ogImage: e.target.value})} placeholder="https://example.com/image.jpg" />
                </div>
              </div>

              <button className="action-btn primary full" onClick={generateMeta}>
                <i className="fas fa-magic"></i> Generate Meta Tags
              </button>

              {metaOutput && (
                <div className="meta-output">
                  <textarea value={metaOutput} readOnly style={{ minHeight: '300px', fontFamily: 'Fira Code, monospace', fontSize: '12px' }} />
                  <button className="action-btn" onClick={() => { navigator.clipboard.writeText(metaOutput); showToast('Copied!'); }}>
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              )}
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
          .diff-inputs {
            grid-template-columns: 1fr;
          }
        }

        /* Diff Viewer */
        .diff-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .diff-inputs textarea {
          width: 100%;
          min-height: 150px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--text);
          font-family: 'Fira Code', monospace;
          font-size: 13px;
        }

        .diff-result {
          margin-top: 20px;
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          overflow: hidden;
        }

        .diff-line {
          display: grid;
          grid-template-columns: 40px 1fr 1fr;
          font-family: 'Fira Code', monospace;
          font-size: 12px;
        }

        .line-num {
          padding: 8px;
          background: rgba(0,0,0,0.2);
          text-align: center;
          color: var(--text-muted);
        }

        .line-content {
          padding: 8px 12px;
          border-left: 1px solid var(--glass-border);
        }

        .diff-line.same { background: transparent; }
        .diff-line.added .right { background: rgba(76,175,80,0.2); }
        .diff-line.removed .left { background: rgba(244,67,54,0.2); }
        .diff-line.changed .left { background: rgba(244,67,54,0.15); }
        .diff-line.changed .right { background: rgba(76,175,80,0.15); }

        /* Number Base Converter */
        .base-results {
          margin-top: 20px;
        }

        .base-row {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          margin-bottom: 10px;
        }

        .base-label {
          background: var(--primary);
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          min-width: 70px;
          text-align: center;
        }

        .base-value {
          flex: 1;
          font-family: 'Fira Code', monospace;
          font-size: 14px;
          word-break: break-all;
        }

        .base-row button {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .base-row button:hover {
          background: var(--primary);
          border-color: var(--primary);
        }

        /* UUID Generator */
        .uuid-results {
          margin-top: 20px;
        }

        .uuid-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 15px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          margin-bottom: 8px;
          font-family: 'Fira Code', monospace;
          font-size: 13px;
        }

        .uuid-row button {
          background: transparent;
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .uuid-row button:hover {
          background: var(--primary);
          border-color: var(--primary);
        }

        /* Cron Parser */
        .cron-result {
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(0,230,118,0.2));
          border: 1px solid var(--primary);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 16px;
        }

        .cron-result i {
          font-size: 24px;
          color: var(--primary-light);
        }

        .cron-examples {
          margin-top: 25px;
        }

        .example-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 15px;
        }

        .example-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .example-item:hover {
          border-color: var(--primary);
          background: rgba(99,102,241,0.1);
        }

        .example-item code {
          display: block;
          font-family: 'Fira Code', monospace;
          color: var(--primary-light);
          margin-bottom: 5px;
        }

        .example-item span {
          font-size: 12px;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .example-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Slug Generator */
        .slug-result {
          background: linear-gradient(135deg, rgba(100,255,218,0.2), rgba(99,102,241,0.2));
          border: 1px solid var(--primary);
          border-radius: 12px;
          padding: 15px 20px;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .slug-value {
          font-family: 'Fira Code', monospace;
          font-size: 16px;
          word-break: break-all;
          color: var(--primary-light);
        }

        .slug-result button {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
        }

        .slug-result button:hover {
          background: var(--primary);
          border-color: var(--primary);
        }

        /* JWT Decoder */
        .jwt-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .jwt-results {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 10px;
        }

        .jwt-section h4 {
          margin-bottom: 10px;
          color: var(--secondary);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .jwt-section pre {
          background: rgba(0,0,0,0.3);
          padding: 15px;
          border-radius: 10px;
          border: 1px solid var(--glass-border);
          color: var(--text);
          font-family: 'Fira Code', monospace;
          font-size: 12px;
          overflow-x: auto;
          white-space: pre-wrap;
          max-height: 400px;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .jwt-results {
            grid-template-columns: 1fr;
          }
        }

        /* Placeholder Image */
        .image-placeholder-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .placeholder-preview {
          background: rgba(0,0,0,0.2);
          padding: 20px;
          border-radius: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
          border: 1px dashed var(--glass-border);
          margin: 10px 0;
        }

        .placeholder-preview img {
          max-width: 100%;
          height: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          border-radius: 4px;
        }

        /* Device Info */
        .device-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }

        .device-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .device-label {
          color: var(--secondary);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .device-value {
          font-weight: 600;
          font-size: 14px;
          color: var(--text);
          word-break: break-all;
        }

        /* Keycode Viewer */
        .keycode-placeholder {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
        }

        .keycode-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
        }

        .main-key {
          width: 150px;
          height: 150px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .main-key span {
          font-size: 48px;
          font-weight: bold;
          color: white;
        }

        .main-key .key-label {
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          margin-top: 5px;
        }

        .key-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          width: 100%;
        }

        .key-detail-card {
           background: rgba(255,255,255,0.03);
           border: 1px solid var(--glass-border);
           border-radius: 10px;
           padding: 12px;
           text-align: center;
           display: flex;
           flex-direction: column-reverse; /* Swap label and value */
           gap: 5px;
        }
        
        .detail-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .detail-value {
          font-family: 'Fira Code', monospace;
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-light);
        }

        /* Meta Tag Generator */
        .meta-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: var(--text-muted);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 10px 0;
        }

        .section-divider::before,
        .section-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--glass-border);
        }

        .section-divider span {
          padding: 0 10px;
        }

        .meta-output {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          align-items: flex-start;
        }

        .meta-output textarea {
          flex: 1;
          background: rgba(0,0,0,0.3);
        }
      `}</style>
    </>
  );
}
