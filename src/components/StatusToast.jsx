import React from 'react';

const StatusToast = ({ notice, onDismiss }) => {
  if (!notice?.message) {
    return null;
  }

  return (
    <div className={`status-toast ${notice.tone || 'info'}`} role="status" aria-live="polite">
      <span className="status-toast-message">{notice.message}</span>
      <button
        className="status-toast-dismiss"
        type="button"
        aria-label="Dismiss status"
        onClick={onDismiss}
      >
        ×
      </button>

      <style>{`
        .status-toast {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 3500;
          display: flex;
          align-items: center;
          gap: 12px;
          width: min(100vw - 24px, 420px);
          padding: 12px 14px;
          border-radius: 16px;
          border: 1px solid transparent;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
          backdrop-filter: blur(10px);
          color: white;
        }

        .status-toast.info {
          background: rgba(28, 90, 166, 0.94);
          border-color: rgba(180, 214, 255, 0.35);
        }

        .status-toast.success {
          background: rgba(32, 115, 67, 0.94);
          border-color: rgba(182, 255, 210, 0.35);
        }

        .status-toast.warning {
          background: rgba(140, 91, 18, 0.94);
          border-color: rgba(255, 223, 173, 0.4);
        }

        .status-toast.error {
          background: rgba(153, 27, 27, 0.94);
          border-color: rgba(255, 186, 186, 0.35);
        }

        .status-toast-message {
          flex: 1;
          font-size: 13px;
          line-height: 1.45;
        }

        .status-toast-dismiss {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          color: white;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        @media (max-width: 760px) {
          .status-toast {
            right: 12px;
            left: 12px;
            bottom: 12px;
            width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default StatusToast;
