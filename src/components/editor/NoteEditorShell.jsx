import React from 'react';
import { useEditor } from '@tiptap/react';
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
import { all, createLowlight } from 'lowlight';
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
import { TableNavigation } from './TableNavigation';
import EditorRibbon from './EditorRibbon';

const lowlight = createLowlight(all);
import EditorWorkspace from './EditorWorkspace';
import { FontSize } from '../../extensions/FontSize';
import { plainTextToHtml, readImportedNoteFile } from '../../lib/noteFileIO';

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read file.'));
    reader.readAsDataURL(file);
});

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

    return text
        .replace(/\r\n?/g, '\n')
        .replace(/\u00A0/g, ' ')
        .replace(/\u200B/g, '')
        .replace(ARTIFACT_MARKERS, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
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

const looksLikeMarkdown = (text) => {
    if (!text) {
        return false;
    }

    const normalized = text.trim();

    if (!normalized) {
        return false;
    }

    return MARKDOWN_PATTERNS.some((pattern) => pattern.test(normalized))
        || MARKDOWN_TABLE_SEPARATOR.test(normalized);
};

const looksStructuredPlainText = (text) => {
    if (!text) {
        return false;
    }

    return /\n{2,}/.test(text) || /\t/.test(text);
};

const NoteEditorShell = ({ note, onUpdateNote, onBack, theme, onToggleTheme }) => {
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
            TableNavigation,
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
        content: note ? note.content : '',
        onUpdate: ({ editor }) => {
            if (note) {
                onUpdateNote(note.id, { content: editor.getHTML() });
            }
        },
        editorProps: {
            transformPastedHTML: (html) => normalizePastedHtml(html),
            transformPastedText: (text) => normalizePastedPlainText(text),
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

                if (looksLikeMarkdown(normalizedText) && !(html && MEANINGFUL_PASTE_HTML.test(html))) {
                    event.preventDefault();
                    const parsedContent = editor.storage.markdown.parser.parse(normalizedText);

                    return editor
                        .chain()
                        .focus()
                        .deleteRange({ from, to })
                        .insertContent(parsedContent)
                        .run();
                }

                if (!html && isTabularText(normalizedText)) {
                    event.preventDefault();

                    return editor
                        .chain()
                        .focus()
                        .deleteRange({ from, to })
                        .insertContent(tabularTextToHtml(normalizedText))
                        .run();
                }

                if (!html && looksStructuredPlainText(normalizedText)) {
                    event.preventDefault();

                    return editor
                        .chain()
                        .focus()
                        .deleteRange({ from, to })
                        .insertContent(plainTextToHtml(normalizedText))
                        .run();
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
        },
    }, [note?.id]); // Re-initialize or sync when note ID changes

    if (!note) return null;

    const handleOpenFile = async (file) => {
        if (!editor || !file) {
            return;
        }

        const imported = await readImportedNoteFile(file);
        const content = imported.format === 'markdown'
            ? imported.content
            : plainTextToHtml(imported.content);

        editor.commands.setContent(content);

        if (imported.title && imported.title !== note.title) {
            onUpdateNote(note.id, { title: imported.title });
        }

        if (imported.notice) {
            window.alert(imported.notice);
        }
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
                />
                <EditorWorkspace
                    editor={editor}
                    noteTitle={note.title}
                    onRenameTitle={(title) => onUpdateNote(note.id, { title })}
                />
            </div>

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
