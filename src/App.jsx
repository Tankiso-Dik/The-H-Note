import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainGrid from './components/MainGrid';
import NoteEditorShell from './components/editor/NoteEditorShell';
import useNotesStore from './store/useNotesStore';

function App() {
    const {
        folders,
        notes,
        activeNoteId,
        setActiveNoteId,
        addFolder,
        addNote,
        updateFolder,
        updateNote,
        deleteFolder,
        deleteNote
    } = useNotesStore();

    const [selectedFolderId, setSelectedFolderId] = useState('folder-1');

    // Renaming state
    const [renamingId, setRenamingId] = useState(null);

    // Theme state
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'light';
    });

    React.useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const currentFolder = folders.find(f => f.id === selectedFolderId);
    const currentNotes = notes.filter(n => n.folderId === selectedFolderId);
    const currentSubFolders = folders.filter(f => f.parentId === selectedFolderId);
    const activeNote = notes.find(n => n.id === activeNoteId);

    const handleAddFolder = (name, parentId) => {
        const id = addFolder(name, parentId);
        setRenamingId(id);
        return id;
    };

    const handleAddNote = (title, folderId, isTemplate = false) => {
        const id = addNote(title, folderId, isTemplate);
        setRenamingId(id);
        return id;
    };

    const handleRename = (id, newName) => {
        updateFolder(id, { name: newName });
        updateNote(id, { title: newName });
        setRenamingId(null);
    };

    const handleDelete = (id) => {
        deleteFolder(id);
        deleteNote(id);
    };

    const handleToggleTemplate = (id) => {
        const note = notes.find(n => n.id === id);
        if (note) updateNote(id, { isTemplate: !note.isTemplate });
    };

    const handleUpdateNote = (id, updates) => {
        updateNote(id, updates);
    };

    return (
        <div className="app-container">
            {!activeNote && (
                <Sidebar
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={(id) => {
                        setSelectedFolderId(id);
                        setActiveNoteId(null); // Close editor when switching folders
                    }}
                    onAddFolder={handleAddFolder}
                    renamingId={renamingId}
                    setRenamingId={setRenamingId}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />
            )}
            {activeNote ? (
                <NoteEditorShell
                    note={activeNote}
                    onUpdateNote={handleUpdateNote}
                    onBack={() => setActiveNoteId(null)}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />
            ) : (
                <MainGrid
                    currentFolder={currentFolder}
                    allFolders={folders}
                    subFolders={currentSubFolders}
                    notes={currentNotes}
                    onAddFolder={(name) => handleAddFolder(name, selectedFolderId)}
                    onAddNote={(title, isTemplate) => handleAddNote(title, selectedFolderId, isTemplate)}
                    onNavigate={setSelectedFolderId}
                    onOpenNote={setActiveNoteId}
                    renamingId={renamingId}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onToggleTemplate={handleToggleTemplate}
                    setRenamingId={setRenamingId}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />
            )}
        </div>
    );
}

export default App;
