import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Ya, Lanjutkan", confirmType = "primary", isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: confirmType === 'danger' ? '#fef2f2' : '#eff6ff',
              color: confirmType === 'danger' ? '#dc2626' : '#2563eb',
              border: confirmType === 'danger' ? '1px solid #fecaca' : '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertCircle size={20} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{title}</h3>
          </div>
        </div>
        <div className="modal-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          {message}
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn btn-${confirmType}`}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
