'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { parseFile, convertToFormat, SUPPORTED_FORMATS } from '@/lib/converter';

export default function BatchConverterPage() {
  const [files, setFiles] = useState([]);
  const [parsedFiles, setParsedFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState('csv');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFiles = useCallback(async (fileList) => {
    const filesArray = Array.from(fileList).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return Object.keys(SUPPORTED_FORMATS).includes(ext) || ['xls', 'yml'].includes(ext);
    });
    
    if (filesArray.length === 0) {
      showToast('Tidak ada file yang didukung. Pilih file CSV, Excel, JSON, dll.', 'error');
      return;
    }
    
    setFiles(filesArray);
    setResults([]);
    setIsLoading(true);
    
    // Parse all files
    const parsed = [];
    for (let i = 0; i < filesArray.length; i++) {
      try {
        const file = filesArray[i];
        const result = await parseFile(file);
        parsed.push({
          file,
          name: file.name,
          format: result.format.toUpperCase(),
          rows: result.data.length,
          columns: result.columns.length,
          data: result.data,
          columnNames: result.columns,
          status: 'ready',
          error: null
        });
      } catch (error) {
        parsed.push({
          file: filesArray[i],
          name: filesArray[i].name,
          format: 'Unknown',
          rows: 0,
          columns: 0,
          data: null,
          columnNames: [],
          status: 'error',
          error: error.message
        });
      }
      setProgress(((i + 1) / filesArray.length) * 100);
    }
    
    setParsedFiles(parsed);
    setIsLoading(false);
    setProgress(0);
    showToast(`${parsed.filter(p => p.status === 'ready').length} dari ${filesArray.length} file berhasil diparse!`);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setParsedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertAll = async () => {
    if (parsedFiles.length === 0) return;
    
    setIsProcessing(true);
    setResults([]);
    
    const validFiles = parsedFiles.filter(p => p.status === 'ready');
    const convertedResults = [];
    
    for (let i = 0; i < validFiles.length; i++) {
      try {
        const pf = validFiles[i];
        const result = await convertToFormat(pf.data, null, targetFormat, pf.name);
        convertedResults.push({
          ...result,
          originalName: pf.name,
          originalFormat: pf.format,
          status: 'success'
        });
      } catch (error) {
        convertedResults.push({
          originalName: validFiles[i].name,
          originalFormat: validFiles[i].format,
          status: 'error',
          error: error.message
        });
      }
      setProgress(((i + 1) / validFiles.length) * 100);
    }
    
    setResults(convertedResults);
    setIsProcessing(false);
    setProgress(0);
    
    const successCount = convertedResults.filter(r => r.status === 'success').length;
    showToast(`${successCount} dari ${validFiles.length} file berhasil dikonversi!`);
  };

  const downloadFile = (result) => {
    if (!result.blob) return;
    
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    const successResults = results.filter(r => r.status === 'success');
    
    for (const result of successResults) {
      downloadFile(result);
      await new Promise(r => setTimeout(r, 300));
    }
    
    showToast(`${successResults.length} file downloaded!`);
  };

  const resetConverter = () => {
    setFiles([]);
    setParsedFiles([]);
    setResults([]);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const writableFormats = Object.entries(SUPPORTED_FORMATS)
    .filter(([_, info]) => info.write)
    .map(([ext, info]) => ({ ext, ...info }));

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
            <i className="fas fa-layer-group"></i>
          </div>
          <span>Batch<span style={{ color: 'var(--secondary)' }}>Converter</span></span>
        </div>
        <nav className="nav-links">
          <Link href="/"><i className="fas fa-exchange-alt"></i> File Converter</Link>
          <Link href="/pdf-tools"><i className="fas fa-file-pdf"></i> PDF Tools</Link>
          <Link href="/image-converter"><i className="fas fa-images"></i> Image</Link>
          <Link href="/batch-converter" className="active"><i className="fas fa-layer-group"></i> Batch</Link>
        </nav>
      </header>

      <div className="container">
        <section className="hero">
          <h1>Batch Converter</h1>
          <p>Upload dan konversi banyak dokumen sekaligus ke format yang sama. Hemat waktu dengan proses batch!</p>
          <div className="format-badges">
            {Object.keys(SUPPORTED_FORMATS).slice(0, 6).map(ext => (
              <span key={ext} className="format-badge">.{ext}</span>
            ))}
            <span className="format-badge">+{Object.keys(SUPPORTED_FORMATS).length - 6} more</span>
          </div>
        </section>

        {/* Upload Zone */}
        {parsedFiles.length === 0 && !isLoading && (
          <div 
            className={`upload-zone ${isDragging ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <div className="upload-icon" style={{ background: 'linear-gradient(135deg, #9b59b6, #3498db)' }}>
              <i className="fas fa-layer-group"></i>
            </div>
            <h3>Drop multiple files here</h3>
            <p>or click to browse from your computer</p>
            <p className="hint">Supports: CSV, Excel, JSON, YAML, XML, HTML, TXT, DOCX, INI, TSV</p>
            <button className="upload-btn">
              <i className="fas fa-folder-open"></i>
              Browse Files
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv,.xlsx,.xls,.json,.tsv,.html,.xml,.yaml,.yml,.txt,.docx,.ini"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="loading show">
            <div className="spinner"></div>
            <p>Parsing files... {Math.round(progress)}%</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {/* File List */}
        {parsedFiles.length > 0 && !isLoading && results.length === 0 && (
          <div className="file-card show">
            <div className="file-card-header">
              <div className="file-name">
                <div className="file-icon" style={{ background: 'linear-gradient(135deg, #9b59b6, #3498db)' }}>
                  <i className="fas fa-layer-group"></i>
                </div>
                <div>
                  <h3>{parsedFiles.length} Files Ready</h3>
                  <p>{parsedFiles.filter(p => p.status === 'ready').length} valid, {parsedFiles.filter(p => p.status === 'error').length} errors</p>
                </div>
              </div>
              <button className="upload-btn" onClick={resetConverter}>
                <i className="fas fa-redo"></i>
                Reset
              </button>
            </div>
            
            <div className="files-list">
              {parsedFiles.map((pf, idx) => (
                <div key={idx} className={`file-item ${pf.status}`}>
                  <div className="file-item-icon">
                    <i className={`fas ${pf.status === 'ready' ? 'fa-file-alt' : 'fa-exclamation-triangle'}`}></i>
                  </div>
                  <div className="file-item-info">
                    <span className="name">{pf.name}</span>
                    <span className="meta">
                      {pf.format} • {pf.rows} rows • {pf.columns} columns
                    </span>
                    {pf.error && <span className="error">{pf.error}</span>}
                  </div>
                  <button className="remove-btn" onClick={() => removeFile(idx)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversion Options */}
        {parsedFiles.length > 0 && !isLoading && results.length === 0 && (
          <div className="conversion-section show">
            <h3 className="section-title">
              <i className="fas fa-exchange-alt"></i>
              Convert All To
            </h3>
            
            <div className="format-grid">
              {writableFormats.map(({ ext, name, desc, icon }) => (
                <div 
                  key={ext}
                  className={`format-option ${targetFormat === ext ? 'selected' : ''}`}
                  onClick={() => setTargetFormat(ext)}
                >
                  <i className={`fas ${icon}`}></i>
                  <div className="name">{name}</div>
                  <div className="desc">{desc}</div>
                </div>
              ))}
            </div>
            
            <button 
              className="convert-btn" 
              onClick={convertAll}
              disabled={isProcessing || parsedFiles.filter(p => p.status === 'ready').length === 0}
              style={{ background: 'linear-gradient(135deg, #9b59b6, #3498db)' }}
            >
              {isProcessing ? (
                <>
                  <div className="spinner-small"></div>
                  Converting... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  Convert {parsedFiles.filter(p => p.status === 'ready').length} Files
                </>
              )}
            </button>
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="loading show">
            <div className="spinner"></div>
            <p>Converting files... {Math.round(progress)}%</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="result-card show">
            <div className="result-icon">
              <i className="fas fa-check"></i>
            </div>
            <h3>Batch Conversion Complete!</h3>
            <p>
              {results.filter(r => r.status === 'success').length} of {results.length} files converted successfully
            </p>
            
            <div className="results-list">
              {results.map((result, idx) => (
                <div key={idx} className={`result-item ${result.status}`}>
                  <div className="result-item-icon">
                    <i className={`fas ${result.status === 'success' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                  </div>
                  <div className="result-item-info">
                    <span className="name">{result.filename || result.originalName}</span>
                    <span className="meta">
                      {result.originalFormat} → {targetFormat.toUpperCase()}
                      {result.rows && ` • ${result.rows} rows`}
                      {result.size && ` • ${formatSize(result.size)}`}
                    </span>
                    {result.error && <span className="error">{result.error}</span>}
                  </div>
                  {result.status === 'success' && (
                    <button className="download-item-btn" onClick={() => downloadFile(result)}>
                      <i className="fas fa-download"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button className="download-btn" onClick={downloadAll}>
              <i className="fas fa-download"></i>
              Download All ({results.filter(r => r.status === 'success').length} files)
            </button>
            
            <button className="upload-btn" onClick={resetConverter} style={{ marginTop: '15px' }}>
              <i className="fas fa-redo"></i>
              Convert More Files
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
        .hint {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 10px;
        }
        
        .progress-bar {
          width: 200px;
          height: 6px;
          background: var(--glass-bg);
          border-radius: 3px;
          margin-top: 15px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--secondary));
          transition: width 0.3s ease;
        }
        
        .files-list, .results-list {
          max-height: 300px;
          overflow-y: auto;
          margin-top: 20px;
        }
        
        .file-item, .result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          margin-bottom: 8px;
        }
        
        .file-item.error {
          border-left: 3px solid var(--danger);
        }
        
        .file-item.ready {
          border-left: 3px solid var(--success);
        }
        
        .result-item.success {
          border-left: 3px solid var(--success);
        }
        
        .result-item.error {
          border-left: 3px solid var(--danger);
        }
        
        .file-item-icon, .result-item-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--glass-bg);
          font-size: 14px;
        }
        
        .file-item.ready .file-item-icon {
          color: var(--success);
        }
        
        .file-item.error .file-item-icon {
          color: var(--danger);
        }
        
        .result-item.success .result-item-icon {
          color: var(--success);
        }
        
        .result-item.error .result-item-icon {
          color: var(--danger);
        }
        
        .file-item-info, .result-item-info {
          flex: 1;
          min-width: 0;
        }
        
        .file-item-info .name, .result-item-info .name {
          display: block;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .file-item-info .meta, .result-item-info .meta {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        
        .file-item-info .error, .result-item-info .error {
          display: block;
          font-size: 11px;
          color: var(--danger);
          margin-top: 2px;
        }
        
        .remove-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px;
          transition: all 0.3s ease;
        }
        
        .remove-btn:hover {
          color: var(--danger);
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
      `}</style>
    </>
  );
}
