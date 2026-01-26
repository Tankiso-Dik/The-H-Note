import React, { useState } from 'react';
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
import { TableNavigation } from './TableNavigation';
import EditorRibbon from './EditorRibbon';

const lowlight = createLowlight(all);
import EditorWorkspace from './EditorWorkspace';
import { FontSize } from '../../extensions/FontSize';

const NoteEditorShell = ({ note, onUpdateNote, onBack }) => {
    const [theme, setTheme] = useState('light');

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

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
            Color,
            Highlight.configure({ multicolor: true }),
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
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
            Placeholder.configure({
                placeholder: 'Start typing...',
            }),
        ],
        content: note ? note.content : '',
        onUpdate: ({ editor }) => {
            if (note) {
                onUpdateNote(note.id, { content: editor.getHTML() });
            }
        },
    }, [note?.id]); // Re-initialize or sync when note ID changes

    if (!note) return null;

    return (
        <div className="note-editor-root" data-theme={theme}>
            <div className="editor-shell-container">
                <EditorRibbon
                    editor={editor}
                    onToggleTheme={toggleTheme}
                    theme={theme}
                    onBack={onBack}
                />
                <EditorWorkspace
                    editor={editor}
                    noteTitle={note.title}
                    onBack={onBack}
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
