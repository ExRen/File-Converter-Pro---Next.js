'use client';

import { useState, useEffect } from 'react';

const MAX_HISTORY = 10;

export default function RecentFiles({ onFileSelect }) {
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('recentFiles');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('recentFiles');
    setHistory([]);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (type) => {
    const icons = {
      csv: 'fa-file-csv',
      xlsx: 'fa-file-excel',
      json: 'fa-file-code',
      xml: 'fa-file-code',
      pdf: 'fa-file-pdf',
      image: 'fa-file-image',
      default: 'fa-file'
    };
    return icons[type] || icons.default;
  };

  if (history.length === 0) return null;

  return (
    <div className="recent-files-container">
      <button 
        className="recent-files-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fas fa-history"></i>
        Recent Files
        <span className="count">{history.length}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </button>

      {isOpen && (
        <div className="recent-files-dropdown">
          <div className="recent-files-header">
            <span>Recent Conversions</span>
            <button className="clear-btn" onClick={clearHistory}>
              <i className="fas fa-trash"></i> Clear
            </button>
          </div>
          <div className="recent-files-list">
            {history.map((item, idx) => (
              <div 
                key={idx} 
                className="recent-file-item"
                onClick={() => onFileSelect && onFileSelect(item)}
              >
                <div className="file-icon-small">
                  <i className={`fas ${getFileIcon(item.type)}`}></i>
                </div>
                <div className="file-details">
                  <span className="file-name-small">{item.name}</span>
                  <span className="file-meta">
                    {item.fromFormat} → {item.toFormat} • {formatDate(item.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .recent-files-container {
          margin-bottom: 20px;
        }

        .recent-files-toggle {
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
          width: 100%;
        }

        .recent-files-toggle:hover {
          border-color: var(--primary);
        }

        .recent-files-toggle .count {
          background: var(--primary);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
          margin-left: auto;
        }

        .recent-files-dropdown {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          margin-top: 10px;
          overflow: hidden;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .recent-files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid var(--glass-border);
          font-weight: 600;
        }

        .clear-btn {
          background: transparent;
          border: 1px solid var(--danger);
          color: var(--danger);
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .clear-btn:hover {
          background: var(--danger);
          color: white;
        }

        .recent-files-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .recent-file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          cursor: pointer;
          transition: background 0.2s ease;
          border-bottom: 1px solid var(--glass-border);
        }

        .recent-file-item:last-child {
          border-bottom: none;
        }

        .recent-file-item:hover {
          background: rgba(99, 102, 241, 0.1);
        }

        .file-icon-small {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
        }

        .file-details {
          flex: 1;
          min-width: 0;
        }

        .file-name-small {
          display: block;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-meta {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

// Helper function to add file to history
export function addToRecentFiles(fileInfo) {
  const saved = localStorage.getItem('recentFiles');
  let history = [];
  
  try {
    history = saved ? JSON.parse(saved) : [];
  } catch (e) {
    history = [];
  }

  const newEntry = {
    name: fileInfo.name,
    fromFormat: fileInfo.fromFormat,
    toFormat: fileInfo.toFormat,
    type: fileInfo.type || 'default',
    timestamp: Date.now()
  };

  // Remove duplicates and add new entry at the beginning
  history = history.filter(item => item.name !== fileInfo.name);
  history.unshift(newEntry);
  
  // Keep only last MAX_HISTORY items
  history = history.slice(0, MAX_HISTORY);
  
  localStorage.setItem('recentFiles', JSON.stringify(history));
}
