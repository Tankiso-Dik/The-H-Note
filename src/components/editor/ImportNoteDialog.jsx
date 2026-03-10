import React, { useEffect } from 'react';

const ImportNoteDialog = ({
    open,
    fileName,
    currentNoteTitle,
    importNotice,
    onImportAsNew,
    onReplaceCurrent,
    onCancel,
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
        <div className="import-dialog-overlay" onClick={onCancel} role="presentation">
            <div
                className="import-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-dialog-title"
                onClick={(event) => event.stopPropagation()}
            >
                <h2 id="import-dialog-title" className="import-dialog-title">Import file</h2>
                <p className="import-dialog-message">
                    Choose how to import <strong>{fileName}</strong>.
                </p>
                <p className="import-dialog-details">
                    Replace <strong>{currentNoteTitle || 'this note'}</strong> or create a new note in the same folder.
                </p>
                {importNotice ? (
                    <p className="import-dialog-notice">{importNotice}</p>
                ) : null}
                <div className="import-dialog-actions">
                    <button className="import-dialog-btn ghost" type="button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="import-dialog-btn ghost" type="button" onClick={onReplaceCurrent}>
                        Replace current
                    </button>
                    <button className="import-dialog-btn primary" type="button" onClick={onImportAsNew}>
                        Import as new note
                    </button>
                </div>
            </div>

            <style>{`
                .import-dialog-overlay {
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

                .import-dialog {
                    width: min(100%, 460px);
                    border-radius: 20px;
                    border: 1px solid color-mix(in srgb, var(--editor-border) 84%, transparent);
                    background: color-mix(in srgb, var(--editor-page-bg) 96%, white 4%);
                    color: var(--editor-text-color);
                    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.24);
                    padding: 22px 22px 18px;
                }

                .import-dialog-title {
                    margin: 0 0 10px;
                    font-size: 18px;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .import-dialog-message,
                .import-dialog-details,
                .import-dialog-notice {
                    margin: 0;
                    line-height: 1.5;
                }

                .import-dialog-message {
                    font-size: 14px;
                }

                .import-dialog-details,
                .import-dialog-notice {
                    margin-top: 8px;
                    font-size: 12px;
                    opacity: 0.82;
                }

                .import-dialog-notice {
                    color: color-mix(in srgb, var(--editor-text-color) 78%, #a16207);
                }

                .import-dialog-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 18px;
                    flex-wrap: wrap;
                }

                .import-dialog-btn {
                    min-height: 40px;
                    border-radius: 999px;
                    border: 1px solid var(--editor-border);
                    padding: 0 16px;
                    font: inherit;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .import-dialog-btn.ghost {
                    background: transparent;
                    color: var(--editor-text-color);
                }

                .import-dialog-btn.primary {
                    background: var(--color-accent);
                    border-color: var(--color-accent);
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default ImportNoteDialog;
