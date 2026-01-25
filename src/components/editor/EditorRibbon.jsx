import React from 'react';

const RibbonGroup = ({ label, children }) => (
    <div className="ribbon-group">
        <div className="ribbon-group-content">
            {children}
        </div>
        <div className="ribbon-group-label">{label}</div>
    </div>
);

const EditorRibbon = ({ editor, onToggleTheme, theme, onBack }) => {
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

            <RibbonGroup label="Font">
                <div className="ribbon-row">
                    <select className="ribbon-select font-family">
                        <option>Calibri</option>
                        <option>Arial</option>
                        <option>Times New Roman</option>
                    </select>
                    <select className="ribbon-select font-size">
                        <option>11</option>
                        <option>12</option>
                        <option>14</option>
                        <option>16</option>
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

            <RibbonGroup label="Paragraph">
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
                    <button className="ribbon-button-mini">"</button>
                    <button
                        className="ribbon-button-mini"
                        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Rule"
                    >—</button>
                </div>
            </RibbonGroup>

            <div className="ribbon-separator" />

            <RibbonGroup label="Styles">
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

            <RibbonGroup label="Insert">
                <div className="ribbon-column">
                    <button
                        className="ribbon-button large"
                        onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        title="Insert 3x3 Table"
                    >
                        <span className="icon">📊</span>
                        <span>Table</span>
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
                    height: 120px;
                    background-color: var(--editor-ribbon-bg);
                    border-bottom: 1px solid var(--editor-border);
                    display: flex;
                    padding: 4px 12px;
                    align-items: stretch;
                    color: var(--editor-text-color);
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
                    background-color: rgba(0,0,0,0.05);
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
                    background-color: #E5E5E5;
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
                    background-color: #f0f0f0;
                }

                [data-theme="dark"] .ribbon-button:hover {
                    background-color: #333;
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
                    background-color: #f0f0f0;
                }

                .ribbon-button-mini.active {
                    background-color: var(--selection-bg);
                    border-color: var(--color-accent);
                }

                [data-theme="dark"] .ribbon-button-mini:hover {
                    background-color: #333;
                }

                [data-theme="dark"] .ribbon-button-mini.active {
                    background-color: #333;
                    border-color: var(--color-accent);
                }

                .ribbon-select {
                    font-size: 11px;
                    padding: 2px;
                    border: 1px solid #ddd;
                    border-radius: 2px;
                    background: var(--editor-ribbon-bg);
                    color: inherit;
                }

                .ribbon-select.font-family { width: 100px; }
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
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    display: flex;
                    flex-direction: column;
                    cursor: pointer;
                    background: var(--editor-page-bg);
                }

                .style-box.active {
                    border-color: var(--color-accent);
                    outline: 1px solid var(--color-accent);
                }

                .style-preview {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: #333;
                }

                [data-theme="dark"] .style-preview { color: #E0E0E0; }

                .style-preview.h1 { font-size: 18px; font-weight: bold; }
                .style-preview.h2 { font-size: 16px; font-weight: bold; }
                .style-preview.h3 { font-size: 14px; font-weight: bold; }

                .style-name {
                    font-size: 10px;
                    padding: 2px 4px;
                    border-top: 1px solid #eee;
                    text-align: center;
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
                    background-color: #f0f0f0;
                }

                [data-theme="dark"] .theme-toggle-btn:hover {
                    background-color: #333;
                }
            `}</style>
        </div>
    );
};

export default EditorRibbon;
