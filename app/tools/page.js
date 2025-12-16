'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';

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
    showToast('QR Code downloaded!');
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
    { id: 'qrcode', name: 'QR Code Generator', icon: 'fa-qrcode', color: '#9b59b6' },
    { id: 'json', name: 'JSON Formatter', icon: 'fa-code', color: '#f39c12' },
    { id: 'base64', name: 'Base64 Encoder', icon: 'fa-lock', color: '#3498db' },
    { id: 'sql', name: 'SQL Generator', icon: 'fa-database', color: '#e74c3c' },
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
                      <button className="download-btn" onClick={downloadQR}>
                        <i className="fas fa-download"></i> Download PNG
                      </button>
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

        {/* SQL Generator - Coming Soon */}
        {activeTab === 'sql' && (
          <div className="tool-panel">
            <div className="coming-soon">
              <i className="fas fa-database"></i>
              <h3>SQL Generator</h3>
              <p>Convert CSV/JSON data to SQL INSERT statements</p>
              <span className="badge">Coming Soon</span>
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
      `}</style>
    </>
  );
}
