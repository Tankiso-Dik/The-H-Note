import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ContextMenu = ({ x, y, options, onClose }) => {
    const menuRef = useRef(null);
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const [position, setPosition] = useState({ x, y });

    useEffect(() => {
        setPosition({ x, y });
    }, [x, y]);

    useLayoutEffect(() => {
        if (!menuRef.current) {
            return;
        }

        const padding = 8;
        const rect = menuRef.current.getBoundingClientRect();

        let nextX = x;
        let nextY = y;

        if (rect.right > window.innerWidth - padding) {
            nextX = Math.max(padding, window.innerWidth - rect.width - padding);
        }

        if (rect.left < padding) {
            nextX = padding;
        }

        if (rect.bottom > window.innerHeight - padding) {
            nextY = Math.max(padding, window.innerHeight - rect.height - padding);
        }

        if (rect.top < padding) {
            nextY = padding;
        }

        setPosition((prev) => {
            if (prev.x === nextX && prev.y === nextY) {
                return prev;
            }
            return { x: nextX, y: nextY };
        });
    }, [x, y]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Portal to body to avoid clipping
    return createPortal(
        <div
            ref={menuRef}
            className="context-menu"
            style={{
                top: position.y,
                left: position.x
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {options.map((option, index) => (
                <div
                    key={index}
                    className={`context-menu-item ${option.separator ? 'separator-container' : ''} ${option.disabled ? 'disabled' : ''} ${option.submenu ? 'has-submenu' : ''}`}
                    onClick={() => {
                        if (!option.disabled && !option.separator && !option.submenu) {
                            option.action && option.action();
                            onClose();
                        }
                    }}
                    onMouseEnter={() => {
                        if (option.submenu) {
                            setActiveSubmenu(index);
                        } else {
                            setActiveSubmenu(null);
                        }
                    }}
                >
                    {option.separator ? (
                        <div className="separator-line" />
                    ) : (
                        <>
                            <span>{option.label}</span>
                            {option.submenu && <span className="submenu-arrow">›</span>}

                            {option.submenu && activeSubmenu === index && (
                                <div className="submenu" onClick={(e) => e.stopPropagation()}>
                                    {option.submenu.map((subOption, subIndex) => (
                                        <div
                                            key={subIndex}
                                            className={`context-menu-item ${subOption.disabled ? 'disabled' : ''}`}
                                            onClick={() => {
                                                if (!subOption.disabled) {
                                                    subOption.action && subOption.action();
                                                    onClose();
                                                }
                                            }}
                                        >
                                            <span>{subOption.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            ))}

            <style>{`
            .context-menu {
                position: fixed;
                width: 160px;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.14);
                padding: 4px 0;
                max-height: min(70vh, 420px);
                overflow-y: auto;
                z-index: 1000;
                animation: fadeIn 0.1s;
            }

            .context-menu-item {
                padding: 8px 12px;
                font-size: var(--font-size-body);
                cursor: pointer;
                color: var(--editor-text-color);
                position: relative;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .context-menu-item:hover:not(.separator-container):not(.disabled) {
                background-color: var(--hover-bg);
            }

            .separator-container {
                padding: 4px 0;
                cursor: default;
            }
            
            .separator-line {
                height: 1px;
                background-color: var(--border-color);
            }

            .disabled {
                color: var(--editor-text-color);
                opacity: 0.5;
                cursor: default;
            }

            .has-submenu {
                padding-right: 24px;
            }

            .submenu-arrow {
                position: absolute;
                right: 8px;
                font-size: 14px;
                color: var(--editor-text-color);
                opacity: 0.8;
            }

            .submenu {
                position: absolute;
                left: 100%;
                top: -4px;
                width: 160px;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.14);
                padding: 4px 0;
                margin-left: 4px;
                z-index: 1001;
            }
            `}</style>
        </div>,
        document.body
    );
};

export default ContextMenu;
