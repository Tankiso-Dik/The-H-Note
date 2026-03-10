import React, { useEffect, useMemo, useRef, useState } from 'react';
import { exportMarkdownFile, exportPdfDocument, exportPlainTextFile } from '../../lib/noteExport';
import LinkEditorPopover from './LinkEditorPopover';
import { applyEditorLink, runEditorCommand } from './editorActions';

const RibbonGroup = ({ children }) => (
    <div className="ribbon-group">
        <div className="ribbon-group-content">
            {children}
        </div>
    </div>
);

const IMPORT_ACCEPT = {
    markdown: '.md,.markdown,text/markdown,text/x-markdown',
    text: '.txt,text/plain',
    pdf: '.pdf,application/pdf',
};

const EditorRibbon = ({ editor, noteTitle, onToggleTheme, theme, onBack, onOpenFile }) => {
    const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
    const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
    const fileMenuRef = useRef(null);
    const linkMenuRef = useRef(null);
    const importInputRef = useRef(null);
    const importKindRef = useRef('markdown');

    useEffect(() => {
        if (!isFileMenuOpen) {
            return;
        }

        const handleOutsideClick = (event) => {
            if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) {
                setIsFileMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsFileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isFileMenuOpen]);

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

    const fileOptions = useMemo(() => [
        {
            label: 'Open Markdown',
            icon: '📘',
            action: () => {
                importKindRef.current = 'markdown';
                if (importInputRef.current) {
                    importInputRef.current.accept = IMPORT_ACCEPT.markdown;
                    importInputRef.current.click();
                }
            },
        },
        {
            label: 'Open Text',
            icon: '📄',
            action: () => {
                importKindRef.current = 'text';
                if (importInputRef.current) {
                    importInputRef.current.accept = IMPORT_ACCEPT.text;
                    importInputRef.current.click();
                }
            },
        },
        {
            label: 'Open PDF',
            icon: '📕',
            hint: 'text only',
            action: () => {
                importKindRef.current = 'pdf';
                if (importInputRef.current) {
                    importInputRef.current.accept = IMPORT_ACCEPT.pdf;
                    importInputRef.current.click();
                }
            },
        },
        { type: 'separator' },
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
    const hasExplicitTextAlign =
        editor?.isActive({ textAlign: 'center' }) ||
        editor?.isActive({ textAlign: 'right' }) ||
        editor?.isActive({ textAlign: 'justify' });

    const handleFontFamilyChange = (font) => {
        localStorage.setItem('editor-default-font', font);
        editor?.chain().setFontFamily(font).run();
    };

    const handleFontSizeChange = (size) => {
        localStorage.setItem('editor-default-font-size', size);
        editor?.chain().setMark('textStyle', { fontSize: `${size}pt` }).run();
    };

    const applyLink = (url) => {
        applyEditorLink(editor, url);
        setIsLinkEditorOpen(false);
    };

    const handleImportedFileChange = async (event) => {
        const [file] = Array.from(event.target.files || []);
        event.target.value = '';

        if (!file || !onOpenFile) {
            return;
        }

        await onOpenFile(file, importKindRef.current);
        setIsFileMenuOpen(false);
    };

    return (
        <div className="editor-ribbon">
            <div className="ribbon-left-rail">
                <div className="file-panel-anchor" ref={fileMenuRef}>
                    <button
                        className={`ribbon-file-btn ${isFileMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsFileMenuOpen((prev) => !prev)}
                        title="File"
                        type="button"
                    >
                        <span className="icon">📂</span>
                        <span>File</span>
                    </button>
                    <input
                        ref={importInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={handleImportedFileChange}
                    />
                    {isFileMenuOpen ? (
                        <div className="file-panel">
                            <div className="file-panel-header">
                                <span className="file-panel-title">File</span>
                                <span className="file-panel-subtitle">Open or export this note</span>
                            </div>
                            <div className="file-panel-section">
                                <span className="file-panel-section-label">Open</span>
                                {fileOptions.filter((option) => option.label?.startsWith('Open')).map((option) => (
                                    <button
                                        key={option.label}
                                        className="file-panel-option"
                                        onClick={() => option.action()}
                                        type="button"
                                    >
                                        <span>{option.icon}</span>
                                        <span className="file-panel-option-label">{option.label}</span>
                                        {option.hint ? <span className="file-panel-option-hint">{option.hint}</span> : null}
                                    </button>
                                ))}
                            </div>
                            <div className="file-panel-section">
                                <span className="file-panel-section-label">Export</span>
                                {fileOptions.filter((option) => option.label && !option.label.startsWith('Open')).map((option) => (
                                    <button
                                        key={option.label}
                                        className="file-panel-option"
                                        onClick={() => {
                                            option.action();
                                            setIsFileMenuOpen(false);
                                        }}
                                        type="button"
                                    >
                                        <span>{option.icon}</span>
                                        <span className="file-panel-option-label">{option.label}</span>
                                        {option.hint ? <span className="file-panel-option-hint">{option.hint}</span> : null}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
                <button
                    className="ribbon-back-btn"
                    onClick={onBack}
                    title="Back to Notes"
                    type="button"
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
                            handleFontFamilyChange(e.target.value);
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
                            handleFontSizeChange(e.target.value);
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
                        onClick={() => runEditorCommand(editor, 'toggleBulletList')}
                        title="Bullet List"
                    >•</button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('orderedList') ? 'active' : ''}`}
                        onClick={() => runEditorCommand(editor, 'toggleOrderedList')}
                        title="Numbered List"
                    >1.</button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('taskList') ? 'active' : ''}`}
                        onClick={() => runEditorCommand(editor, 'toggleTaskList')}
                        title="Task List"
                    >☑</button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive('blockquote') ? 'active' : ''}`}
                        onClick={() => runEditorCommand(editor, 'toggleBlockquote')}
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
                <div className="ribbon-grid align-grid">
                    <button
                        className={`ribbon-button-mini ${!hasExplicitTextAlign ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                        title="Align Left"
                    >L</button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                        title="Align Center"
                    >C</button>
                    <button
                        className={`ribbon-button-mini ${editor?.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                        title="Align Right"
                    >R</button>
                </div>
            </RibbonGroup>

            <RibbonGroup>
                <div className="ribbon-column compact-tools">
                    <button
                        className="ribbon-button small"
                        onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        title="Insert 3x3 Table"
                        type="button"
                    >
                        <span className="icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                        onClick={() => runEditorCommand(editor, 'toggleCodeBlock')}
                        title="Code Block"
                        type="button"
                    >
                        <span className="icon">💻</span>
                        <span>Code</span>
                    </button>
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
                    min-height: 118px;
                    background-color: var(--editor-ribbon-bg);
                    border-bottom: 1px solid var(--editor-border);
                    display: flex;
                    flex-wrap: wrap;
                    align-items: flex-start;
                    gap: 8px 0;
                    padding: 8px 14px 10px;
                    color: var(--editor-text-color);
                }

                .ribbon-left-rail {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 8px;
                    min-width: 94px;
                    padding: 2px 2px 2px 0;
                }

                .file-panel-anchor {
                    position: relative;
                }

                .ribbon-file-btn,
                .ribbon-back-btn {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 10px;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 12px;
                    padding: 10px 12px;
                    min-width: 0;
                    cursor: pointer;
                    color: inherit;
                    transition: background 0.2s;
                    text-align: left;
                    font-size: 13px;
                    font-weight: 600;
                }

                .ribbon-file-btn {
                    border-color: color-mix(in srgb, var(--editor-border) 80%, transparent);
                    background: color-mix(in srgb, var(--editor-page-bg) 80%, transparent);
                    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
                }

                .ribbon-file-btn.active {
                    background: var(--hover-bg);
                    border-color: color-mix(in srgb, var(--color-accent) 48%, var(--editor-border));
                }

                .ribbon-file-btn:hover,
                .ribbon-back-btn:hover {
                    background-color: var(--hover-bg);
                }

                [data-theme="dark"] .ribbon-file-btn:hover,
                [data-theme="dark"] .ribbon-back-btn:hover {
                    background-color: rgba(255,255,255,0.1);
                }

                .ribbon-file-btn .icon,
                .ribbon-back-btn .icon {
                    font-size: 18px;
                }

                .file-panel {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    width: 280px;
                    max-width: min(280px, calc(100vw - 32px));
                    background: color-mix(in srgb, var(--editor-page-bg) 96%, white 4%);
                    border: 1px solid color-mix(in srgb, var(--editor-border) 84%, transparent);
                    border-radius: 18px;
                    box-shadow: 0 22px 40px rgba(15, 23, 42, 0.16);
                    padding: 14px;
                    z-index: 1000;
                }

                .file-panel-header {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    margin-bottom: 10px;
                }

                .file-panel-title {
                    font-size: 14px;
                    font-weight: 700;
                }

                .file-panel-subtitle {
                    font-size: 11px;
                    opacity: 0.68;
                }

                .file-panel-section {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .file-panel-section + .file-panel-section {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid color-mix(in srgb, var(--editor-border) 75%, transparent);
                }

                .file-panel-section-label {
                    font-size: 10px;
                    font-weight: 700;
                    opacity: 0.68;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    padding: 0 4px;
                }

                .file-panel-option {
                    width: 100%;
                    padding: 10px 12px;
                    cursor: pointer;
                    font-size: 13px;
                    color: var(--editor-text-color);
                    transition: background 0.12s;
                    background: transparent;
                    border: 0;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-align: left;
                }

                .file-panel-option:hover {
                    background: var(--hover-bg);
                }

                .file-panel-option-label {
                    flex: 1;
                    font-weight: 500;
                }

                .file-panel-option-hint {
                    font-size: 10px;
                    opacity: 0.6;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
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
                    min-height: 30px;
                    padding: 2px 4px;
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

                .compact-tools {
                    gap: 6px;
                    justify-content: center;
                }

                .compact-tools .ribbon-button {
                    min-height: 30px;
                    border-radius: 10px;
                    padding: 6px 10px;
                }

                .compact-tools .ribbon-button.active {
                    background-color: var(--selection-bg);
                    border-color: var(--color-accent);
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

                @media (max-width: 1180px) {
                    .ribbon-spacer {
                        display: none;
                    }

                    .ribbon-theme-toggle {
                        margin-left: auto;
                        padding-right: 0;
                    }
                }

                @media (max-width: 900px) {
                    .editor-ribbon {
                        padding: 8px 10px 10px;
                    }

                    .ribbon-left-rail {
                        width: 100%;
                        flex-direction: row;
                        min-width: 0;
                    }

                    .ribbon-separator {
                        display: none;
                    }

                    .ribbon-group {
                        padding: 2px 4px;
                    }

                }

                @media (max-width: 680px) {
                    .editor-ribbon {
                        flex-wrap: nowrap;
                        overflow-x: auto;
                        overflow-y: hidden;
                        align-items: stretch;
                        gap: 0;
                        padding-bottom: 12px;
                    }

                    .ribbon-file-btn,
                    .ribbon-back-btn {
                        min-height: 42px;
                    }

                    .ribbon-left-rail {
                        width: auto;
                        min-width: 128px;
                        flex-direction: column;
                    }

                    .ribbon-group {
                        min-width: max-content;
                        padding-left: 6px;
                        padding-right: 6px;
                    }

                    .ribbon-theme-toggle {
                        width: auto;
                        justify-content: center;
                        padding-left: 10px;
                    }

                    .ribbon-button-mini {
                        width: 36px;
                        height: 36px;
                    }

                    .ribbon-select {
                        min-height: 36px;
                        font-size: 12px;
                    }

                    .compact-tools .ribbon-button,
                    .theme-toggle-btn {
                        min-height: 38px;
                    }
                }
            `}</style>
        </div>
    );
};

export default EditorRibbon;
