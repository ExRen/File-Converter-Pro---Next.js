'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { parseFile, convertToFormat, estimateMemory, SUPPORTED_FORMATS } from '@/lib/converter';

export default function Home() {
  const [uploadedData, setUploadedData] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnSelectionEnabled, setColumnSelectionEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFile = useCallback(async (file) => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const { data, columns, format } = await parseFile(file);
      
      setUploadedData(data);
      setFileInfo({
        name: file.name,
        format: format.toUpperCase(),
        rows: data.length,
        columns: columns.length,
        columnNames: columns,
        memoryKb: estimateMemory(data),
        preview: data.slice(0, 10)
      });
      setSelectedColumns([]);
      setColumnSelectionEnabled(false);
      showToast('File berhasil diupload!', 'success');
    } catch (error) {
      console.error('Error parsing file:', error);
      showToast(error.message || 'Gagal membaca file', 'error');
    }
    
    setIsLoading(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConvert = () => {
    if (!uploadedData || !selectedFormat) return;
    
    setIsLoading(true);
    
    try {
      const columnsToExport = columnSelectionEnabled && selectedColumns.length > 0 
        ? selectedColumns 
        : null;
      
      const result = convertToFormat(
        uploadedData, 
        columnsToExport, 
        selectedFormat, 
        fileInfo.name
      );
      
      setResult(result);
      showToast('Konversi berhasil!', 'success');
    } catch (error) {
      console.error('Error converting:', error);
      showToast(error.message || 'Gagal mengkonversi file', 'error');
    }
    
    setIsLoading(false);
  };

  const handleDownload = () => {
    if (!result) return;
    
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setUploadedData(null);
    setFileInfo(null);
    setSelectedFormat(null);
    setSelectedColumns([]);
    setColumnSelectionEnabled(false);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleColumn = (col) => {
    setSelectedColumns(prev => 
      prev.includes(col) 
        ? prev.filter(c => c !== col)
        : [...prev, col]
    );
  };

  const formatBadges = Object.keys(SUPPORTED_FORMATS);

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
          <div className="logo-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>FileConverter<span style={{ color: 'var(--secondary)' }}>Pro</span></span>
        </div>
        <nav className="nav-links">
          <Link href="/" className="active"><i className="fas fa-exchange-alt"></i> File Converter</Link>
          <Link href="/pdf-tools"><i className="fas fa-file-pdf"></i> PDF Tools</Link>
        </nav>
      </header>

      <div className="container">
        <section className="hero">
          <h1>Transform Your Data<br />In Seconds</h1>
          <p>Convert between CSV, Excel, JSON, HTML, Markdown, XML and more with our powerful, beautiful converter tool.</p>
          <div className="format-badges">
            {formatBadges.map(ext => (
              <span key={ext} className="format-badge">.{ext}</span>
            ))}
          </div>
        </section>

        {/* Upload Zone */}
        {!fileInfo && (
          <div 
            className={`upload-zone ${isDragging ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <h3>Drop your file here</h3>
            <p>or click to browse from your computer</p>
            <button className="upload-btn">
              <i className="fas fa-folder-open"></i>
              Browse Files
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv,.xlsx,.xls,.json,.tsv,.html,.xml"
              onChange={(e) => e.target.files.length && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="loading show">
            <div className="spinner"></div>
            <p>Processing your file...</p>
          </div>
        )}

        {/* File Info Card */}
        {fileInfo && !isLoading && (
          <div className="file-card show">
            <div className="file-card-header">
              <div className="file-name">
                <div className="file-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div>
                  <h3>{fileInfo.name}</h3>
                  <p>{fileInfo.format} Format</p>
                </div>
              </div>
              <button className="upload-btn" onClick={resetUpload}>
                <i className="fas fa-redo"></i>
                New File
              </button>
            </div>
            <div className="file-stats">
              <div className="stat-item">
                <div className="number">{fileInfo.rows.toLocaleString()}</div>
                <div className="label">Rows</div>
              </div>
              <div className="stat-item">
                <div className="number">{fileInfo.columns}</div>
                <div className="label">Columns</div>
              </div>
              <div className="stat-item">
                <div className="number">{fileInfo.memoryKb.toFixed(1)}</div>
                <div className="label">KB Memory</div>
              </div>
            </div>
          </div>
        )}

        {/* Data Preview */}
        {fileInfo && !isLoading && !result && (
          <div className="preview-section show">
            <h3 className="section-title">
              <i className="fas fa-table"></i>
              Data Preview
            </h3>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    {fileInfo.columnNames.map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileInfo.preview.map((row, idx) => (
                    <tr key={idx}>
                      {fileInfo.columnNames.map(col => (
                        <td key={col} title={String(row[col] || '')}>
                          {String(row[col] || '').slice(0, 100)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Conversion Options */}
        {fileInfo && !isLoading && !result && (
          <div className="conversion-section show">
            <h3 className="section-title">
              <i className="fas fa-exchange-alt"></i>
              Choose Output Format
            </h3>
            <div className="format-grid">
              {Object.entries(SUPPORTED_FORMATS).map(([ext, info]) => (
                <div 
                  key={ext}
                  className={`format-option ${selectedFormat === ext ? 'selected' : ''} ${!info.write ? 'disabled' : ''}`}
                  onClick={() => info.write && setSelectedFormat(ext)}
                >
                  <i className={`fas ${info.icon}`}></i>
                  <div className="name">{info.name}</div>
                  <div className="desc">{info.desc}</div>
                </div>
              ))}
            </div>

            {/* Column Selection */}
            <div className="columns-section">
              <div className="column-toggle">
                <div 
                  className={`toggle-switch ${columnSelectionEnabled ? 'active' : ''}`}
                  onClick={() => {
                    setColumnSelectionEnabled(!columnSelectionEnabled);
                    if (columnSelectionEnabled) setSelectedColumns([]);
                  }}
                ></div>
                <span>Select specific columns</span>
              </div>
              {columnSelectionEnabled && (
                <div className="columns-list show">
                  {fileInfo.columnNames.map(col => (
                    <div 
                      key={col}
                      className={`column-chip ${selectedColumns.includes(col) ? 'selected' : ''}`}
                      onClick={() => toggleColumn(col)}
                    >
                      {col}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              className="convert-btn" 
              disabled={!selectedFormat}
              onClick={handleConvert}
            >
              <i className="fas fa-magic"></i>
              Convert File
            </button>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="result-card show">
            <div className="result-icon">
              <i className="fas fa-check"></i>
            </div>
            <h3>Conversion Complete!</h3>
            <p>
              {result.rows.toLocaleString()} rows, {result.columns} columns • {(result.size / 1024).toFixed(2)} KB
            </p>
            <button className="download-btn" onClick={handleDownload}>
              <i className="fas fa-download"></i>
              Download File
            </button>
          </div>
        )}
      </div>

      <footer>
        <p>Made with <span style={{ color: 'var(--secondary)' }}>❤</span> by FileConverter Pro | 
        Powered by Next.js & Vercel</p>
      </footer>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast show ${toast.type}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
