import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const ContextMenu = ({ x, y, options, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Portal to body to avoid clipping
    return createPortal(
        <div
            ref={menuRef}
            className="context-menu"
            style={{
                top: y,
                left: x
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking menu item (logic might close it, but bubble shouldn't)
        >
            {options.map((option, index) => (
                <div
                    key={index}
                    className={`context-menu-item ${option.separator ? 'separator-container' : ''} ${option.disabled ? 'disabled' : ''}`}
                    onClick={() => {
                        if (!option.disabled && !option.separator) {
                            option.action && option.action();
                            onClose();
                        }
                    }}
                >
                    {option.separator ? (
                        <div className="separator-line" />
                    ) : (
                        <span>{option.label}</span>
                    )}
                </div>
            ))}

            <style>{`
            .context-menu {
                position: fixed;
                width: 160px;
                background: #FFFFFF;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.14);
                padding: 4px 0;
                z-index: 1000;
                animation: fadeIn 0.1s;
            }

            .context-menu-item {
                padding: 8px 12px;
                font-size: var(--font-size-body);
                cursor: pointer;
                color: #202020;
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
                color: #A0A0A0;
                cursor: default;
            }
            `}</style>
        </div>,
        document.body
    );
};

export default ContextMenu;
