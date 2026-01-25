import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import useNotesStore from '../store/useNotesStore';
import Toolbar from './Toolbar';

const Editor = () => {
    const {
        activeNoteId,
        notes,
        updateNote,
        setViewMode
    } = useNotesStore();

    const currentNote = notes.find(n => n.id === activeNoteId);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing...',
            }),
        ],
        content: currentNote ? currentNote.content : '',
        onUpdate: ({ editor }) => {
            if (activeNoteId) {
                updateNote(activeNoteId, { content: editor.getHTML() });
            }
        },
    });

    // Update editor content when activeNoteId changes or initial load
    useEffect(() => {
        if (editor && currentNote) {
            // Only update if content is different to avoid cursor jumps/loops
            // But since onUpdate updates store, store updates trigger this...
            // Standard problem. Primitive check:
            if (editor.getHTML() !== currentNote.content) {
                // This check is a bit naive if formatting varies, but good enough for now.
                // Actually, `setContent` moves cursor to start by default.
                // We should probably rely on `editor.commands.setContent(content, false)` (emitUpdate: false) probably?
                // But usually we just sync on mount/note switch.
                editor.commands.setContent(currentNote.content);
            }
        }
    }, [activeNoteId, editor]); // Removing currentNote from deps to avoid loop while typing?
    // Use `activeNoteId` to detect switch. `currentNote` in deps means every keystroke re-runs this if it updates content.
    // So better:
    useEffect(() => {
        if (editor && currentNote && editor.getHTML() !== currentNote.content) {
            // This can still be tricky if `currentNote.content` lags or is formatted diff.
            // Best practice: Store is source of truth.
            // When switching note:
            editor.commands.setContent(currentNote.content);
        }
    }, [activeNoteId]); // Only when note ID changes.

    if (!currentNote) {
        return (
            <div className="editor-empty-state">
                <p>Note not found.</p>
                <button onClick={() => setViewMode('grid')}>Back to Grid</button>
            </div>
        );
    }

    return (
        <div className="editor-container">
            <div className="editor-header">
                <button className="back-btn" onClick={() => setViewMode('grid')}>← Back</button>
                <input
                    className="editor-title"
                    value={currentNote.title}
                    onChange={(e) => updateNote(activeNoteId, { title: e.target.value })}
                    placeholder="Untitled Note"
                />
            </div>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} className="editor-content" />

            <style>{`
                .editor-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: var(--bg-main);
                }
                .editor-header {
                    display: flex;
                    align-items: center;
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border-color);
                }
                .back-btn {
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    margin-right: 16px;
                    color: var(--text-secondary);
                }
                .back-btn:hover {
                    color: var(--text-primary);
                }
                .editor-title {
                    font-size: 24px;
                    font-weight: bold;
                    border: none;
                    background: transparent;
                    outline: none;
                    width: 100%;
                }
                .editor-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }
                .ProseMirror {
                    outline: none;
                    min-height: 100%;
                    font-size: 16px;
                    line-height: 1.6;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .editor-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                }
            `}</style>
        </div>
    );
};

export default Editor;
