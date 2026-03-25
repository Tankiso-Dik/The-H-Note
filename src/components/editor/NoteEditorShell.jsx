import React from 'react';
import { useEditor } from '@tiptap/react';
import { DOMParser } from '@tiptap/pm/model';
import { Slice } from '@tiptap/pm/model';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { History } from '@tiptap/extension-history';
import { Bold } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { Underline } from '@tiptap/extension-underline';
import { Strike } from '@tiptap/extension-strike';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Heading } from '@tiptap/extension-heading';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Placeholder } from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { FontFamily } from '@tiptap/extension-font-family';
import { Image } from '@tiptap/extension-image';
import { FileHandler } from '@tiptap/extension-file-handler';
import { TextAlign } from '@tiptap/extension-text-align';
import { Gapcursor } from '@tiptap/extension-gapcursor';
import { ListKeymap } from '@tiptap/extension-list-keymap';
import { Link } from '@tiptap/extension-link';
import { Code } from '@tiptap/extension-code';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Markdown } from 'tiptap-markdown';
import EditorRibbon from './EditorRibbon';
import ImportNoteDialog from './ImportNoteDialog';

const lowlight = createLowlight(common);
import EditorWorkspace from './EditorWorkspace';
import { FontSize } from '../../extensions/FontSize';
import { plainTextToHtml, readImportedNoteFile } from '../../lib/noteFileIO';
import {
    getSelectedEditorClipboardContent,
    writeClipboardContentToEvent,
} from './editorClipboard';

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read file.'));
    reader.readAsDataURL(file);
});

const insertHtmlDirectly = (view, html, from, to) => {
    const schema = view.state.schema;
    const parser = DOMParser.fromSchema(schema);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const slice = parser.parseSlice(tempDiv, { preserveWhitespace: true });

    const tr = view.state.tr.replaceRange(from, to, slice);
    view.dispatch(tr);
    return true;
};

const insertImageFiles = async (editor, files, pos = null) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
        return;
    }

    const imageNodes = (await Promise.all(imageFiles.map(readFileAsDataUrl)))
        .filter(Boolean)
        .map((src) => ({ type: 'image', attrs: { src } }));

    if (imageNodes.length === 0) {
        return;
    }

    if (typeof pos === 'number') {
        editor.chain().focus(pos).insertContentAt(pos, imageNodes).run();
        return;
    }

    editor.chain().focus().insertContent(imageNodes).run();
};

let editorSchema = null;
const getEditorSchema = () => {
    if (editorSchema) {
        return editorSchema;
    }
    const tempEditor = document.createElement('div');
    tempEditor.innerHTML = '<p></p>';
    const parser = new DOMParser();
    const schema = parser.parseDOM(tempEditor).schema;
    editorSchema = schema;
    return schema;
};

const parseHtmlToProseMirrorJson = (html) => {
    if (!html || typeof html !== 'string') {
        return null;
    }

    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const parser = DOMParser.fromSchema(getEditorSchema());
        const doc = parser.parse(tempDiv);

        return doc.toJSON();
    } catch (e) {
        return null;
    }
};

const MARKDOWN_PATTERNS = [
    /^#{1,6}\s/m,
    /^>\s/m,
    /^```[\s\S]*```/m,
    /^[-*+]\s/m,
    /^\d+\.\s/m,
    /^-\s\[[ xX]\]\s/m,
    /!\[[^\]]*]\([^)]+\)/,
    /\[[^\]]+]\([^)]+\)/,
    /^\|.+\|\s*$/m,
];

const MARKDOWN_TABLE_SEPARATOR = /^\|?(?:\s*:?-{3,}:?\s*\|){1,}\s*:?-{3,}:?\s*$/m;
const MEANINGFUL_PASTE_HTML = /<(table|img|h[1-6]|ul|ol|li|p|blockquote|pre|code)\b/i;
const ARTIFACT_MARKERS = /(?:cite|entity)[\s\S]*?/g;

const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizePastedPlainText = (text) => {
    if (!text) {
        return '';
    }

    // Only normalise line endings and strip invisible zero-width characters.
    // Do NOT strip trailing whitespace from lines, collapse blank lines, or
    // trim the string – doing so loses intentional indentation and paragraph
    // spacing that the user expects to be preserved after a paste.
    return text
        .replace(/\r\n?/g, '\n')
        .replace(/\u200B/g, '')
        .replace(ARTIFACT_MARKERS, '');
};

