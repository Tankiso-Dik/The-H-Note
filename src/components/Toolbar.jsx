import React from 'react';

const Toolbar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="toolbar">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
            >
                B
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
            >
                I
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'is-active' : ''}
            >
                S
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                disabled={!editor.can().chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'is-active' : ''}
            >
                {'<>'}
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            >
                H1
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            >
                H2
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
            >
                • List
            </button>

            <style>{`
                .toolbar {
                    display: flex;
                    gap: 8px;
                    padding: 8px 24px;
                    border-bottom: 1px solid var(--border-color);
                    background-color: var(--bg-sidebar); 
                }
                .toolbar button {
                    background: none;
                    border: 1px solid transparent;
                    border-radius: 4px;
                    cursor: pointer;
                    padding: 4px 8px;
                    font-size: 14px;
                    color: var(--text-secondary);
                }
                .toolbar button:hover {
                    background-color: var(--hover-bg);
                    color: var(--text-primary);
                }
                .toolbar button.is-active {
                    background-color: var(--selection-bg);
                    color: var(--text-primary);
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
};

export default Toolbar;
