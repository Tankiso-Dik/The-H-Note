import React, { useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import EditorContextMenu from './EditorContextMenu';

const getEditorPlainText = (editor) => editor?.getText({ blockSeparator: '\n\n' }) || '';

const writeClipboardContent = async ({ text, html }) => {
    if (navigator.clipboard?.write && window.ClipboardItem && html) {
        try {
            const item = new window.ClipboardItem({
                'text/plain': new Blob([text], { type: 'text/plain' }),
                'text/html': new Blob([html], { type: 'text/html' }),
            });
            await navigator.clipboard.write([item]);
            return;
        } catch (error) {
            if (!navigator.clipboard?.writeText) {
                throw error;
            }
        }
    }

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    throw new Error('Clipboard access is unavailable.');
};

const EditorWorkspace = ({ editor, noteTitle, onRenameTitle, onStatusMessage }) => {
    const [contextMenu, setContextMenu] = useState(null);
    const [draftTitle, setDraftTitle] = useState(noteTitle || '');
    const [isCanvasHovered, setIsCanvasHovered] = useState(false);
    const [copiedTarget, setCopiedTarget] = useState(null);
    const titleInputRef = useRef(null);
    const pageCanvasRef = useRef(null);
    const copiedTimeoutRef = useRef(null);

    useEffect(() => {
        setDraftTitle(noteTitle || '');
    }, [noteTitle]);

    useEffect(() => {
        return () => {
            if (copiedTimeoutRef.current) {
                window.clearTimeout(copiedTimeoutRef.current);
            }
        };
    }, []);

    const handleContextMenu = (e) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY
        });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    const commitTitle = () => {
        const trimmed = draftTitle.trim();

        if (!trimmed) {
            setDraftTitle(noteTitle || '');
            return;
        }

        if (trimmed !== noteTitle) {
            onRenameTitle(trimmed);
        }
    };

    const showCopiedState = (target) => {
        if (copiedTimeoutRef.current) {
            window.clearTimeout(copiedTimeoutRef.current);
        }

        setCopiedTarget(target);
        copiedTimeoutRef.current = window.setTimeout(() => {
            setCopiedTarget((current) => current === target ? null : current);
        }, 1600);
    };

    const handleCanvasMouseLeave = () => {
        setIsCanvasHovered(false);
    };

    const handleCopyDocument = async () => {
        if (!editor) {
            return;
        }

        try {
            await writeClipboardContent({
                text: getEditorPlainText(editor),
                html: editor.getHTML(),
            });
            showCopiedState('document');
        } catch (error) {
            console.error(error);
            onStatusMessage?.('Clipboard access is unavailable in this browser.', 'error');
        }
    };

    return (
        <div className="editor-workspace">
            <div className="quick-access-header">
                <div className="quick-actions">
                    <button
                        className="quick-action-btn"
                        title="Undo"
                        onClick={() => editor?.chain().focus().undo().run()}
                    >↩️</button>
                    <button
                        className="quick-action-btn"
                        title="Redo"
                        onClick={() => editor?.chain().focus().redo().run()}
                    >↪️</button>
                </div>
                <input
                    ref={titleInputRef}
                    className="note-title-input"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            commitTitle();
                            titleInputRef.current?.blur();
                        }

                        if (event.key === 'Escape') {
                            setDraftTitle(noteTitle || '');
                            titleInputRef.current?.blur();
                        }
                    }}
                    placeholder="Untitled Note"
                    aria-label="Note title"
                />
                <div className="header-spacer" />
            </div>

            <div className="workspace-scroll-area">
                <div
                    ref={pageCanvasRef}
                    className="page-canvas"
                    onContextMenu={handleContextMenu}
                    onMouseEnter={() => setIsCanvasHovered(true)}
                    onMouseLeave={handleCanvasMouseLeave}
                >
                    <button
                        className={`canvas-copy-btn document-copy ${isCanvasHovered ? 'visible' : ''}`}
                        onClick={handleCopyDocument}
                        title={copiedTarget === 'document' ? 'Copied' : 'Copy document'}
                        aria-label={copiedTarget === 'document' ? 'Copied' : 'Copy document'}
                        type="button"
                    >
                        {copiedTarget === 'document' ? '✓' : '⧉'}
                    </button>
                    <EditorContent editor={editor} />
                </div>
            </div>

            {contextMenu && (
                <EditorContextMenu
                    editor={editor}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={closeContextMenu}
                />
            )}

            <style>{`
                .editor-workspace {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background-color: var(--editor-workspace-bg);
                    overflow: hidden;
                    position: relative;
                }

                .quick-access-header {
                    min-height: 42px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 0 18px;
                    background-color: var(--editor-ribbon-bg);
                    border-bottom: 1px solid var(--editor-border);
                    font-size: 12px;
                }

                .quick-actions {
                    display: flex;
                    gap: 6px;
                    margin-right: 8px;
                }

                .quick-action-btn {
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    opacity: 0.7;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    width: 30px;
                    height: 30px;
                }

                .quick-action-btn:hover {
                    opacity: 1;
                    background-color: rgba(0,0,0,0.05);
                }

                .note-title-input {
                    flex: 1;
                    min-width: 0;
                    max-width: 520px;
                    border: 1px solid transparent;
                    background: transparent;
                    color: var(--editor-text-color);
                    opacity: 0.92;
                    font: inherit;
                    font-size: 13px;
                    font-weight: 600;
                    border-radius: 10px;
                    padding: 8px 10px;
                }

                .note-title-input:hover {
                    background-color: var(--hover-bg);
                }

                .note-title-input:focus {
                    outline: none;
                    opacity: 1;
                    background-color: var(--editor-page-bg);
                    border-color: var(--editor-border);
                }

                .header-spacer { flex: 1; }

                .workspace-scroll-area {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: auto;
                    display: block;
                    padding: 24px 0 72px;
                    background:
                        radial-gradient(circle at top, rgba(255,255,255,0.55), transparent 45%),
                        linear-gradient(180deg, color-mix(in srgb, var(--editor-workspace-bg) 88%, white 12%), var(--editor-workspace-bg));
                }

                .page-canvas {
                    width: min(100%, 820px);
                    min-width: 0;
                    min-height: 100%;
                    background: transparent;
                    border: 0;
                    border-radius: 0;
                    box-shadow: none;
                    padding: 14px 44px 120px;
                    margin: 0 auto;
                    color: var(--editor-text-color);
                    cursor: text;
                    position: relative;
                }

                .canvas-copy-btn {
                    position: absolute;
                    z-index: 3;
                    border: 1px solid color-mix(in srgb, var(--editor-border) 82%, transparent);
                    background: color-mix(in srgb, var(--editor-page-bg) 94%, white 6%);
                    color: var(--editor-text-color);
                    border-radius: 999px;
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
                    opacity: 0;
                    pointer-events: none;
                    transform: translateY(-4px);
                    transition: opacity 0.16s ease, transform 0.16s ease;
                }

                .canvas-copy-btn.visible {
                    opacity: 1;
                    pointer-events: auto;
                    transform: translateY(0);
                }

                .document-copy {
                    top: 12px;
                    right: 20px;
                }

                @media (max-width: 760px) {
                    .workspace-scroll-area {
                        padding: 12px 0 32px;
                        background: var(--editor-workspace-bg);
                    }

                    .page-canvas {
                        width: 100%;
                        min-height: auto;
                        padding: 6px 18px 44px;
                    }

                    .document-copy {
                        top: 10px;
                        right: 10px;
                    }

                    .canvas-copy-btn {
                        opacity: 1;
                        pointer-events: auto;
                        transform: none;
                    }
                }

                .ProseMirror {
                    outline: none;
                    min-height: calc(100vh - 260px);
                    padding: 32px 0 20px;
                    text-align: left;
                    font-family: Calibri, sans-serif;
                    font-size: 16px;
                    line-height: 1.75;
                    color: var(--editor-text-color);
                }

                .ProseMirror a {
                    color: var(--color-accent);
                    text-decoration: underline;
                    text-underline-offset: 0.16em;
                }

                .ProseMirror code:not(pre code) {
                    background: rgba(15, 23, 42, 0.08);
                    border-radius: 6px;
                    padding: 0.12rem 0.35rem;
                    font-family: 'Source Code Pro', 'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace;
                    font-size: 0.92em;
                }

                .ProseMirror blockquote {
                    margin: 1rem 0;
                    padding: 0.1rem 0 0.1rem 1rem;
                    border-left: 3px solid var(--color-accent);
                    color: color-mix(in srgb, var(--editor-text-color) 78%, transparent);
                    font-style: italic;
                }

                /* List Styles */
                .ProseMirror ul, 
                .ProseMirror ol {
                    padding: 0 1rem 0 1.5rem;
                    margin: 0.5rem 0;
                }

                .ProseMirror ul { list-style-type: disc; }
                .ProseMirror ol { list-style-type: decimal; }

                /* Task List Styles */
                .ProseMirror ul[data-type="taskList"] {
                    list-style: none;
                    padding: 0;
                }

                .ProseMirror ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 0.25rem;
                }

                .ProseMirror ul[data-type="taskList"] label {
                    flex: 0 0 auto;
                    margin-right: 0.5rem;
                    user-select: none;
                    cursor: pointer;
                }

                .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
                    cursor: pointer;
                    width: 1rem;
                    height: 1rem;
                    margin: 0.25rem 0 0 0;
                }

                .ProseMirror ul[data-type="taskList"] div {
                    flex: 1 1 auto;
                }

                .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
                    text-decoration: line-through;
                    opacity: 0.5;
                }

                /* Table Styles */
                .ProseMirror table {
                    border-collapse: collapse;
                    table-layout: fixed;
                    width: 100%;
                    margin: 0;
                    overflow: hidden;
                }

                .ProseMirror td,
                .ProseMirror th {
                    min-width: 1em;
                    border: 1px solid var(--editor-border);
                    padding: 6px 8px;
                    vertical-align: top;
                    box-sizing: border-box;
                    position: relative;
                }

                .ProseMirror th {
                    font-weight: bold;
                    text-align: left;
                    background-color: rgba(0,0,0,0.05);
                }

                [data-theme="dark"] .ProseMirror th {
                    background-color: rgba(255,255,255,0.05);
                }

                .ProseMirror .selectedCell:after {
                    z-index: 2;
                    position: absolute;
                    content: "";
                    left: 0; right: 0; top: 0; bottom: 0;
                    background: var(--selection-bg);
                    opacity: 0.4;
                    pointer-events: none;
                }

                /* Code Block Styles */
                .ProseMirror pre {
                    background-color: var(--code-block-bg);
                    border: 1px solid var(--code-block-border);
                    border-radius: 8px;
                    padding: 16px;
                    margin: 1rem 0;
                    overflow-x: auto;
                    font-family: 'Source Code Pro', 'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace;
                    font-size: 14px;
                    line-height: 1.6;
                    color: var(--code-block-text);
                }

                .ProseMirror pre code {
                    background: none;
                    padding: 0;
                    border: none;
                    font-size: inherit;
                    color: inherit;
                    font-family: inherit;
                }

                /* Syntax Highlighting */
                .ProseMirror pre .hljs-keyword,
                .ProseMirror pre .hljs-selector-tag,
                .ProseMirror pre .hljs-literal,
                .ProseMirror pre .hljs-section,
                .ProseMirror pre .hljs-link {
                    color: var(--code-syntax-keyword);
                }

                .ProseMirror pre .hljs-string,
                .ProseMirror pre .hljs-title,
                .ProseMirror pre .hljs-name,
                .ProseMirror pre .hljs-type,
                .ProseMirror pre .hljs-attribute,
                .ProseMirror pre .hljs-symbol,
                .ProseMirror pre .hljs-bullet,
                .ProseMirror pre .hljs-addition,
                .ProseMirror pre .hljs-variable,
                .ProseMirror pre .hljs-template-tag,
                .ProseMirror pre .hljs-template-variable {
                    color: var(--code-syntax-string);
                }

                .ProseMirror pre .hljs-comment,
                .ProseMirror pre .hljs-quote,
                .ProseMirror pre .hljs-deletion,
                .ProseMirror pre .hljs-meta {
                    color: var(--code-syntax-comment);
                }

                .ProseMirror pre .hljs-function,
                .ProseMirror pre .hljs-class,
                .ProseMirror pre .hljs-title.class_,
                .ProseMirror pre .hljs-title.function_ {
                    color: var(--code-syntax-function);
                }

                /* Image Styles */
                .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                    margin: 0.5rem 0;
                    cursor: pointer;
                }

                .ProseMirror img.ProseMirror-selectednode {
                    outline: 2px solid var(--color-accent);
                    outline-offset: 2px;
                }

                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }

                @media (max-width: 760px) {
                    .quick-access-header {
                        padding: 0 12px;
                    }

                    .note-title-input {
                        max-width: none;
                    }

                    .ProseMirror {
                        min-height: 42vh;
                        padding-top: 40px;
                    }
                }
            `}</style>
        </div>
    );
};

export default EditorWorkspace;