const normalizePastedHtml = (html) => {
  if (!html) {
    return html;
  }

  return html
    .replace(ARTIFACT_MARKERS, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Strip background-color only – foreground color is intentional and
    // should be preserved. The old regex also matched "color" which wiped
    // out all text colour information from rich-text sources.
    .replace(/\s*background(?:-color)?\s*:\s*[^;"']+[;"']/gi, '')
    .trim();
};

const isTabularText = (text) => {
    const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        return false;
    }

    const tabCounts = lines.map((line) => (line.match(/\t/g) || []).length);
    const expectedTabs = tabCounts[0];

    return expectedTabs > 0 && tabCounts.every((count) => count === expectedTabs);
};

const tabularTextToHtml = (text) => {
    const rows = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split('\t').map((cell) => escapeHtml(cell.trim())));

    if (rows.length === 0) {
        return '';
    }

    const [headerRow, ...bodyRows] = rows;
    const headerHtml = `<tr>${headerRow.map((cell) => `<th>${cell}</th>`).join('')}</tr>`;
    const bodyHtml = bodyRows
        .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
        .join('');

    return `<table><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table>`;
};

const looksLikeCode = (text) => {
    if (!text) {
        return false;
    }

    const codeIndicators = [
        /\bBEGIN\b/i,
        /\bEND\b/i,
        /\bDECLARE\b/i,
        /\bPROCEDURE\b/i,
        /\bFUNCTION\b/i,
        /\bINSERT\s+INTO\b/i,
        /\bUPDATE\s+SET\b/i,
        /\bDELETE\s+FROM\b/i,
        /\bSELECT\s+.*\s+INTO\b/i,
        /\bIF\s+.*\s+THEN\b/i,
        /\bFOR\s+.*\s+IN\b/i,
        /\bLOOP\b/i,
        /\bSQL%ROWCOUNT\b/i,
        /;\s*$/m,
        /\/\s*$/m,
        /\bVARCHAR2\b/i,
        /\bNUMBER\b/i,
        /\bDECLARE\b/i,
        /\bTABLE\s+OF\b/i,
        /\bCURSOR\b/i,
    ];

    let matchCount = 0;
    for (const pattern of codeIndicators) {
        if (pattern.test(text)) {
            matchCount += 1;
        }
    }

    return matchCount >= 2;
};

const hasSignificantMarkdownFormatting = (text) => {
    if (!text) {
        return false;
    }

    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
        return false;
    }

    let markdownLineCount = 0;

    for (const line of lines) {
        if (/^#{1,6}\s/.test(line)) {
            markdownLineCount += 2;
            continue;
        }

        if (/^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
            markdownLineCount += 2;
            continue;
        }

        if (/^>\s/.test(line)) {
            markdownLineCount += 2;
            continue;
        }

        if (/^```/.test(line)) {
            markdownLineCount += 2;
            continue;
        }

        if (/^\|.+\|/.test(line) && /^\|?[-:]+\|/.test(lines[lines.indexOf(line) + 1] || '')) {
            markdownLineCount += 3;
            continue;
        }

        if (/^[-]\s\[[ xX]\]\s/m.test(line)) {
            markdownLineCount += 2;
            continue;
        }
    }

    const totalLines = lines.length;
    const ratio = markdownLineCount / totalLines;

    return ratio >= 0.3;
};



const looksStructuredPlainText = (text) => {
    if (!text) {
        return false;
    }

    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
        return false;
    }

    const hasMultipleBlankLines = /\n{3,}/.test(text);

    const hasSignificantIndentation = lines.filter((line) => /^\s{4,}/.test(line)).length >= 2;

    const hasCodeLikeStructure = lines.filter((line) => {
        const trimmed = line.trim();
        return /^\w+\s*\(/.test(trimmed) || /;\s*$/.test(trimmed) || /^BEGIN\b/i.test(trimmed) || /^END\b/i.test(trimmed) || /^\/\s*$/.test(trimmed);
    }).length >= 2;

    return hasMultipleBlankLines || hasSignificantIndentation || hasCodeLikeStructure;
};

const looksLikeMarkdown = (text) => {
    if (!text) {
        return false;
    }

    const normalized = text.trim();

    if (!normalized) {
        return false;
    }

    if (looksLikeCode(normalized)) {
        return false;
    }

    if (hasSignificantMarkdownFormatting(normalized)) {
        return true;
    }

    return MARKDOWN_TABLE_SEPARATOR.test(normalized);
};

const NoteEditorShell = ({ note, onUpdateNote, onBack, theme, onToggleTheme, onStatusMessage, onImportNote }) => {
    const [pendingImport, setPendingImport] = React.useState(null);
    const [pasteMode, setPasteMode] = React.useState('auto');
    const pasteModeRef = React.useRef(pasteMode);

    React.useEffect(() => {
        pasteModeRef.current = pasteMode;
    }, [pasteMode]);

    const editor = useEditor({
        extensions: [
            Document,
            Paragraph,
            Text,
            History,
            Bold,
            Italic,
            Underline,
            Strike,
            TextStyle,
            FontFamily.configure({
                types: ['textStyle'],
            }),
            FontSize,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Color,
            Highlight.configure({ multicolor: true }),
            Code,
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
            Blockquote,
            Heading.configure({ levels: [1, 2, 3] }),
            HorizontalRule,
            BulletList,
            OrderedList,
            ListItem,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Table.configure({
                resizable: false,
                allowTableNodeSelection: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Gapcursor,
            ListKeymap,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            FileHandler.configure({
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
                onPaste: (currentEditor, files) => {
                    void insertImageFiles(currentEditor, files);
                },
                onDrop: (currentEditor, files, pos) => {
                    void insertImageFiles(currentEditor, files, pos);
                },
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
            Placeholder.configure({
                placeholder: 'Start typing...',
            }),
            Markdown.configure({
                html: true,
                transformCopiedText: false,
                transformPastedText: false,
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            if (note) {
                onUpdateNote(note.id, { content: editor.getHTML() });
            }
        },
        editorProps: {
            transformPastedHTML: (html) => normalizePastedHtml(html),
            transformPastedText: (text) => normalizePastedPlainText(text),
            handleDOMEvents: {
                copy: (view, event) => {
                    const content = getSelectedEditorClipboardContent({ state: view.state });

                    if (!content) {
                        return false;
                    }

                    return writeClipboardContentToEvent(event, content);
                },
                cut: (view, event) => {
                    const content = getSelectedEditorClipboardContent({ state: view.state });

                    if (!content || !writeClipboardContentToEvent(event, content)) {
                        return false;
                    }

                    view.dispatch(view.state.tr.deleteSelection());
                    return true;
                },
            },
            handlePaste: (view, event) => {
                const clipboardData = event.clipboardData;

                if (!clipboardData) {
                    return false;
                }

                const files = Array.from(clipboardData.files || []);
                if (files.some((file) => file.type.startsWith('image/'))) {
                    return false;
                }

                const text = clipboardData.getData('text/plain');
                const html = clipboardData.getData('text/html');
                const normalizedText = normalizePastedPlainText(text);

                if (!normalizedText) {
                    return false;
                }

                const { from, to } = view.state.selection;
                const currentPasteMode = pasteModeRef.current;

                if (currentPasteMode === 'html') {
                    event.preventDefault();
                    const preHtml = `<pre>${escapeHtml(normalizedText)}</pre>`;
                    return insertHtmlDirectly(view, preHtml, from, to);
                }

                if (currentPasteMode === 'markdown') {
                    event.preventDefault();
                    const parsedJson = editor.storage.markdown.parser.parse(normalizedText);
                    const { from, to } = view.state.selection;
                    editor.chain().focus().deleteRange({ from, to }).insertContent(parsedJson).run();
                    return true;
                }

                if (looksLikeCode(normalizedText)) {
                    event.preventDefault();
                    const preHtml = `<pre>${escapeHtml(normalizedText)}</pre>`;
                    return insertHtmlDirectly(view, preHtml, from, to);
                }

                if (looksLikeMarkdown(normalizedText) && !(html && MEANINGFUL_PASTE_HTML.test(html))) {
                    event.preventDefault();
                    const parsedJson = editor.storage.markdown.parser.parse(normalizedText);
                    const { from, to } = view.state.selection;
                    editor.chain().focus().deleteRange({ from, to }).insertContent(parsedJson).run();
                    return true;
                }

                if (isTabularText(normalizedText) && !html) {
                    event.preventDefault();

                    return insertHtmlDirectly(view, tabularTextToHtml(normalizedText), from, to);
                }

                if (looksStructuredPlainText(normalizedText)) {
                    event.preventDefault();

                    const preHtml = `<pre>${escapeHtml(normalizedText)}</pre>`;
                    return insertHtmlDirectly(view, preHtml, from, to);
                }

                return false;
            },
        },
        onCreate: ({ editor }) => {
            const savedFont = localStorage.getItem('editor-default-font');
            const savedFontSize = localStorage.getItem('editor-default-font-size');

            if (savedFont) {
                editor.commands.setFontFamily(savedFont);
            }
            if (savedFontSize) {
                editor.chain().setMark('textStyle', { fontSize: `${savedFontSize}pt` }).run();
            }

            if (note?.content) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = note.content;
                const parser = DOMParser.fromSchema(editor.schema);
                const doc = parser.parse(tempDiv);
                const tr = editor.state.tr.replaceWith(0, 0, doc.content);
                editor.view.dispatch(tr);
            }
        },
    }, [note?.id]); // Re-initialize or sync when note ID changes

    if (!note) return null;

    const showImportStatus = (fileName, notice) => {
        if (notice) {
            onStatusMessage?.(notice, 'warning');
            return;
        }

        onStatusMessage?.(`Imported ${fileName}.`, 'success');
    };

    const handleOpenFile = async (file) => {
        if (!file) {
            return;
        }

        try {
            const imported = await readImportedNoteFile(file);
            const content = imported.format === 'markdown'
                ? imported.content
                : plainTextToHtml(imported.content);

            setPendingImport({
                content,
                fileName: file.name,
                imported,
            });
        } catch (error) {
            console.error(error);
            onStatusMessage?.(error?.message || `Could not import ${file.name}.`, 'error');
        }
    };

    const handleReplaceCurrentNote = () => {
        if (!editor || !pendingImport) {
            return;
        }

        editor.commands.setContent(pendingImport.content);

        if (pendingImport.imported.title && pendingImport.imported.title !== note.title) {
            onUpdateNote(note.id, { title: pendingImport.imported.title });
        }

        showImportStatus(pendingImport.fileName, pendingImport.imported.notice);
        setPendingImport(null);
    };

    const handleImportAsNewNote = () => {
        if (!pendingImport) {
            return;
        }

        onImportNote?.({
            title: pendingImport.imported.title,
            content: pendingImport.content,
            sourceName: pendingImport.fileName,
            notice: pendingImport.imported.notice,
        });
        setPendingImport(null);
    };

    return (
        <div className="note-editor-root" data-theme={theme}>
            <div className="editor-shell-container">
                <EditorRibbon
                    editor={editor}
                    noteTitle={note.title}
                    onToggleTheme={onToggleTheme}
                    theme={theme}
                    onBack={onBack}
                    onOpenFile={handleOpenFile}
                    pasteMode={pasteMode}
                    onPasteModeChange={setPasteMode}
                />
                <EditorWorkspace
                    editor={editor}
                    noteTitle={note.title}
                    onRenameTitle={(title) => onUpdateNote(note.id, { title })}
                    onStatusMessage={onStatusMessage}
                />
            </div>
            <ImportNoteDialog
                open={Boolean(pendingImport)}
                fileName={pendingImport?.fileName}
                currentNoteTitle={note.title}
                importNotice={pendingImport?.imported?.notice}
                onReplaceCurrent={handleReplaceCurrentNote}
                onImportAsNew={handleImportAsNewNote}
                onCancel={() => setPendingImport(null)}
            />

            <style>{`
                .note-editor-root {
                    height: 100%;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    background-color: var(--editor-ribbon-bg);
                    color: var(--editor-text-color);
                    /* Reset transition for instant inversion */
                }

                .editor-shell-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                /* Fixed positioned elements need to be within the themed container if they use variables */
            `}</style>
        </div>
    );
};

export default NoteEditorShell;
