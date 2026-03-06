import React, { useEffect, useRef, useState } from 'react';

const LinkEditorPopover = ({
    initialUrl,
    onSubmit,
    onRemove,
    onClose,
    compact = false,
    title = 'Link',
    placeholder = 'https://example.com',
    submitLabel = 'Apply',
}) => {
    const [value, setValue] = useState(initialUrl || '');
    const inputRef = useRef(null);

    useEffect(() => {
        setValue(initialUrl || '');
    }, [initialUrl]);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleSubmit = () => {
        onSubmit(value.trim());
    };

    return (
        <div className={`link-popover ${compact ? 'compact' : ''}`} onClick={(event) => event.stopPropagation()}>
            <div className="link-popover-title">{title}</div>
            <input
                ref={inputRef}
                className="link-popover-input"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={placeholder}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleSubmit();
                    }

                    if (event.key === 'Escape') {
                        onClose();
                    }
                }}
            />
            <div className="link-popover-actions">
                <button className="link-popover-btn ghost" onClick={onClose}>Cancel</button>
                {initialUrl ? (
                    <button className="link-popover-btn ghost" onClick={onRemove}>Remove</button>
                ) : null}
                <button className="link-popover-btn primary" onClick={handleSubmit}>{submitLabel}</button>
            </div>

            <style>{`
                .link-popover {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    width: 280px;
                    padding: 12px;
                    border-radius: 10px;
                    border: 1px solid var(--editor-border);
                    background: var(--editor-ribbon-bg);
                    box-shadow: 0 12px 28px rgba(0,0,0,0.18);
                    z-index: 2000;
                }

                .link-popover.compact {
                    top: 0;
                    left: calc(100% + 8px);
                    width: 250px;
                }

                .link-popover-title {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    opacity: 0.7;
                    margin-bottom: 8px;
                }

                .link-popover-input {
                    width: 100%;
                    border-radius: 8px;
                    border: 1px solid var(--editor-border);
                    background: var(--editor-page-bg);
                    color: var(--editor-text-color);
                    padding: 9px 10px;
                    font: inherit;
                    font-size: 13px;
                    margin-bottom: 10px;
                }

                .link-popover-input:focus {
                    outline: none;
                    border-color: var(--color-accent);
                }

                .link-popover-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }

                .link-popover-btn {
                    border-radius: 8px;
                    padding: 7px 10px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    border: 1px solid var(--editor-border);
                }

                .link-popover-btn.ghost {
                    background: transparent;
                    color: var(--editor-text-color);
                }

                .link-popover-btn.primary {
                    background: var(--color-accent);
                    border-color: var(--color-accent);
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default LinkEditorPopover;
