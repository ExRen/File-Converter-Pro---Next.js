'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

const IMAGE_FORMATS = {
  png: { name: 'PNG', desc: 'Portable Network Graphics', mimeType: 'image/png' },
  jpeg: { name: 'JPEG', desc: 'Joint Photographic Experts Group', mimeType: 'image/jpeg' },
  webp: { name: 'WebP', desc: 'Modern Web Format', mimeType: 'image/webp' },
  gif: { name: 'GIF', desc: 'Graphics Interchange Format', mimeType: 'image/gif' },
  bmp: { name: 'BMP', desc: 'Bitmap Image', mimeType: 'image/bmp' },
};

export default function ImageConverterPage() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [targetFormat, setTargetFormat] = useState('png');
  const [quality, setQuality] = useState(0.9);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
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
        reader.onload = (e) => resolve({
          name: file.name,
          dataUrl: e.target.result,
          size: file.size,
          type: file.type
        });
        reader.readAsDataURL(file);
      });
    });
    
    const newPreviews = await Promise.all(previewPromises);
    setPreviews(newPreviews);
    showToast(`${filesArray.length} gambar berhasil dipilih!`);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const convertImages = async () => {
    if (files.length === 0) return;
    
    setIsLoading(true);
    setResults([]);
    
    try {
      const convertedImages = [];
      
      for (const file of files) {
        const converted = await convertImage(file, targetFormat, quality);
        convertedImages.push(converted);
      }
      
      setResults(convertedImages);
      showToast(`${convertedImages.length} gambar berhasil dikonversi!`);
    } catch (error) {
      console.error('Error converting images:', error);
      showToast(error.message || 'Gagal mengkonversi gambar', 'error');
    }
    
    setIsLoading(false);
  };

  const convertImage = (file, format, quality) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          
          // Handle transparent background for JPEG (fill with white)
          if (format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert image'));
                return;
              }
              
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              resolve({
                blob,
                name: `${baseName}.${format}`,
                originalName: file.name,
                originalSize: file.size,
                newSize: blob.size,
                dataUrl: canvas.toDataURL(IMAGE_FORMATS[format].mimeType, quality),
                width: img.width,
                height: img.height
              });
            },
            IMAGE_FORMATS[format].mimeType,
            quality
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
    if (results.length === 0) return;
    
    // Download all images individually with delay
    for (const result of results) {
      downloadImage(result);
      await new Promise(r => setTimeout(r, 300));
    }
    
    showToast('All images downloaded!');
  };

  const resetConverter = () => {
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
          <span>Image<span style={{ color: 'var(--secondary)' }}>Converter</span></span>
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
          <h1>Image Converter</h1>
          <p>Konversi gambar ke PNG, JPEG, WebP, GIF, atau BMP dengan mudah. Semua proses dilakukan di browser!</p>
          <div className="format-badges">
            {Object.entries(IMAGE_FORMATS).map(([ext, info]) => (
              <span key={ext} className="format-badge">.{ext}</span>
            ))}
          </div>
        </section>

        {/* Upload Zone */}
        {files.length === 0 && (
          <div 
            className={`upload-zone ${isDragging ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <div className="upload-icon" style={{ background: 'linear-gradient(135deg, #f39c12, #e74c3c)' }}>
              <i className="fas fa-images"></i>
            </div>
            <h3>Drop your images here</h3>
            <p>or click to browse from your computer</p>
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

        {/* Loading State */}
        {isLoading && (
          <div className="loading show">
            <div className="spinner"></div>
            <p>Converting images...</p>
          </div>
        )}

        {/* Preview Section */}
        {previews.length > 0 && !isLoading && results.length === 0 && (
          <div className="file-card show">
            <div className="file-card-header">
              <div className="file-name">
                <div className="file-icon" style={{ background: 'linear-gradient(135deg, #f39c12, #e74c3c)' }}>
                  <i className="fas fa-images"></i>
                </div>
                <div>
                  <h3>{files.length} Images Selected</h3>
                  <p>Ready to convert</p>
                </div>
              </div>
              <button className="upload-btn" onClick={resetConverter}>
                <i className="fas fa-redo"></i>
                Reset
              </button>
            </div>
            
            <div className="image-previews">
              {previews.slice(0, 6).map((preview, idx) => (
                <div key={idx} className="preview-thumb">
                  <img src={preview.dataUrl} alt={preview.name} />
                  <span>{preview.name}</span>
                  <span className="size">{formatSize(preview.size)}</span>
                </div>
              ))}
              {previews.length > 6 && (
                <div className="more-images">+{previews.length - 6} more</div>
              )}
            </div>
          </div>
        )}

        {/* Conversion Options */}
        {files.length > 0 && !isLoading && results.length === 0 && (
          <div className="conversion-section show">
            <h3 className="section-title">
              <i className="fas fa-exchange-alt"></i>
              Convert To
            </h3>
            
            <div className="format-grid">
              {Object.entries(IMAGE_FORMATS).map(([ext, info]) => (
                <div 
                  key={ext}
                  className={`format-option ${targetFormat === ext ? 'selected' : ''}`}
                  onClick={() => setTargetFormat(ext)}
                >
                  <i className="fas fa-file-image"></i>
                  <div className="name">{info.name}</div>
                  <div className="desc">{info.desc}</div>
                </div>
              ))}
            </div>
            
            {/* Quality Slider for JPEG/WebP */}
            {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
              <div className="quality-section">
                <h4>Quality: {Math.round(quality * 100)}%</h4>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.1" 
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="quality-slider"
                />
                <div className="quality-labels">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}
            
            <button 
              className="convert-btn" 
              onClick={convertImages}
              style={{ background: 'linear-gradient(135deg, #f39c12, #e74c3c)' }}
            >
              <i className="fas fa-magic"></i>
              Convert {files.length} Image{files.length > 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="result-card show">
            <div className="result-icon">
              <i className="fas fa-check"></i>
            </div>
            <h3>Conversion Complete!</h3>
            <p>{results.length} images converted successfully</p>
            
            <div className="results-grid">
              {results.map((result, idx) => (
                <div key={idx} className="result-item">
                  <img src={result.dataUrl} alt={result.name} />
                  <div className="result-info">
                    <span className="name">{result.name}</span>
                    <span className="size">
                      {formatSize(result.originalSize)} → {formatSize(result.newSize)}
                      <span className={result.newSize < result.originalSize ? 'smaller' : 'larger'}>
                        ({result.newSize < result.originalSize ? '-' : '+'}
                        {Math.abs(Math.round((1 - result.newSize / result.originalSize) * 100))}%)
                      </span>
                    </span>
                  </div>
                  <button className="download-item-btn" onClick={() => downloadImage(result)}>
                    <i className="fas fa-download"></i>
                  </button>
                </div>
              ))}
            </div>
            
            <button className="download-btn" onClick={downloadAll}>
              <i className="fas fa-download"></i>
              Download {results.length > 1 ? 'All' : 'Image'}
            </button>
            
            <button className="upload-btn" onClick={resetConverter} style={{ marginTop: '15px' }}>
              <i className="fas fa-redo"></i>
              Convert More
            </button>
          </div>
        )}
      </div>

      <footer>
        <p>Made with <span style={{ color: 'var(--secondary)' }}>❤</span> by FileConverter Pro | 
        Powered by Next.js & Vercel</p>
      </footer>

      {/* Toast */}
      {toast && (
        <div className={`toast show ${toast.type}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <style jsx>{`
        .image-previews {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        
        .preview-thumb {
          text-align: center;
        }
        
        .preview-thumb img {
          width: 100%;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid var(--glass-border);
        }
        
        .preview-thumb span {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .preview-thumb .size {
          color: var(--primary-light);
        }
        
        .more-images {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          height: 80px;
          color: var(--text-muted);
          font-size: 14px;
        }
        
        .quality-section {
          margin: 25px 0;
          padding: 20px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
        }
        
        .quality-section h4 {
          margin-bottom: 15px;
          color: var(--text-muted);
        }
        
        .quality-slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: var(--glass-bg);
          outline: none;
          -webkit-appearance: none;
        }
        
        .quality-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
        }
        
        .quality-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .result-item {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .result-item img {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 8px;
        }
        
        .result-info {
          flex: 1;
          min-width: 0;
        }
        
        .result-info .name {
          display: block;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .result-info .size {
          display: block;
          font-size: 10px;
          color: var(--text-muted);
        }
        
        .result-info .size .smaller {
          color: var(--success);
          margin-left: 4px;
        }
        
        .result-info .size .larger {
          color: var(--danger);
          margin-left: 4px;
        }
        
        .download-item-btn {
          background: var(--primary);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
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
