'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

// Image tools configuration
const IMAGE_TOOLS = {
  // OPTIMIZE
  compress: {
    name: 'Compress Image',
    desc: 'Reduce file size while maintaining quality',
    icon: 'fa-compress-alt',
    color: '#e74c3c',
    category: 'optimize'
  },
  // MODIFY
  resize: {
    name: 'Resize Image',
    desc: 'Change image dimensions',
    icon: 'fa-expand-arrows-alt',
    color: '#3498db',
    category: 'modify'
  },
  crop: {
    name: 'Crop Image',
    desc: 'Cut out a portion of image',
    icon: 'fa-crop-alt',
    color: '#f39c12',
    category: 'modify'
  },
  rotate: {
    name: 'Rotate Image',
    desc: 'Rotate or flip your image',
    icon: 'fa-sync-alt',
    color: '#9b59b6',
    category: 'modify'
  },
  // EFFECTS
  filters: {
    name: 'Image Filters',
    desc: 'Grayscale, Sepia, Blur, Brightness',
    icon: 'fa-magic',
    color: '#e91e63',
    category: 'effects'
  },
  border: {
    name: 'Add Border',
    desc: 'Add frame/border to images',
    icon: 'fa-border-style',
    color: '#ff5722',
    category: 'effects'
  },
  // CONVERT
  convert: {
    name: 'Convert Format',
    desc: 'PNG, JPEG, WebP, GIF, BMP',
    icon: 'fa-exchange-alt',
    color: '#2ecc71',
    category: 'convert'
  },
  htmlToImage: {
    name: 'HTML to Image',
    desc: 'Convert HTML/text to image',
    icon: 'fa-code',
    color: '#00bcd4',
    category: 'convert'
  },
  // SECURITY
  watermark: {
    name: 'Add Watermark',
    desc: 'Add text watermark to images',
    icon: 'fa-copyright',
    color: '#34495e',
    category: 'security'
  },
};

const IMAGE_FORMATS = {
  png: { name: 'PNG', mimeType: 'image/png' },
  jpeg: { name: 'JPEG', mimeType: 'image/jpeg' },
  webp: { name: 'WebP', mimeType: 'image/webp' },
  gif: { name: 'GIF', mimeType: 'image/gif' },
  bmp: { name: 'BMP', mimeType: 'image/bmp' },
};

