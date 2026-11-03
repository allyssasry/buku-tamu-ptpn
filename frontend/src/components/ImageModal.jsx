import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

const ImageModal = ({ isOpen, onClose, src, title = "Dokumentasi Foto" }) => {
  if (!isOpen || !src) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 840, background: '#ffffff', border: '1px solid #cbd5e1' }}
      >
        <div className="modal-header">
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              title="Buka Gambar Asli di Tab Baru"
            >
              <ExternalLink size={14} />
            </a>
            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div style={{ padding: 16, display: 'flex', justifyContent: 'center', background: '#f8fafc', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
          <img
            src={src}
            alt={title}
            style={{
              maxWidth: '100%',
              maxHeight: '75vh',
              objectFit: 'contain',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
