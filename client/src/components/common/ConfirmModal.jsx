import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { SpinnerLoader } from '../Loaders';

export default function ConfirmModal({
  isOpen,
  title = 'ખાતરી કરો',
  message,
  confirmText = 'હા, રદ કરો',
  cancelText = 'ના, પાછા જાઓ',
  onConfirm,
  onCancel,
  loading = false,
  danger = true
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel animate-scale-up" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          color: danger ? 'var(--color-danger)' : 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <AlertTriangle size={28} />
        </div>

        <h3 className="modal-title" style={{ marginBottom: 8, justifyContent: 'center' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1 }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? <SpinnerLoader size={16} /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
