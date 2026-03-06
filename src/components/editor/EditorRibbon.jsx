import React, { useEffect, useMemo, useRef, useState } from 'react';
import { exportMarkdownFile, exportPdfDocument, exportPlainTextFile } from '../../lib/noteExport';
import LinkEditorPopover from './LinkEditorPopover';

const RibbonGroup = ({ children }) => (
    <div className="ribbon-group">
        <div className="ribbon-group-content">
            {children}
        </div>
    </div>
);

const EditorRibbon = ({ editor, noteTitle, onToggleTheme, theme, onBack }) => {
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
    const exportMenuRef = useRef(null);
    const linkMenuRef = useRef(null);

    useEffect(() => {
        if (!isExportOpen) {
            return;
        }

        const handleOutsideClick = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setIsExportOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsExportOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isExportOpen]);

    useEffect(() => {
        if (!isLinkEditorOpen) {
            return;
        }

        const handleOutsideClick = (event) => {
            if (linkMenuRef.current && !linkMenuRef.current.contains(event.target)) {
                setIsLinkEditorOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsLinkEditorOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isLinkEditorOpen]);

    const exportOptions = useMemo(() => [
        {
            label: 'PDF',
            icon: '📄',
            action: () => {
                exportPdfDocument({
                    title: noteTitle || 'Untitled Note',
                    bodyHtml: editor?.getHTML() || '',
                });
            },
        },
        {
            label: 'Markdown',
            icon: '📝',
            action: () => {
                exportMarkdownFile({
                    title: noteTitle || 'Untitled Note',
                    markdown: editor?.storage?.markdown?.getMarkdown?.() || '',
                });
            },
        },
        {
            label: 'Plain Text',
            icon: '📃',
            action: () => {
                exportPlainTextFile({
                    title: noteTitle || 'Untitled Note',
                    text: editor?.getText() || '',
                });
            },
        },
    ], [editor, noteTitle]);

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

    return (
        <div className="editor-ribbon">
            <div className="ribbon-back-container">
                <button
                    className="ribbon-back-btn"
                    onClick={onBack}
                    title="Back to Notes"
                >
                    <span className="icon">←</span>
                    <span>Back</span>
                </button>
            </div>

            <div className="ribbon-separator" />

            <RibbonGroup>
                <div className="ribbon-row">
                    <select
                        className="ribbon-select font-family"
                        value={editor?.getAttributes('textStyle').fontFamily || localStorage.getItem('editor-default-font') || "Calibri, sans-serif"}
                        onChange={(e) => {
                            const font = e.target.value;
                            // Ensure editor is focused before applying to update stored marks for next input
                            editor?.chain().focus().setFontFamily(font).run();
                            localStorage.setItem('editor-default-font', font);
                        }}
                        disabled={!editor}
                    >
                        <option value="Calibri, sans-serif">Calibri</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="Roboto, sans-serif">Roboto</option>
                        <option value="'Open Sans', sans-serif">Open Sans</option>
                        <option value="Lato, sans-serif">Lato</option>
                        <option value="Montserrat, sans-serif">Montserrat</option>
                        <option value="Poppins, sans-serif">Poppins</option>
                        <option value="'Playfair Display', serif">Playfair Display</option>
                        <option value="Merriweather, serif">Merriweather</option>
                        <option value="'Source Code Pro', monospace">Source Code Pro</option>
                        <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                    </select>
                    <select
                        className="ribbon-select font-size"
                        value={editor?.getAttributes('textStyle').fontSize?.replace('pt', '') || localStorage.getItem('editor-default-font-size') || "11"}
                        onChange={(e) => {
                            const size = e.target.value;
                            // Ensure editor is focused before applying to update stored marks for next input
                            editor?.chain().focus().setMark('textStyle', { fontSize: `${size}pt` }).run();
                            localStorage.setItem('editor-default-font-size', size);
                        }}
                        disabled={!editor}
                    >
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                        <option value="14">14</option>
                        <option value="16">16</option>
                        <option value="18">18</option>
                        <option value="20">20</option>
                        <option value="22">22</option>
                        <option value="24">24</option>
                        <option value="26">26</option>
                        <option value="28">28</option>
                        <option value="32">32</option>
                        <option value="36">36</option>
                        <option value="40">40</option>
                        <option value="44">44</option>
                        <option value="48">48</option>
                        <option value="54">54</option>
                        <option value="60">60</option>
                        <option value="66">66</option>
                        <option value="72">72</option>
                    </select>
                </div>
                <div className="ribbon-row">
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('bold') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        disabled={!editor}
                    ><b>B</b></button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('italic') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        disabled={!editor}
                    ><i>I</i></button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('underline') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        disabled={!editor}
                    ><u>U</u></button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('strike') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        disabled={!editor}
                    ><s>S</s></button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('code') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleCode().run()}
                        disabled={!editor}
                        title="Inline Code"
                    >{'</>'}</button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('textStyle', { color: '#e91e63' }) ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().setColor('#e91e63').run()}
                        disabled={!editor}
                    >A</button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('highlight') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleHighlight({ color: '#ffeb3b' }).run()}
                        disabled={!editor}
                    >H</button>
                </div>
            </RibbonGroup>

            <div className="ribbon-separator" />

            <RibbonGroup>
                <div className="ribbon-grid">
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('bulletList') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        title="Bullet List"
                    >•</button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('orderedList') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        title="Numbered List"
                    >1.</button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('taskList') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleTaskList().run()}
                        title="Task List"
                    >☑</button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('blockquote') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        title="Blockquote"
                    >"</button>
                    <div className="ribbon-inline-popover" ref={linkMenuRef}>
                        <button
                            className={`ribbon-button-mini ${editor?.isActive('link') ? 'active' : ''}`}
                            onClick={() => setIsLinkEditorOpen((prev) => !prev)}
                            title="Link"
                        >🔗</button>
                        {isLinkEditorOpen ? (
                            <LinkEditorPopover
                                initialUrl={currentLinkUrl}
                                onSubmit={applyLink}
                                onRemove={() => applyLink('')}
                                onClose={() => setIsLinkEditorOpen(false)}
                            />
                        ) : null}
                    </div>
                    <button
                        className="ribbon-button-mini"
                        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Rule"
                    >—</button>
                </div>
            </RibbonGroup>

            <div className="ribbon-separator" />

            <RibbonGroup>
                <div className="ribbon-styles-container">
                    <div
                        className={`style-box ${editor?.isActive('paragraph') && !editor?.isActive('heading') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().setParagraph().run()}
                    >
                        <div className="style-preview">AaBbCc</div>
                        <div className="style-name">Normal</div>
                    </div>
                    <div
                        className={`style-box ${editor?.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    >
                        <div className="style-preview h1">AaBbCc</div>
                        <div className="style-name">Heading 1</div>
                    </div>
                    <div
                        className={`style-box ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                        <div className="style-preview h2">AaBbCc</div>
                        <div className="style-name">Heading 2</div>
                    </div>
                    <div
                        className={`style-box ${editor?.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    >
                        <div className="style-preview h3">AaBbCc</div>
                        <div className="style-name">Heading 3</div>
                    </div>
                </div>
            </RibbonGroup>

            <div className="ribbon-separator" />

            <RibbonGroup>
                <div className="ribbon-column">
                    <button
                        className="ribbon-button large"
                        onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        title="Insert 3x3 Table"
                    >
                        <span className="icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="3" y1="15" x2="21" y2="15"></line>
                                <line x1="9" y1="3" x2="9" y2="21"></line>
                                <line x1="15" y1="3" x2="15" y2="21"></line>
                            </svg>
                        </span>
                        <span>Table</span>
                    </button>
                    <button
                        className={`ribbon-button small ${editor?.isActive('codeBlock') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                        title="Code Block"
                    >
                        <span className="icon">💻</span>
                        <span>Code</span>
                    </button>
                </div>
            </RibbonGroup>

            <div className="ribbon-separator" />

            <RibbonGroup>
                <div className="ribbon-column export-group" ref={exportMenuRef}>
                    <button
                        className="ribbon-button large"
                        onClick={() => setIsExportOpen((prev) => !prev)}
                        title="Export Note"
                    >
                        <span className="icon">📥</span>
                        <span>Export</span>
                    </button>
                    {isExportOpen ? (
                        <div className="export-dropdown">
                            {exportOptions.map((option) => (
                                <button
                                    key={option.label}
                                    className="export-option"
                                    onClick={() => {
                                        option.action();
                                        setIsExportOpen(false);
                                    }}
                                >
                                    <span>{option.icon}</span>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </RibbonGroup>

            <div className="ribbon-spacer" />

            <div className="ribbon-theme-toggle">
                <button className="theme-toggle-btn" onClick={onToggleTheme}>
                    {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </button>
            </div>

            <style>{`
                .editor-ribbon {
                    height: 120px;
                    background-color: var(--editor-ribbon-bg);
                    border-bottom: 1px solid var(--editor-border);
                    display: flex;
                    padding: 4px 12px;
                    align-items: stretch;
                    color: var(--editor-text-color);
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                
                .editor-ribbon::-webkit-scrollbar {
                    display: none;
                }

                .ribbon-back-container {
                    display: flex;
                    align-items: center;
                    padding: 0 8px;
                }

                .ribbon-back-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 4px;
                    padding: 8px;
                    min-width: 48px;
                    cursor: pointer;
                    color: inherit;
                    transition: background 0.2s;
                }

                .ribbon-back-btn:hover {
                    background-color: var(--hover-bg);
                }

                [data-theme="dark"] .ribbon-back-btn:hover {
                    background-color: rgba(255,255,255,0.1);
                }

                .ribbon-back-btn .icon {
                    font-size: 20px;
                    margin-bottom: 2px;
                }

                .ribbon-back-btn span:not(.icon) {
                    font-size: 11px;
                }

                .ribbon-group {
                    display: flex;
                    flex-direction: column;
                    padding: 4px 8px;
                    align-items: center;
                    justify-content: space-between;
                }

                .ribbon-group-content {
                    flex: 1;
                    display: flex;
                    gap: 4px;
                    align-items: center;
                }

                .ribbon-group-label {
                    font-size: 10px;
                    color: #888;
                    margin-top: 4px;
                }

                .ribbon-separator {
                    width: 1px;
                    background-color: var(--separator-color);
                    margin: 12px 4px;
                }

                .ribbon-column {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .ribbon-row {
                    display: flex;
                    gap: 2px;
                }

                .ribbon-button {
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: inherit;
                    font-size: 12px;
                }

                .ribbon-button:hover {
                    background-color: var(--hover-bg);
                }

                [data-theme="dark"] .ribbon-button:hover {
                    background-color: rgba(255,255,255,0.1);
                }

                .ribbon-button.large {
                    flex-direction: column;
                    padding: 8px;
                    min-width: 50px;
                }

                .ribbon-button.large .icon {
                    font-size: 24px;
                }

                .ribbon-button.small {
                    padding: 2px 8px;
                }

                .ribbon-button-mini {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 4px;
                    cursor: pointer;
                    color: inherit;
                }

                .ribbon-button-mini:hover {
                    background-color: var(--hover-bg);
                }

                .ribbon-button-mini.active {
                    background-color: var(--selection-bg);
                    border-color: var(--color-accent);
                }

                [data-theme="dark"] .ribbon-button-mini:hover {
                    background-color: rgba(255,255,255,0.1);
                }

                [data-theme="dark"] .ribbon-button-mini.active {
                    background-color: rgba(255,255,255,0.15);
                    border-color: var(--color-accent);
                }

                .ribbon-select {
                    font-size: 11px;
                    padding: 2px;
                    border: 1px solid var(--input-border);
                    border-radius: 2px;
                    background: var(--input-bg);
                    color: inherit;
                    cursor: pointer;
                }

                .ribbon-select.font-family { width: 140px; }
                .ribbon-select.font-size { width: 50px; }

                .ribbon-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2px;
                }

                .ribbon-styles-container {
                    display: flex;
                    gap: 8px;
                    height: 100%;
                    padding: 4px 0;
                    overflow-x: auto;
                }

                .style-box {
                    width: 70px;
                    border: 1px solid transparent;
                    border-radius: 4px;
                    display: flex;
                    flex-direction: column;
                    cursor: pointer;
                    background: var(--input-bg);
                }

                .style-box.active {
                    border-color: black;
                    outline: 1px solid black;
                }

                .style-preview {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: var(--editor-text-color);
                }

                .style-preview.h1 { font-size: 18px; font-weight: bold; }
                .style-preview.h2 { font-size: 16px; font-weight: bold; }
                .style-preview.h3 { font-size: 14px; font-weight: bold; }

                .style-name {
                    font-size: 10px;
                    padding: 2px 4px;
                    border-top: 1px solid var(--separator-color);
                    text-align: center;
                    color: var(--editor-text-color);
                }

                .ribbon-spacer {
                    flex: 1;
                }

                .ribbon-theme-toggle {
                    display: flex;
                    align-items: center;
                    padding-right: 10px;
                }

                .theme-toggle-btn {
                    padding: 6px 12px;
                    border-radius: 20px;
                    border: 1px solid var(--editor-border);
                    background: transparent;
                    color: inherit;
                    cursor: pointer;
                    font-size: 12px;
                }

                .theme-toggle-btn:hover {
                    background-color: var(--hover-bg);
                }

                [data-theme="dark"] .theme-toggle-btn:hover {
                    background-color: rgba(255,255,255,0.1);
                }

                .export-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    margin-top: 4px;
                    background: var(--editor-ribbon-bg);
                    border: 1px solid var(--editor-border);
                    border-radius: 8px;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.14);
                    padding: 4px 0;
                    min-width: 160px;
                    z-index: 1000;
                }

                .export-option {
                    width: 100%;
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 12px;
                    color: var(--editor-text-color);
                    transition: background 0.1s;
                    background: transparent;
                    border: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-align: left;
                }

                .export-option:hover {
                    background-color: var(--hover-bg);
                }

                [data-theme="dark"] .export-option:hover {
                    background-color: rgba(255,255,255,0.1);
                }

                .ribbon-column {
                    position: relative;
                }
            `}</style>
        </div>
    );
};

export default EditorRibbon;
