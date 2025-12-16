'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  PDF_TOOLS, 
  mergePDFs, 
  splitPDF, 
  extractPages,
  compressPDF, 
  rotatePDF, 
  imagesToPDF, 
  pdfToImages,
  addWatermark,
  addPageNumbers,
  getPDFInfo 
} from '@/lib/pdfTools';

export default function PDFToolsPage() {
  const [selectedTool, setSelectedTool] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Tool-specific options
  const [rotation, setRotation] = useState(90);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [pageNumberPosition, setPageNumberPosition] = useState('bottom-center');
  const [extractPageNumbers, setExtractPageNumbers] = useState('');
  
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFiles = useCallback(async (fileList) => {
    const filesArray = Array.from(fileList);
    setFiles(filesArray);
    setResult(null);
    
    // Get PDF info for first file
    if (filesArray.length > 0 && filesArray[0].type === 'application/pdf') {
      try {
        const info = await getPDFInfo(filesArray[0]);
        setPdfInfo(info);
      } catch (e) {
        setPdfInfo(null);
      }
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const processFiles = async () => {
    if (!selectedTool || files.length === 0) return;
    
    setIsLoading(true);
    setResult(null);
    
    try {
      let output;
      
      switch (selectedTool) {
        case 'merge':
          output = await mergePDFs(files);
          downloadBlob(output, 'merged.pdf');
          showToast('PDF berhasil digabung!');
          break;
          
        case 'split':
          const splitResult = await splitPDF(files[0]);
          setResult({ 
            type: 'split', 
            items: splitResult.results,
            totalPages: splitResult.totalPages 
          });
          showToast(`PDF berhasil dipecah menjadi ${splitResult.totalPages} halaman!`);
          break;
          
        case 'compress':
          const compressed = await compressPDF(files[0]);
          setResult({
            type: 'compress',
            blob: compressed.blob,
            originalSize: compressed.originalSize,
            newSize: compressed.newSize,
            reduction: compressed.reduction
          });
          showToast(`PDF berhasil dikompres! Pengurangan ${compressed.reduction}%`);
          break;
          
        case 'rotate':
          output = await rotatePDF(files[0], rotation);
          downloadBlob(output, 'rotated.pdf');
          showToast('PDF berhasil dirotasi!');
          break;
          
        case 'imgToPdf':
          output = await imagesToPDF(files);
          downloadBlob(output, 'images.pdf');
          showToast('Gambar berhasil dikonversi ke PDF!');
          break;
          
        case 'pdfToImg':
          const images = await pdfToImages(files[0]);
          setResult({ type: 'images', items: images });
          showToast(`${images.length} halaman berhasil dikonversi ke gambar!`);
          break;
          
        case 'watermark':
          output = await addWatermark(files[0], watermarkText);
          downloadBlob(output, 'watermarked.pdf');
          showToast('Watermark berhasil ditambahkan!');
          break;
          
        case 'pageNumbers':
          output = await addPageNumbers(files[0], { position: pageNumberPosition });
          downloadBlob(output, 'numbered.pdf');
          showToast('Nomor halaman berhasil ditambahkan!');
          break;
          
        case 'extract':
          const pageNums = extractPageNumbers.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
          if (pageNums.length === 0) {
            showToast('Masukkan nomor halaman yang valid!', 'error');
            break;
          }
          output = await extractPages(files[0], pageNums);
          downloadBlob(output, 'extracted.pdf');
          showToast('Halaman berhasil diekstrak!');
          break;
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      showToast(error.message || 'Terjadi kesalahan saat memproses PDF', 'error');
    }
    
    setIsLoading(false);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadItem = (item) => {
    downloadBlob(item.blob, item.name);
  };

  const downloadAllAsZip = async () => {
    if (!result || !result.items) return;
    
    // Download individually for now (would need JSZip for zip)
    for (const item of result.items) {
      downloadBlob(item.blob, item.name);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  const resetTool = () => {
    setFiles([]);
    setResult(null);
    setPdfInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getAcceptedFormats = () => {
    if (selectedTool === 'imgToPdf') return '.jpg,.jpeg,.png';
    return '.pdf';
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
          <div className="logo-icon">
            <i className="fas fa-file-pdf"></i>
          </div>
          <span>PDF<span style={{ color: 'var(--secondary)' }}>Tools</span></span>
        </div>
        <nav className="nav-links">
          <Link href="/"><i className="fas fa-exchange-alt"></i> File Converter</Link>
          <Link href="/pdf-tools" className="active"><i className="fas fa-file-pdf"></i> PDF Tools</Link>
        </nav>
      </header>

      <div className="container">
        <section className="hero">
          <h1>PDF Tools<br />All-in-One</h1>
          <p>Gabung, pecah, kompres, rotasi, dan konversi PDF dengan mudah. Semua proses dilakukan di browser Anda!</p>
        </section>

        {/* Tool Selection */}
        {!selectedTool && (
          <div className="pdf-tools-grid">
            {Object.entries(PDF_TOOLS).map(([key, tool]) => (
              <div 
                key={key}
                className="pdf-tool-card"
                onClick={() => setSelectedTool(key)}
                style={{ '--tool-color': tool.color }}
              >
                <div className="tool-icon" style={{ background: tool.color }}>
                  <i className={`fas ${tool.icon}`}></i>
                </div>
                <h3>{tool.name}</h3>
                <p>{tool.desc}</p>
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
                <i className={`fas ${PDF_TOOLS[selectedTool].icon}`} style={{ color: PDF_TOOLS[selectedTool].color }}></i>
                {PDF_TOOLS[selectedTool].name}
              </h2>
            </div>

            {/* File Upload Zone */}
            {files.length === 0 && (
              <div 
                className={`upload-zone ${isDragging ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
              >
                <div className="upload-icon" style={{ background: PDF_TOOLS[selectedTool].color }}>
                  <i className={`fas ${PDF_TOOLS[selectedTool].icon}`}></i>
                </div>
                <h3>Drop your {selectedTool === 'imgToPdf' ? 'images' : 'PDF'} here</h3>
                <p>or click to browse from your computer</p>
                <button className="upload-btn">
                  <i className="fas fa-folder-open"></i>
                  Browse Files
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept={getAcceptedFormats()}
                  multiple={PDF_TOOLS[selectedTool].multiple}
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
            )}

            {/* File Info */}
            {files.length > 0 && !result && (
              <div className="file-card show">
                <div className="file-card-header">
                  <div className="file-name">
                    <div className="file-icon" style={{ background: PDF_TOOLS[selectedTool].color }}>
                      <i className="fas fa-file-pdf"></i>
                    </div>
                    <div>
                      <h3>{files.length === 1 ? files[0].name : `${files.length} files selected`}</h3>
                      <p>{files.length === 1 ? `${(files[0].size / 1024).toFixed(1)} KB` : ''}</p>
                    </div>
                  </div>
                  <button className="upload-btn" onClick={resetTool}>
                    <i className="fas fa-redo"></i>
                    Ganti File
                  </button>
                </div>
                
                {pdfInfo && (
                  <div className="file-stats">
                    <div className="stat-item">
                      <div className="number">{pdfInfo.pageCount}</div>
                      <div className="label">Halaman</div>
                    </div>
                    <div className="stat-item">
                      <div className="number">{(files[0].size / 1024).toFixed(0)}</div>
                      <div className="label">KB</div>
                    </div>
                  </div>
                )}

                {/* Tool-specific options */}
                {selectedTool === 'rotate' && (
                  <div className="tool-options">
                    <h4>Rotasi</h4>
                    <div className="rotation-options">
                      {[90, 180, 270].map(deg => (
                        <button 
                          key={deg}
                          className={`option-btn ${rotation === deg ? 'selected' : ''}`}
                          onClick={() => setRotation(deg)}
                        >
                          <i className="fas fa-undo" style={{ transform: `rotate(${deg}deg)` }}></i>
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTool === 'watermark' && (
                  <div className="tool-options">
                    <h4>Teks Watermark</h4>
                    <input 
                      type="text" 
                      className="text-input"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Masukkan teks watermark"
                    />
                  </div>
                )}

                {selectedTool === 'pageNumbers' && (
                  <div className="tool-options">
                    <h4>Posisi Nomor Halaman</h4>
                    <div className="position-grid">
                      {['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                        <button 
                          key={pos}
                          className={`option-btn ${pageNumberPosition === pos ? 'selected' : ''}`}
                          onClick={() => setPageNumberPosition(pos)}
                        >
                          {pos.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTool === 'extract' && (
                  <div className="tool-options">
                    <h4>Halaman yang Diekstrak</h4>
                    <input 
                      type="text" 
                      className="text-input"
                      value={extractPageNumbers}
                      onChange={(e) => setExtractPageNumbers(e.target.value)}
                      placeholder="Contoh: 1, 3, 5-7"
                    />
                    <p className="hint">Masukkan nomor halaman dipisahkan koma</p>
                  </div>
                )}

                <button 
                  className="convert-btn" 
                  onClick={processFiles}
                  disabled={isLoading}
                  style={{ background: `linear-gradient(135deg, ${PDF_TOOLS[selectedTool].color}, var(--secondary))` }}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner-small"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className={`fas ${PDF_TOOLS[selectedTool].icon}`}></i>
                      {PDF_TOOLS[selectedTool].name}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="result-card show">
                <div className="result-icon">
                  <i className="fas fa-check"></i>
                </div>
                <h3>Proses Selesai!</h3>
                
                {result.type === 'compress' && (
                  <div className="compress-result">
                    <p>Ukuran asli: {(result.originalSize / 1024).toFixed(1)} KB</p>
                    <p>Ukuran baru: {(result.newSize / 1024).toFixed(1)} KB</p>
                    <p className="reduction">Pengurangan: {result.reduction}%</p>
                    <button className="download-btn" onClick={() => downloadBlob(result.blob, 'compressed.pdf')}>
                      <i className="fas fa-download"></i> Download
                    </button>
                  </div>
                )}
                
                {result.type === 'split' && (
                  <div className="split-result">
                    <p>{result.items.length} halaman dipisahkan</p>
                    <div className="items-grid">
                      {result.items.map((item, idx) => (
                        <button key={idx} className="item-btn" onClick={() => downloadItem(item)}>
                          <i className="fas fa-file-pdf"></i> {item.name}
                        </button>
                      ))}
                    </div>
                    <button className="download-btn" onClick={downloadAllAsZip}>
                      <i className="fas fa-download"></i> Download Semua
                    </button>
                  </div>
                )}
                
                {result.type === 'images' && (
                  <div className="images-result">
                    <p>{result.items.length} halaman dikonversi ke gambar</p>
                    <div className="images-preview">
                      {result.items.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="image-thumb" onClick={() => downloadItem(item)}>
                          <img src={item.dataUrl} alt={item.name} />
                          <span>{item.name}</span>
                        </div>
                      ))}
                      {result.items.length > 4 && <span className="more">+{result.items.length - 4} more</span>}
                    </div>
                    <button className="download-btn" onClick={downloadAllAsZip}>
                      <i className="fas fa-download"></i> Download Semua
                    </button>
                  </div>
                )}
                
                <button className="upload-btn" onClick={resetTool} style={{ marginTop: '20px' }}>
                  <i className="fas fa-redo"></i> Proses File Lain
                </button>
              </div>
            )}
          </>
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
        .pdf-tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .pdf-tool-card {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 30px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .pdf-tool-card:hover {
          transform: translateY(-5px);
          border-color: var(--tool-color);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .tool-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          font-size: 24px;
          color: white;
        }
        
        .pdf-tool-card h3 {
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        .pdf-tool-card p {
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
          font-size: 28px;
        }
        
        .back-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .back-btn:hover {
          background: var(--primary);
          border-color: var(--primary);
        }
        
        .tool-options {
          margin: 20px 0;
          padding: 20px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
        }
        
        .tool-options h4 {
          margin-bottom: 15px;
          font-size: 14px;
          color: var(--text-muted);
        }
        
        .rotation-options, .position-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .option-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .option-btn.selected {
          background: var(--primary);
          border-color: var(--primary);
        }
        
        .option-btn:hover:not(.selected) {
          border-color: var(--primary);
        }
        
        .text-input {
          width: 100%;
          padding: 12px 16px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          color: var(--text);
          font-size: 16px;
        }
        
        .text-input:focus {
          outline: none;
          border-color: var(--primary);
        }
        
        .hint {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 8px;
        }
        
        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .compress-result, .split-result, .images-result {
          margin: 20px 0;
        }
        
        .compress-result p, .split-result p, .images-result p {
          margin-bottom: 10px;
        }
        
        .reduction {
          font-size: 24px;
          font-weight: 700;
          color: var(--success);
        }
        
        .items-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 20px 0;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .item-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .item-btn:hover {
          background: var(--primary);
          border-color: var(--primary);
        }
        
        .images-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          justify-content: center;
          margin: 20px 0;
        }
        
        .image-thumb {
          width: 100px;
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        
        .image-thumb:hover {
          transform: scale(1.05);
        }
        
        .image-thumb img {
          width: 100%;
          border-radius: 8px;
          border: 1px solid var(--glass-border);
        }
        
        .image-thumb span {
          font-size: 10px;
          color: var(--text-muted);
        }
        
        .more {
          color: var(--text-muted);
          align-self: center;
        }
        
        .nav-links a.active {
          color: var(--primary-light);
        }
      `}</style>
    </>
  );
}
