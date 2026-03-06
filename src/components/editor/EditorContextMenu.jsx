import React, { useEffect, useRef, useState } from 'react';
import LinkEditorPopover from './LinkEditorPopover';

const EditorContextMenu = ({ editor, x, y, onClose }) => {
    const menuRef = useRef(null);
    const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
    const currentLinkUrl = editor?.getAttributes('link').href || '';

    const applyLink = (url) => {
        if (!url) {
            editor?.chain().focus().unsetLink().run();
            setIsLinkEditorOpen(false);
            return;
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        setIsLinkEditorOpen(false);
    };

    const runAndClose = (command) => {
        command?.();
        onClose();
    };

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
    const menuHeight = isTable ? 560 : 420;

    let posX = x;
    let posY = y;

    // If click is in the bottom 40% of the screen, spawn menu upwards
    if (y > windowHeight * 0.6) {
        posY = y - menuHeight;
    }

    // Ensure menu doesn't go off screen horizontally
    if (posX + menuWidth > windowWidth) {
        posX = windowWidth - menuWidth - 10; // 10px padding
    }

    // Ensure menu doesn't go off screen vertically (bottom edge)
    if (posY + menuHeight > windowHeight) {
        posY = windowHeight - menuHeight - 10;
    }

    // Ensure menu doesn't go off screen vertically (top edge)
    if (posY < 10) {
        posY = 10;
    }

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
                    onClick={() => runAndClose(() => editor?.chain().focus().toggleCodeBlock().run())}
                >
                    <span className="menu-item-icon">💻</span>
                    <span className="menu-item-text">Code Block</span>
                </div>
            </div>

            <div className="menu-separator" />

            <div className="menu-mini-toolbar">
                <button
                    className={`mini-tool-btn ${editor?.isActive('bold') ? 'active' : ''}`}
                    onClick={() => runAndClose(() => editor?.chain().focus().toggleBold().run())}
                    title="Bold"
                ><b>B</b></button>
                <button
                    className={`mini-tool-btn ${editor?.isActive('italic') ? 'active' : ''}`}
                    onClick={() => runAndClose(() => editor?.chain().focus().toggleItalic().run())}
                    title="Italic"
                ><i>I</i></button>
                <button
                    className={`mini-tool-btn ${editor?.isActive('underline') ? 'active' : ''}`}
                    onClick={() => runAndClose(() => editor?.chain().focus().toggleUnderline().run())}
                    title="Underline"
                ><u>U</u></button>
                <button
                    className={`mini-tool-btn ${editor?.isActive('code') ? 'active' : ''}`}
                    onClick={() => runAndClose(() => editor?.chain().focus().toggleCode().run())}
                    title="Inline Code"
                >{'</>'}</button>
                <button
                    className={`mini-tool-btn ${editor?.isActive('highlight') ? 'active' : ''}`}
                    onClick={() => runAndClose(() => editor?.chain().focus().toggleHighlight({ color: '#ffeb3b' }).run())}
                    title="Highlight"
                >🖍️</button>
            </div>

            <div className="menu-separator" />

            <div className="menu-item-group">
                <div
                    className="menu-item"
                    onClick={() => runAndClose(() => editor?.chain().focus().selectAll().run())}
                >
                    <span className="menu-item-icon">⌘</span>
                    <span className="menu-item-text">Select All</span>
                    <span className="menu-item-shortcut">Ctrl+A</span>
                </div>
            </div>

            <div className="menu-separator" />

            <div className="menu-item-group">
                <div
                    className={`menu-item ${editor?.isActive('bulletList') ? 'active' : ''}`}
                    onClick={() => runAndClose(() => editor?.chain().focus().toggleBulletList().run())}
                >
                    <span className="menu-item-icon">•</span>
                    <span className="menu-item-text">Bullet List</span>
                </div>
                <div
                    className={`menu-item ${editor?.isActive('orderedList') ? 'active' : ''}`}
                    onClick={() => runAndClose(() => editor?.chain().focus().toggleOrderedList().run())}
                >
                    <span className="menu-item-icon">1.</span>
                    <span className="menu-item-text">Numbered List</span>
                </div>
                <div
                    className={`menu-item ${editor?.isActive('taskList') ? 'active' : ''}`}
                    onClick={() => runAndClose(() => editor?.chain().focus().toggleTaskList().run())}
                >
                    <span className="menu-item-icon">☑</span>
                    <span className="menu-item-text">Task List</span>
                </div>
                <div
                    className={`menu-item ${editor?.isActive('blockquote') ? 'active' : ''}`}
                    onClick={() => runAndClose(() => editor?.chain().focus().toggleBlockquote().run())}
                >
                    <span className="menu-item-icon">❝</span>
                    <span className="menu-item-text">Blockquote</span>
                </div>
                <div className="menu-item-with-popover">
                    <div
                        className={`menu-item ${editor?.isActive('link') ? 'active' : ''}`}
                        onClick={() => setIsLinkEditorOpen((prev) => !prev)}
                    >
                        <span className="menu-item-icon">🔗</span>
                        <span className="menu-item-text">{editor?.isActive('link') ? 'Edit Link' : 'Add Link'}</span>
                    </div>
                    {isLinkEditorOpen ? (
                        <LinkEditorPopover
                            compact
                            initialUrl={currentLinkUrl}
                            onSubmit={applyLink}
                            onRemove={() => applyLink('')}
                            onClose={() => setIsLinkEditorOpen(false)}
                        />
                    ) : null}
                </div>
            </div>

            <div className="menu-separator" />

            <div className="menu-item-group">
                <div
                    className="menu-item has-submenu"
                    onMouseEnter={(e) => {
                        const submenu = e.currentTarget.querySelector('.styles-submenu');
                        if (submenu) submenu.style.display = 'flex';
                    }}
                    onMouseLeave={(e) => {
                        const submenu = e.currentTarget.querySelector('.styles-submenu');
                        if (submenu) submenu.style.display = 'none';
                    }}
                >
                    <span className="menu-item-icon">🎨</span>
                    <span className="menu-item-text">Styles</span>
                    <span className="submenu-arrow">▶</span>

                    <div className="styles-submenu" style={{ display: 'none' }}>
                        <div className="submenu-section-label">Text Color</div>
                        <div className="color-grid">
                            {[
                                '#000000', '#444444', '#888888', '#CCCCCC', // Grayscale
                                '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', // Pink/Purple/Indigo
                                '#2196F3', '#03A9F4', '#00BCD4', '#009688', // Blue/Cyan/Teal
                                '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', // Green/Lime/Yellow
                                '#FFC107', '#FF9800', '#FF5722', '#795548'  // Amber/Orange/DeepOrange/Brown
                            ].map(color => (
                                <div
                                    key={`text-${color}`}
                                    className="color-option"
                                    style={{ backgroundColor: color }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        editor?.chain().focus().setColor(color).run();
                                        onClose();
                                    }}
                                    title={color}
                                />
                            ))}
                            <div
                                className="color-option remove-color"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    editor?.chain().focus().unsetColor().run();
                                    onClose();
                                }}
                                title="Default Color"
                            >❌</div>
                        </div>

                        <div className="submenu-separator" />

                        <div className="submenu-section-label">Highlight</div>
                        <div className="color-grid">
                            {[
                                '#FFEB3B', '#FFC107', '#FF9800', // Yellow/Orange
                                '#00BCD4', '#00E5FF', '#80DEEA', // Cyan
                                '#8BC34A', '#CCFF90', '#B2FF59', // Green
                                '#E1BEE7', '#F48FB1', '#FFAB91'  // Pastel Purple/Pink/Orange
                            ].map(color => (
                                <div
                                    key={`bg-${color}`}
                                    className="color-option"
                                    style={{ backgroundColor: color }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        editor?.chain().focus().toggleHighlight({ color }).run();
                                        onClose();
                                    }}
                                    title={color}
                                />
                            ))}
                            <div
                                className="color-option remove-color"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    editor?.chain().focus().unsetHighlight().run();
                                    onClose();
                                }}
                                title="Remove Highlight"
                            >❌</div>
                        </div>
                    </div>
                </div>
                <div
                    className="menu-item has-submenu"
                    onMouseEnter={(e) => {
                        const submenu = e.currentTarget.querySelector('.insert-submenu');
                        if (submenu) submenu.style.display = 'flex';
                    }}
                    onMouseLeave={(e) => {
                        const submenu = e.currentTarget.querySelector('.insert-submenu');
                        if (submenu) submenu.style.display = 'none';
                    }}
                >
                    <span className="menu-item-icon">➕</span>
                    <span className="menu-item-text">Insert</span>
                    <span className="submenu-arrow">▶</span>

                    <div className="insert-submenu" style={{ display: 'none' }}>
                        <div
                            className="menu-item"
                            onClick={() => {
                                const url = prompt('Enter image URL:');
                                if (url) {
                                    editor?.chain().focus().setImage({ src: url }).run();
                                    onClose();
                                }
                            }}
                        >
                            <span className="menu-item-icon">🔗</span>
                            <span className="menu-item-text">Image from URL</span>
                        </div>
                        <div
                            className="menu-item"
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            editor?.chain().focus().setImage({ src: event.target.result }).run();
                                            onClose();
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                };
                                input.click();
                            }}
                        >
                            <span className="menu-item-icon">📁</span>
                            <span className="menu-item-text">Upload from PC</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="menu-separator" />

            <div className="menu-item-group">
                <div
                    className="menu-item"
                    onClick={() => runAndClose(() => editor?.chain().focus().unsetAllMarks().clearNodes().run())}
                >
                    <span className="menu-item-icon">🧹</span>
                    <span className="menu-item-text">Clear formatting</span>
                </div>
            </div>

            {editor?.isActive('table') && (
                <>
                    <div className="menu-separator" />
                    <div className="menu-item-group">
                        <div className="menu-item" onClick={() => runAndClose(() => editor.chain().focus().addRowBefore().run())}>
                            <span className="menu-item-icon">➕⬆️</span>
                            <span className="menu-item-text">Add Row Above</span>
                        </div>
                        <div className="menu-item" onClick={() => runAndClose(() => editor.chain().focus().addRowAfter().run())}>
                            <span className="menu-item-icon">➕⬇️</span>
                            <span className="menu-item-text">Add Row Below</span>
                        </div>
                        <div className="menu-item" onClick={() => runAndClose(() => editor.chain().focus().deleteRow().run())}>
                            <span className="menu-item-icon">❌➖</span>
                            <span className="menu-item-text">Delete Row</span>
                        </div>
                    </div>
                    <div className="menu-separator" />
                    <div className="menu-item-group">
                        <div className="menu-item" onClick={() => runAndClose(() => editor.chain().focus().addColumnBefore().run())}>
                            <span className="menu-item-icon">➕⬅️</span>
                            <span className="menu-item-text">Add Column Before</span>
                        </div>
                        <div className="menu-item" onClick={() => runAndClose(() => editor.chain().focus().addColumnAfter().run())}>
                            <span className="menu-item-icon">➕➡️</span>
                            <span className="menu-item-text">Add Column After</span>
                        </div>
                        <div className="menu-item" onClick={() => runAndClose(() => editor.chain().focus().deleteColumn().run())}>
                            <span className="menu-item-icon">❌┃</span>
                            <span className="menu-item-text">Delete Column</span>
                        </div>
                    </div>
                    <div className="menu-separator" />
                    <div className="menu-item-group">
                        <div className="menu-item" onClick={() => runAndClose(() => editor.chain().focus().deleteTable().run())}>
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

                .menu-item-with-popover {
                    position: relative;
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

                .styles-submenu {
                    position: absolute;
                    left: 100%;
                    top: 0;
                    width: 180px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
                    padding: 8px;
                    margin-left: 4px;
                    flex-direction: column;
                    z-index: 10000;
                }

                [data-theme="dark"] .styles-submenu {
                    background: rgba(45, 45, 45, 0.95);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .submenu-section-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #666;
                    margin-bottom: 4px;
                    padding-left: 2px;
                }

                [data-theme="dark"] .submenu-section-label {
                    color: #aaa;
                }

                .color-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 4px;
                    margin-bottom: 8px;
                }

                .color-option {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    border: 1px solid rgba(0,0,0,0.1);
                    transition: transform 0.1s, border-color 0.1s;
                }

                .color-option:hover {
                    transform: scale(1.1);
                    border-color: rgba(0,0,0,0.3);
                    z-index: 1;
                }

                .color-option.remove-color {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    background-color: transparent;
                    border: 1px solid #ccc;
                }

                .submenu-separator {
                    height: 1px;
                    background: rgba(0, 0, 0, 0.08);
                    margin: 4px 0 8px 0;
                }

                [data-theme="dark"] .submenu-separator {
                    background: rgba(255, 255, 255, 0.1);
                }

                .insert-submenu {
                    position: absolute;
                    left: 100%;
                    top: 0;
                    width: 200px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
                    padding: 6px;
                    margin-left: 4px;
                    flex-direction: column;
                    z-index: 10000;
                }

                [data-theme="dark"] .insert-submenu {
                    background: rgba(45, 45, 45, 0.9);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .has-submenu {
                    position: relative;
                }
            `}</style>
        </div>
    );
};

export default EditorContextMenu;
