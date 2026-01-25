import React, { useEffect, useRef } from 'react';

const EditorContextMenu = ({ editor, x, y, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Ensure menu doesn't go off screen
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const menuWidth = 240;
    const isTable = editor?.isActive('table');
    // Base 320 + 40 (Code Block) + 8 (Separator) = 368
    // Table adds more
    const menuHeight = isTable ? 600 : 368;

    let posX = x;
    let posY = y;

    if (x + menuWidth > windowWidth) posX = x - menuWidth;
    if (y + menuHeight > windowHeight) posY = y - menuHeight;

    return (
        <div
            className="win11-menu"
            ref={menuRef}
            style={{ top: posY, left: posX }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="menu-item-group">
                <div
                    className={`menu-item ${editor?.isActive('codeBlock') ? 'active' : ''}`}
                    onClick={() => editor?.chain().focus().toggleCodeBlock().run() || onClose()}
                >
                    <span className="menu-item-icon">💻</span>
                    <span className="menu-item-text">Code Block</span>
                </div>
            </div>

            <div className="menu-separator" />

            <div className="menu-mini-toolbar">
                <button
                    className={`mini-tool-btn ${editor?.isActive('bold') ? 'active' : ''}`}
                    onClick={() => editor?.chain().focus().toggleBold().run() || onClose()}
                    title="Bold"
                ><b>B</b></button>
                <button
                    className={`mini-tool-btn ${editor?.isActive('italic') ? 'active' : ''}`}
                    onClick={() => editor?.chain().focus().toggleItalic().run() || onClose()}
                    title="Italic"
                ><i>I</i></button>
                <button
                    className={`mini-tool-btn ${editor?.isActive('underline') ? 'active' : ''}`}
                    onClick={() => editor?.chain().focus().toggleUnderline().run() || onClose()}
                    title="Underline"
                ><u>U</u></button>
                <button
                    className={`mini-tool-btn ${editor?.isActive('highlight') ? 'active' : ''}`}
                    onClick={() => editor?.chain().focus().toggleHighlight({ color: '#ffeb3b' }).run() || onClose()}
                    title="Highlight"
                >🖍️</button>
            </div>

            <div className="menu-separator" />

            <div className="menu-item-group">
                <div className="menu-item">
                    <span className="menu-item-icon">✂️</span>
                    <span className="menu-item-text">Cut</span>
                    <span className="menu-item-shortcut">Ctrl+X</span>
                </div>
                <div className="menu-item">
                    <span className="menu-item-icon">📄</span>
                    <span className="menu-item-text">Copy</span>
                    <span className="menu-item-shortcut">Ctrl+C</span>
                </div>
                <div className="menu-item">
                    <span className="menu-item-icon">📋</span>
                    <span className="menu-item-text">Paste</span>
                    <span className="menu-item-shortcut">Ctrl+V</span>
                </div>
            </div>

            <div className="menu-separator" />

            <div className="menu-item-group">
                <div
                    className={`menu-item ${editor?.isActive('bulletList') ? 'active' : ''}`}
                    onClick={() => editor?.chain().focus().toggleBulletList().run() || onClose()}
                >
                    <span className="menu-item-icon">•</span>
                    <span className="menu-item-text">Bullet List</span>
                </div>
                <div
                    className={`menu-item ${editor?.isActive('orderedList') ? 'active' : ''}`}
                    onClick={() => editor?.chain().focus().toggleOrderedList().run() || onClose()}
                >
                    <span className="menu-item-icon">1.</span>
                    <span className="menu-item-text">Numbered List</span>
                </div>
                <div
                    className={`menu-item ${editor?.isActive('taskList') ? 'active' : ''}`}
                    onClick={() => editor?.chain().focus().toggleTaskList().run() || onClose()}
                >
                    <span className="menu-item-icon">☑</span>
                    <span className="menu-item-text">Task List</span>
                </div>
            </div>

            <div className="menu-separator" />

            <div className="menu-item-group">
                <div className="menu-item has-submenu">
                    <span className="menu-item-icon">🎨</span>
                    <span className="menu-item-text">Styles</span>
                    <span className="submenu-arrow">▶</span>
                </div>
                <div className="menu-item has-submenu">
                    <span className="menu-item-icon">➕</span>
                    <span className="menu-item-text">Insert</span>
                    <span className="submenu-arrow">▶</span>
                </div>
            </div>

            <div className="menu-separator" />

            <div className="menu-item-group">
                <div className="menu-item">
                    <span className="menu-item-icon">🧹</span>
                    <span className="menu-item-text">Clear formatting</span>
                </div>
            </div>

            {editor?.isActive('table') && (
                <>
                    <div className="menu-separator" />
                    <div className="menu-item-group">
                        <div className="menu-item" onClick={() => editor.chain().focus().addRowBefore().run() || onClose()}>
                            <span className="menu-item-icon">➕⬆️</span>
                            <span className="menu-item-text">Add Row Above</span>
                        </div>
                        <div className="menu-item" onClick={() => editor.chain().focus().addRowAfter().run() || onClose()}>
                            <span className="menu-item-icon">➕⬇️</span>
                            <span className="menu-item-text">Add Row Below</span>
                        </div>
                        <div className="menu-item" onClick={() => editor.chain().focus().deleteRow().run() || onClose()}>
                            <span className="menu-item-icon">❌➖</span>
                            <span className="menu-item-text">Delete Row</span>
                        </div>
                    </div>
                    <div className="menu-separator" />
                    <div className="menu-item-group">
                        <div className="menu-item" onClick={() => editor.chain().focus().addColumnBefore().run() || onClose()}>
                            <span className="menu-item-icon">➕⬅️</span>
                            <span className="menu-item-text">Add Column Before</span>
                        </div>
                        <div className="menu-item" onClick={() => editor.chain().focus().addColumnAfter().run() || onClose()}>
                            <span className="menu-item-icon">➕➡️</span>
                            <span className="menu-item-text">Add Column After</span>
                        </div>
                        <div className="menu-item" onClick={() => editor.chain().focus().deleteColumn().run() || onClose()}>
                            <span className="menu-item-icon">❌┃</span>
                            <span className="menu-item-text">Delete Column</span>
                        </div>
                    </div>
                    <div className="menu-separator" />
                    <div className="menu-item-group">
                        <div className="menu-item" onClick={() => editor.chain().focus().deleteTable().run() || onClose()}>
                            <span className="menu-item-icon">🗑️</span>
                            <span className="menu-item-text">Delete Table</span>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                .win11-menu {
                    position: fixed;
                    z-index: 9999;
                    width: 240px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
                    padding: 6px;
                    font-family: 'Segoe UI', system-ui, sans-serif;
                    font-size: 13px;
                    color: #1a1a1a;
                    animation: menuFadeIn 0.15s ease-out;
                }

                @keyframes menuFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                [data-theme="dark"] .win11-menu {
                    background: rgba(45, 45, 45, 0.9);
                    color: #ffffff;
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .menu-mini-toolbar {
                    display: flex;
                    justify-content: space-around;
                    padding-bottom: 6px;
                }

                .mini-tool-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    color: inherit;
                    font-size: 14px;
                }

                .mini-tool-btn:hover {
                    background-color: rgba(0, 0, 0, 0.05);
                }

                .mini-tool-btn.active {
                    background-color: var(--selection-bg);
                    border: 1px solid var(--color-accent);
                }

                [data-theme="dark"] .mini-tool-btn:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }

                [data-theme="dark"] .mini-tool-btn.active {
                    background-color: rgba(255, 255, 255, 0.15);
                    border: 1px solid var(--color-accent);
                }

                .menu-separator {
                    height: 1px;
                    background: rgba(0, 0, 0, 0.08);
                    margin: 4px 6px;
                }

                [data-theme="dark"] .menu-separator {
                    background: rgba(255, 255, 255, 0.1);
                }

                .menu-item-group {
                    display: flex;
                    flex-direction: column;
                }

                .menu-item {
                    display: flex;
                    align-items: center;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    gap: 12px;
                    transition: background 0.1s;
                }

                .menu-item:hover {
                    background-color: rgba(0, 0, 0, 0.05);
                }

                [data-theme="dark"] .menu-item:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }

                .menu-item-icon {
                    width: 16px;
                    display: flex;
                    justify-content: center;
                    font-size: 14px;
                }

                .menu-item-text {
                    flex: 1;
                }

                .menu-item-shortcut {
                    color: #888;
                    font-size: 11px;
                }

                .submenu-arrow {
                    font-size: 10px;
                    color: #888;
                }
            `}</style>
        </div>
    );
};

export default EditorContextMenu;
