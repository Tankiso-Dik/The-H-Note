import React, { useEffect } from 'react';

const ConfirmDialog = ({
  open,
  title,
  message,
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel} role="presentation">
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">{title}</h2>
        <p className="confirm-dialog-message">{message}</p>
        {details ? <p className="confirm-dialog-details">{details}</p> : null}
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-btn ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`confirm-dialog-btn ${destructive ? 'destructive' : 'primary'}`}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        .confirm-dialog-overlay {
          position: fixed;
          inset: 0;
          z-index: 4000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.34);
          backdrop-filter: blur(8px);
        }

        .confirm-dialog {
          width: min(100%, 420px);
          border-radius: 20px;
          border: 1px solid color-mix(in srgb, var(--editor-border) 84%, transparent);
          background: color-mix(in srgb, var(--editor-page-bg) 96%, white 4%);
          color: var(--editor-text-color);
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.24);
          padding: 22px 22px 18px;
        }

        .confirm-dialog-title {
          margin: 0 0 10px;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.2;
        }

        .confirm-dialog-message,
        .confirm-dialog-details {
          margin: 0;
          line-height: 1.5;
        }

        .confirm-dialog-message {
          font-size: 14px;
        }

        .confirm-dialog-details {
          margin-top: 8px;
          font-size: 12px;
          opacity: 0.78;
        }

        .confirm-dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .confirm-dialog-btn {
          min-height: 40px;
          border-radius: 999px;
          border: 1px solid var(--editor-border);
          padding: 0 16px;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .confirm-dialog-btn.ghost {
          background: transparent;
          color: var(--editor-text-color);
        }

        .confirm-dialog-btn.primary {
          background: var(--color-accent);
          border-color: var(--color-accent);
          color: white;
        }

        .confirm-dialog-btn.destructive {
          background: #c62828;
          border-color: #c62828;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;