export default function ImageConverterPage() {
  const [selectedTool, setSelectedTool] = useState(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Tool-specific options
  const [targetFormat, setTargetFormat] = useState('jpeg');
  const [quality, setQuality] = useState(0.8);
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [rotation, setRotation] = useState(90);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [watermarkText, setWatermarkText] = useState('© Your Name');
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(100);
  const [cropHeight, setCropHeight] = useState(100);
  
  // Filter options
  const [filterType, setFilterType] = useState('grayscale');
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [blur, setBlur] = useState(0);
  
  // Border options
  const [borderWidth, setBorderWidth] = useState(20);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [borderStyle, setBorderStyle] = useState('solid');
  
  // HTML to Image
  const [htmlContent, setHtmlContent] = useState('<h1 style="color: #333; font-family: Arial;">Hello World!</h1><p>This is a sample HTML content.</p>');
  const [htmlWidth, setHtmlWidth] = useState(800);
  const [htmlHeight, setHtmlHeight] = useState(600);
  const [htmlBgColor, setHtmlBgColor] = useState('#ffffff');
  
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFiles = useCallback(async (fileList) => {
    const filesArray = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    
    if (filesArray.length === 0) {
      showToast('Pilih file gambar yang valid', 'error');
      return;
    }
    
    setFiles(filesArray);
    setResults([]);
    
    // Generate previews
    const previewPromises = filesArray.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              name: file.name,
              dataUrl: e.target.result,
              size: file.size,
              type: file.type,
              width: img.width,
              height: img.height
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    });
    
    const newPreviews = await Promise.all(previewPromises);
    setPreviews(newPreviews);
    
    // Set default crop dimensions
    if (newPreviews.length > 0) {
      setCropWidth(Math.min(newPreviews[0].width, 500));
      setCropHeight(Math.min(newPreviews[0].height, 500));
      setResizeWidth(newPreviews[0].width);
      setResizeHeight(newPreviews[0].height);
    }
    
    showToast(`${filesArray.length} gambar berhasil dipilih!`);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const processImages = async () => {
    if (files.length === 0 || !selectedTool) return;
    
    setIsLoading(true);
    setResults([]);
    
    try {
      const processed = [];
      
      for (const file of files) {
        const result = await processImage(file);
        processed.push(result);
      }
      
      setResults(processed);
      showToast(`${processed.length} gambar berhasil diproses!`);
    } catch (error) {
      console.error('Error processing images:', error);
      showToast(error.message || 'Gagal memproses gambar', 'error');
    }
    
    setIsLoading(false);
  };

  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let ctx = canvas.getContext('2d');
          let finalWidth = img.width;
          let finalHeight = img.height;
          let outputQuality = quality;
          let outputFormat = file.type.split('/')[1];
          
          switch (selectedTool) {
            case 'compress':
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              outputQuality = quality;
              outputFormat = 'jpeg';
              break;
              
            case 'resize':
              if (maintainAspect) {
                const ratio = Math.min(resizeWidth / img.width, resizeHeight / img.height);
                finalWidth = Math.round(img.width * ratio);
                finalHeight = Math.round(img.height * ratio);
              } else {
                finalWidth = resizeWidth;
                finalHeight = resizeHeight;
              }
              canvas.width = finalWidth;
              canvas.height = finalHeight;
              ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
              outputQuality = 0.92;
              break;
              
            case 'crop':
              canvas.width = cropWidth;
              canvas.height = cropHeight;
              ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
              outputQuality = 0.92;
              break;
              
            case 'rotate':
              if (rotation === 90 || rotation === 270) {
                canvas.width = img.height;
                canvas.height = img.width;
              } else {
                canvas.width = img.width;
                canvas.height = img.height;
              }
              
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate((rotation * Math.PI) / 180);
              
              if (flipH) ctx.scale(-1, 1);
              if (flipV) ctx.scale(1, -1);
              
              ctx.drawImage(img, -img.width / 2, -img.height / 2);
              outputQuality = 0.92;
              break;
              
            case 'convert':
              canvas.width = img.width;
              canvas.height = img.height;
              
              // Fill white background for JPEG
              if (targetFormat === 'jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              
              ctx.drawImage(img, 0, 0);
              outputFormat = targetFormat;
              outputQuality = quality;
              break;
              
            case 'watermark':
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              
              // Add watermark
              const fontSize = Math.max(16, Math.min(img.width, img.height) / 20);
              ctx.font = `${fontSize}px Arial`;
              ctx.fillStyle = `rgba(255, 255, 255, ${watermarkOpacity})`;
              ctx.strokeStyle = `rgba(0, 0, 0, ${watermarkOpacity * 0.5})`;
              ctx.lineWidth = 2;
              
              const textWidth = ctx.measureText(watermarkText).width;
              let x, y;
              
              switch (watermarkPosition) {
                case 'top-left':
                  x = 20; y = fontSize + 20;
                  break;
                case 'top-right':
                  x = img.width - textWidth - 20; y = fontSize + 20;
                  break;
                case 'bottom-left':
                  x = 20; y = img.height - 20;
                  break;
                case 'bottom-right':
                  x = img.width - textWidth - 20; y = img.height - 20;
                  break;
                case 'center':
                  x = (img.width - textWidth) / 2; y = img.height / 2;
                  break;
                default:
                  x = img.width - textWidth - 20; y = img.height - 20;
              }
              
              ctx.strokeText(watermarkText, x, y);
              ctx.fillText(watermarkText, x, y);
              outputQuality = 0.92;
              break;
              
            case 'filters':
              canvas.width = img.width;
              canvas.height = img.height;
              
              // Build filter string
              let filterStr = '';
              switch (filterType) {
                case 'grayscale':
                  filterStr = `grayscale(${filterIntensity}%)`;
                  break;
                case 'sepia':
                  filterStr = `sepia(${filterIntensity}%)`;
                  break;
                case 'invert':
                  filterStr = `invert(${filterIntensity}%)`;
                  break;
                case 'saturate':
                  filterStr = `saturate(${filterIntensity}%)`;
                  break;
                case 'hue-rotate':
                  filterStr = `hue-rotate(${filterIntensity * 3.6}deg)`;
                  break;
              }
              
              // Add brightness, contrast, blur
              filterStr += ` brightness(${brightness}%) contrast(${contrast}%)`;
              if (blur > 0) filterStr += ` blur(${blur}px)`;
              
              ctx.filter = filterStr;
              ctx.drawImage(img, 0, 0);
              ctx.filter = 'none';
              outputQuality = 0.92;
              break;
              
            case 'border':
              const bw = borderWidth;
              canvas.width = img.width + bw * 2;
              canvas.height = img.height + bw * 2;
              
              // Draw border background
              ctx.fillStyle = borderColor;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw image on top
              ctx.drawImage(img, bw, bw);
              outputQuality = 0.92;
              break;
          }
          
          const mimeType = IMAGE_FORMATS[outputFormat]?.mimeType || 'image/jpeg';
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to process image'));
                return;
              }
              
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              const ext = outputFormat;
              
              resolve({
                blob,
                name: `${baseName}_${selectedTool}.${ext}`,
                originalName: file.name,
                originalSize: file.size,
                newSize: blob.size,
                dataUrl: canvas.toDataURL(mimeType, outputQuality),
                width: canvas.width,
                height: canvas.height
              });
            },
            mimeType,
            outputQuality
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const downloadImage = (result) => {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    for (const result of results) {
      downloadImage(result);
      await new Promise(r => setTimeout(r, 300));
    }
    showToast('All images downloaded!');
  };

  // HTML to Image conversion
  const processHtmlToImage = async () => {
    setIsLoading(true);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = htmlWidth;
      canvas.height = htmlHeight;
      const ctx = canvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = htmlBgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create SVG with foreignObject to render HTML
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${htmlWidth}" height="${htmlHeight}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; padding: 20px; box-sizing: border-box;">
              ${htmlContent}
            </div>
          </foreignObject>
        </svg>
      `;
      
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgUrl;
      });
      
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      
      // Convert to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.92));
      
      setResults([{
        blob,
        name: 'html_to_image.png',
        originalName: 'HTML Content',
        originalSize: htmlContent.length,
        newSize: blob.size,
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height
      }]);
      
      showToast('Image generated successfully!');
    } catch (error) {
      console.error('Error converting HTML to image:', error);
      showToast('Failed to generate image. Try simpler HTML.', 'error');
    }
    
    setIsLoading(false);
  };

  const resetTool = () => {
    setFiles([]);
    setPreviews([]);
    setResults([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const categories = {
    optimize: { name: 'OPTIMIZE', color: '#e74c3c' },
    modify: { name: 'MODIFY', color: '#3498db' },
    effects: { name: 'EFFECTS', color: '#e91e63' },
    convert: { name: 'CONVERT', color: '#2ecc71' },
    security: { name: 'SECURITY', color: '#34495e' }
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
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #f39c12, #e74c3c)' }}>
            <i className="fas fa-images"></i>
          </div>
          <span>Image<span style={{ color: 'var(--secondary)' }}>Tools</span></span>
        </div>
        <nav className="nav-links">
          <Link href="/"><i className="fas fa-exchange-alt"></i> File Converter</Link>
          <Link href="/pdf-tools"><i className="fas fa-file-pdf"></i> PDF Tools</Link>
          <Link href="/image-converter" className="active"><i className="fas fa-images"></i> Image</Link>
          <Link href="/batch-converter"><i className="fas fa-layer-group"></i> Batch</Link>
        </nav>
      </header>

      <div className="container">
        <section className="hero">
          <h1>Image Tools</h1>
          <p>Compress, resize, crop, rotate, convert, dan watermark gambar dengan mudah. Semua proses di browser!</p>
        </section>

        {/* Tool Selection Grid */}
        {!selectedTool && (
          <div className="tools-container">
            {Object.entries(categories).map(([catKey, cat]) => (
              <div key={catKey} className="tool-category">
                <h3 style={{ color: cat.color }}>{cat.name}</h3>
                <div className="tool-cards">
                  {Object.entries(IMAGE_TOOLS)
                    .filter(([_, tool]) => tool.category === catKey)
                    .map(([key, tool]) => (
                      <div 
                        key={key}
                        className="tool-card"
                        onClick={() => setSelectedTool(key)}
                        style={{ '--tool-color': tool.color }}
                      >
                        <div className="tool-icon" style={{ background: tool.color }}>
                          <i className={`fas ${tool.icon}`}></i>
                        </div>
                        <div className="tool-info">
                          <h4>{tool.name}</h4>
                          <p>{tool.desc}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Tool */}
        {selectedTool && (
          <>
            <div className="tool-header">
              <button className="back-btn" onClick={() => { setSelectedTool(null); resetTool(); }}>
                <i className="fas fa-arrow-left"></i> Kembali
              </button>
              <h2>
                <i className={`fas ${IMAGE_TOOLS[selectedTool].icon}`} style={{ color: IMAGE_TOOLS[selectedTool].color }}></i>
                {IMAGE_TOOLS[selectedTool].name}
              </h2>
            </div>

            {/* Upload Zone - for regular tools */}
            {files.length === 0 && selectedTool !== 'htmlToImage' && (
              <div 
                className={`upload-zone ${isDragging ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
              >
                <div className="upload-icon" style={{ background: IMAGE_TOOLS[selectedTool].color }}>
                  <i className={`fas ${IMAGE_TOOLS[selectedTool].icon}`}></i>
                </div>
                <h3>Drop your images here</h3>
                <p>or click to browse</p>
                <button className="upload-btn">
                  <i className="fas fa-folder-open"></i>
                  Browse Images
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
            )}

            {/* HTML to Image - Special Input */}
            {selectedTool === 'htmlToImage' && results.length === 0 && !isLoading && (
              <div className="file-card show">
                <div className="file-card-header">
                  <div className="file-name">
                    <div className="file-icon" style={{ background: IMAGE_TOOLS[selectedTool].color }}>
                      <i className="fas fa-code"></i>
                    </div>
                    <div>
                      <h3>HTML to Image</h3>
                      <p>Convert HTML content to image</p>
                    </div>
                  </div>
                </div>

                <div className="tool-options">
                  <div className="input-group full">
                    <label>HTML Content</label>
                    <textarea 
                      value={htmlContent} 
                      onChange={(e) => setHtmlContent(e.target.value)}
                      rows={8}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Width (px)</label>
                      <input type="number" value={htmlWidth} onChange={(e) => setHtmlWidth(parseInt(e.target.value) || 800)} />
                    </div>
                    <div className="input-group">
                      <label>Height (px)</label>
                      <input type="number" value={htmlHeight} onChange={(e) => setHtmlHeight(parseInt(e.target.value) || 600)} />
                    </div>
                    <div className="input-group">
                      <label>Background</label>
                      <input type="color" value={htmlBgColor} onChange={(e) => setHtmlBgColor(e.target.value)} 
                        style={{ width: '100%', height: '42px', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>

                <button className="convert-btn" onClick={processHtmlToImage}
                  style={{ background: `linear-gradient(135deg, ${IMAGE_TOOLS[selectedTool].color}, var(--secondary))` }}>
                  <i className="fas fa-image"></i>
                  Generate Image
                </button>
              </div>
            )}

            {/* Preview + Options */}
            {previews.length > 0 && !isLoading && results.length === 0 && (
              <div className="file-card show">
                <div className="file-card-header">
                  <div className="file-name">
                    <div className="file-icon" style={{ background: IMAGE_TOOLS[selectedTool].color }}>
                      <i className="fas fa-images"></i>
                    </div>
                    <div>
                      <h3>{files.length} Image{files.length > 1 ? 's' : ''} Selected</h3>
                      <p>{previews[0]?.width}x{previews[0]?.height} • {formatSize(previews[0]?.size)}</p>
                    </div>
                  </div>
                  <button className="upload-btn" onClick={resetTool}>
                    <i className="fas fa-redo"></i> Reset
                  </button>
                </div>

                {/* Image Preview */}
                <div className="preview-container">
                  <img src={previews[0]?.dataUrl} alt="Preview" className="preview-image" />
                </div>

                {/* Tool Options */}
                <div className="tool-options">
                  {selectedTool === 'compress' && (
                    <>
                      <h4>Quality: {Math.round(quality * 100)}%</h4>
                      <input 
                        type="range" min="0.1" max="1" step="0.1" value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="slider"
                      />
                      <div className="slider-labels"><span>Low (smaller)</span><span>High (larger)</span></div>
                    </>
                  )}

                  {selectedTool === 'resize' && (
                    <>
                      <div className="input-row">
                        <div className="input-group">
                          <label>Width (px)</label>
                          <input type="number" value={resizeWidth} onChange={(e) => setResizeWidth(parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="input-group">
                          <label>Height (px)</label>
                          <input type="number" value={resizeHeight} onChange={(e) => setResizeHeight(parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                      <label className="checkbox-label">
                        <input type="checkbox" checked={maintainAspect} onChange={(e) => setMaintainAspect(e.target.checked)} />
                        Maintain aspect ratio
                      </label>
                    </>
                  )}

                  {selectedTool === 'crop' && (
                    <>
                      <div className="input-row">
                        <div className="input-group">
                          <label>X Position</label>
                          <input type="number" value={cropX} onChange={(e) => setCropX(parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="input-group">
                          <label>Y Position</label>
                          <input type="number" value={cropY} onChange={(e) => setCropY(parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                      <div className="input-row">
                        <div className="input-group">
                          <label>Width</label>
                          <input type="number" value={cropWidth} onChange={(e) => setCropWidth(parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="input-group">
                          <label>Height</label>
                          <input type="number" value={cropHeight} onChange={(e) => setCropHeight(parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedTool === 'rotate' && (
                    <>
                      <h4>Rotation</h4>
                      <div className="button-group">
                        {[90, 180, 270].map(deg => (
                          <button key={deg} className={`option-btn ${rotation === deg ? 'selected' : ''}`}
                            onClick={() => setRotation(deg)}>
                            {deg}°
                          </button>
                        ))}
                      </div>
                      <div className="button-group" style={{ marginTop: '15px' }}>
                        <button className={`option-btn ${flipH ? 'selected' : ''}`} onClick={() => setFlipH(!flipH)}>
                          <i className="fas fa-arrows-alt-h"></i> Flip H
                        </button>
                        <button className={`option-btn ${flipV ? 'selected' : ''}`} onClick={() => setFlipV(!flipV)}>
                          <i className="fas fa-arrows-alt-v"></i> Flip V
                        </button>
                      </div>
                    </>
                  )}

                  {selectedTool === 'convert' && (
                    <>
                      <h4>Output Format</h4>
                      <div className="format-buttons">
                        {Object.entries(IMAGE_FORMATS).map(([ext, info]) => (
                          <button key={ext} className={`format-btn ${targetFormat === ext ? 'selected' : ''}`}
                            onClick={() => setTargetFormat(ext)}>
                            {info.name}
                          </button>
                        ))}
                      </div>
                      {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
                        <>
                          <h4 style={{ marginTop: '20px' }}>Quality: {Math.round(quality * 100)}%</h4>
                          <input type="range" min="0.1" max="1" step="0.1" value={quality}
                            onChange={(e) => setQuality(parseFloat(e.target.value))} className="slider" />
                        </>
                      )}
                    </>
                  )}

                  {selectedTool === 'watermark' && (
                    <>
                      <div className="input-group full">
                        <label>Watermark Text</label>
                        <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
                      </div>
                      <h4>Position</h4>
                      <div className="position-grid">
                        {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map(pos => (
                          <button key={pos} className={`option-btn ${watermarkPosition === pos ? 'selected' : ''}`}
                            onClick={() => setWatermarkPosition(pos)}>
                            {pos.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                      <h4 style={{ marginTop: '15px' }}>Opacity: {Math.round(watermarkOpacity * 100)}%</h4>
                      <input type="range" min="0.1" max="1" step="0.1" value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))} className="slider" />
                    </>
                  )}

                  {selectedTool === 'filters' && (
                    <>
                      <h4>Filter Type</h4>
                      <div className="button-group">
                        {['grayscale', 'sepia', 'invert', 'saturate', 'hue-rotate'].map(f => (
                          <button key={f} className={`option-btn ${filterType === f ? 'selected' : ''}`}
                            onClick={() => setFilterType(f)}>
                            {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                      <h4 style={{ marginTop: '15px' }}>Intensity: {filterIntensity}%</h4>
                      <input type="range" min="0" max="200" step="10" value={filterIntensity}
                        onChange={(e) => setFilterIntensity(parseInt(e.target.value))} className="slider" />
                      <h4 style={{ marginTop: '15px' }}>Brightness: {brightness}%</h4>
                      <input type="range" min="50" max="150" step="5" value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))} className="slider" />
                      <h4 style={{ marginTop: '15px' }}>Contrast: {contrast}%</h4>
                      <input type="range" min="50" max="150" step="5" value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value))} className="slider" />
                      <h4 style={{ marginTop: '15px' }}>Blur: {blur}px</h4>
                      <input type="range" min="0" max="20" step="1" value={blur}
                        onChange={(e) => setBlur(parseInt(e.target.value))} className="slider" />
                    </>
                  )}

                  {selectedTool === 'border' && (
                    <>
                      <div className="input-row">
                        <div className="input-group">
                          <label>Border Width (px)</label>
                          <input type="number" value={borderWidth} onChange={(e) => setBorderWidth(parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="input-group">
                          <label>Border Color</label>
                          <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} 
                            style={{ width: '100%', height: '42px', cursor: 'pointer' }} />
                        </div>
                      </div>
                      <div className="button-group" style={{ marginTop: '15px' }}>
                        <button className={`option-btn ${borderColor === '#ffffff' ? 'selected' : ''}`} 
                          onClick={() => setBorderColor('#ffffff')}>White</button>
                        <button className={`option-btn ${borderColor === '#000000' ? 'selected' : ''}`} 
                          onClick={() => setBorderColor('#000000')}>Black</button>
                        <button className={`option-btn ${borderColor === '#f5f5f5' ? 'selected' : ''}`} 
                          onClick={() => setBorderColor('#f5f5f5')}>Light Gray</button>
                        <button className={`option-btn ${borderColor === '#2c3e50' ? 'selected' : ''}`} 
                          onClick={() => setBorderColor('#2c3e50')}>Dark</button>
                      </div>
                    </>
                  )}
                </div>

                <button className="convert-btn" onClick={processImages}
                  style={{ background: `linear-gradient(135deg, ${IMAGE_TOOLS[selectedTool].color}, var(--secondary))` }}>
                  <i className={`fas ${IMAGE_TOOLS[selectedTool].icon}`}></i>
                  Process {files.length} Image{files.length > 1 ? 's' : ''}
                </button>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="loading show">
                <div className="spinner"></div>
                <p>Processing images...</p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="result-card show">
                <div className="result-icon"><i className="fas fa-check"></i></div>
                <h3>Processing Complete!</h3>
                
                <div className="results-grid">
                  {results.map((result, idx) => (
                    <div key={idx} className="result-item">
                      <img src={result.dataUrl} alt={result.name} />
                      <div className="result-info">
                        <span className="name">{result.name}</span>
                        <span className="size">
                          {formatSize(result.originalSize)} → {formatSize(result.newSize)}
                          <span className={result.newSize < result.originalSize ? 'smaller' : 'larger'}>
                            {result.newSize < result.originalSize ? ' ↓' : ' ↑'}
                            {Math.abs(Math.round((1 - result.newSize / result.originalSize) * 100))}%
                          </span>
                        </span>
                        <span className="dims">{result.width}x{result.height}</span>
                      </div>
                      <button className="download-item-btn" onClick={() => downloadImage(result)}>
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                  ))}
                </div>
                
                <button className="download-btn" onClick={downloadAll}>
                  <i className="fas fa-download"></i>
                  Download All
                </button>
                
                <button className="upload-btn" onClick={resetTool} style={{ marginTop: '15px' }}>
                  <i className="fas fa-redo"></i> Process More
                </button>
              </div>
            )}
          </>
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
        .tools-container {
          display: grid;
          gap: 30px;
        }
        
        .tool-category h3 {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        
        .tool-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        }
        
        .tool-card {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .tool-card:hover {
          transform: translateY(-3px);
          border-color: var(--tool-color);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .tool-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          flex-shrink: 0;
        }
        
        .tool-info h4 {
          font-size: 15px;
          margin-bottom: 4px;
        }
        
        .tool-info p {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .tool-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .tool-header h2 {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .back-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .back-btn:hover {
          background: var(--primary);
        }
        
        .preview-container {
          margin: 20px 0;
          text-align: center;
        }
        
        .preview-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }
        
        .tool-options {
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .tool-options h4 {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }
        
        .slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: var(--glass-bg);
          outline: none;
          -webkit-appearance: none;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
        }
        
        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 8px;
        }
        
        .input-row {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .input-group {
          flex: 1;
        }
        
        .input-group.full {
          width: 100%;
          margin-bottom: 15px;
        }
        
        .input-group label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        
        .input-group input {
          width: 100%;
          padding: 10px 14px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
        }
        
        .input-group input:focus {
          outline: none;
          border-color: var(--primary);
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .checkbox-label input {
          width: 18px;
          height: 18px;
        }
        
        .button-group, .format-buttons, .position-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .option-btn, .format-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .option-btn.selected, .format-btn.selected {
          background: var(--primary);
          border-color: var(--primary);
        }
        
        .option-btn:hover:not(.selected), .format-btn:hover:not(.selected) {
          border-color: var(--primary);
        }
        
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        
        .result-item {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .result-item img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }
        
        .result-info {
          flex: 1;
          min-width: 0;
        }
        
        .result-info .name {
          display: block;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .result-info .size {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
        }
        
        .result-info .size .smaller { color: var(--success); }
        .result-info .size .larger { color: var(--danger); }
        
        .result-info .dims {
          display: block;
          font-size: 10px;
          color: var(--text-muted);
        }
        
        .download-item-btn {
          background: var(--primary);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        
        .download-item-btn:hover {
          transform: scale(1.1);
        }
        
        .nav-links a.active {
          color: var(--primary-light);
        }
      `}</style>
    </>
  );
}
