import React from 'react';

const RibbonGroup = ({ children }) => (
    <div className="ribbon-group">
        <div className="ribbon-group-content">
            {children}
        </div>
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

            <RibbonGroup>
                <div className="ribbon-row">
                    <select
                        className="ribbon-select font-family"
                        value={editor?.getAttributes('textStyle').fontFamily || localStorage.getItem('editor-default-font') || "Calibri, sans-serif"}
                        onChange={(e) => {
                            const font = e.target.value;
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
                    <button className="ribbon-button-mini">"</button>
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
                        <span className="icon">📊</span>
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
                <div className="ribbon-column">
                    <button
                        className="ribbon-button large"
                        onClick={(e) => {
                            const dropdown = e.currentTarget.nextElementSibling;
                            if (dropdown) {
                                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                            }
                        }}
                        title="Export Note"
                    >
                        <span className="icon">📥</span>
                        <span>Export</span>
                    </button>
                    <div className="export-dropdown" style={{ display: 'none' }}>
                        <div
                            className="export-option"
                            onClick={() => {
                                // Export as PDF (using print dialog)
                                window.print();
                            }}
                        >
                            📄 PDF
                        </div>
                        <div
                            className="export-option"
                            onClick={() => {
                                // Export as Markdown
                                const text = editor?.getText() || '';
                                const blob = new Blob([text], { type: 'text/markdown' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'note.md';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                        >
                            📝 Markdown
                        </div>
                        <div
                            className="export-option"
                            onClick={() => {
                                // Export as HTML
                                const html = editor?.getHTML() || '';
                                const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Note Export</title>
    <style>
        body { font-family: Calibri, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        img { max-width: 100%; }
        pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ddd; padding: 8px; }
    </style>
</head>
<body>
${html}
</body>
</html>`;
                                const blob = new Blob([fullHtml], { type: 'text/html' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'note.html';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                        >
                            🌐 HTML
                        </div>
                        <div
                            className="export-option"
                            onClick={() => {
                                // Export as Plain Text
                                const text = editor?.getText() || '';
                                const blob = new Blob([text], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'note.txt';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                        >
                            📃 Plain Text
                        </div>
                    </div>
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

                .export-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    margin-top: 4px;
                    background: #FFFFFF;
                    border: 1px solid var(--editor-border);
                    border-radius: 8px;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.14);
                    padding: 4px 0;
                    min-width: 160px;
                    z-index: 1000;
                }

                [data-theme="dark"] .export-dropdown {
                    background: #1A1A1A;
                }

                .export-option {
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 12px;
                    color: var(--editor-text-color);
                    transition: background 0.1s;
                }

                .export-option:hover {
                    background-color: #f0f0f0;
                }

                [data-theme="dark"] .export-option:hover {
                    background-color: #333;
                }

                .ribbon-column {
                    position: relative;
                }
            `}</style>
        </div>
    );
};

export default EditorRibbon;
