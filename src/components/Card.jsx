import React, { useState, useEffect, useRef } from 'react';

const Card = ({ type, title, isSelected, isRenaming, isTemplate, onRename, onClick, onContextMenu }) => {
    const [name, setName] = useState(title);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const handleSubmit = () => {
        if (name.trim()) onRename(name);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <div
            className={`card ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
            onContextMenu={onContextMenu}
        >
            <div className="card-icon-area">
                {type === 'folder' ? (
                    // Windows 11 Style Folder (Mock SVG)
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6H12L10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z" fill="#FCE996" stroke="#F1C232" strokeWidth="0.5" />
                        <path d="M20 6H12L10 4H4V18H20V6Z" fill="#FCE996" fillOpacity="0.8" />
                    </svg>
                ) : (
                    // Note/Document Icon
                    <div className="note-preview">
                        <svg width="50" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="white" stroke="#E5E5E5" strokeWidth="1" />
                            <path d="M14 2V8H20" fill="#F3F3F3" />
                            {/* Fake text lines */}
                            <line x1="6" y1="12" x2="18" y2="12" stroke="#E0E0E0" strokeWidth="1" />
                            <line x1="6" y1="15" x2="18" y2="15" stroke="#E0E0E0" strokeWidth="1" />
                            <line x1="6" y1="18" x2="14" y2="18" stroke="#E0E0E0" strokeWidth="1" />
                        </svg>
                        {isTemplate && <div className="template-badge">T</div>}
                    </div>
                )}
            </div>

            <div className="card-label-container">
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        className="card-rename-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleSubmit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="card-label">{title}</div>
                )}
            </div>

            <style>{`
                .card {
                    width: 120px;
                    height: 140px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 8px;
                    border-radius: var(--radius-button);
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: background-color 0.1s;
                    position: relative;
                }

                .card:hover {
                    background-color: var(--hover-bg);
                    border-color: #E0E0E0;
                }

                .card.selected {
                    background-color: var(--selection-bg);
                    border-color: var(--selection-border);
                }

                .card-icon-area {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    position: relative;
                }

                .card-label-container {
                    margin-top: 8px;
                    width: 100%;
                    height: 20px; /* fixed height for alignment */
                    display: flex;
                    justify-content: center;
                }

                .card-label {
                    font-size: var(--font-size-body);
                    text-align: center;
                    width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap; 
                    color: var(--editor-text-color);
                }

                .card-rename-input {
                    width: 100%;
                    font-family: inherit;
                    font-size: var(--font-size-body);
                    border: 1px solid var(--color-accent);
                    outline: none;
                    text-align: center;
                    padding: 0;
                }

                .template-badge {
                    position: absolute;
                    bottom: -4px;
                    right: -4px;
                    background-color: var(--color-accent);
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    padding: 2px 4px;
                    border-radius: 4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    );
};

export default Card;
