import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainGrid from './components/MainGrid';
import { initialFolders, initialNotes } from './data/mockData';

function App() {
    const [selectedFolderId, setSelectedFolderId] = useState('folder-1'); // Default to first folder
    const [folders, setFolders] = useState(initialFolders);
    const [notes, setNotes] = useState(initialNotes);

    // Renaming state
    const [renamingId, setRenamingId] = useState(null);

    const currentFolder = folders.find(f => f.id === selectedFolderId);
    const currentNotes = notes.filter(n => n.folderId === selectedFolderId);
    const currentSubFolders = folders.filter(f => f.parentId === selectedFolderId);

    const handleAddFolder = (name, parentId) => {
        const newId = `folder-${Date.now()}`;
        const newFolder = {
            id: newId,
            name,
            parentId
        };
        setFolders([...folders, newFolder]);
        setRenamingId(newId); // Trigger rename mode immediately
        return newId;
    };

    const handleAddNote = (title, folderId, isTemplate = false) => {
        const newId = `note-${Date.now()}`;
        const newNote = {
            id: newId,
            title,
            folderId,
            content: '',
            isTemplate
        };
        setNotes([...notes, newNote]);
        setRenamingId(newId); // Trigger rename mode immediately
        return newId;
    };

    const handleRename = (id, newName) => {
        setFolders(folders.map(f => f.id === id ? { ...f, name: newName } : f));
        setNotes(notes.map(n => n.id === id ? { ...n, title: newName } : n));
        setRenamingId(null);
    };

    const handleDelete = (id) => {
        setFolders(folders.filter(f => f.id !== id));
        setNotes(notes.filter(n => n.id !== id));
    };

    const handleToggleTemplate = (id) => {
        setNotes(notes.map(n => n.id === id ? { ...n, isTemplate: !n.isTemplate } : n));
    };

    return (
        <div className="app-container">
            <Sidebar
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
                onAddFolder={handleAddFolder}
                renamingId={renamingId}
                setRenamingId={setRenamingId}
                onRename={handleRename}
                onDelete={handleDelete}
            />
            <MainGrid
                currentFolder={currentFolder}
                allFolders={folders}
                subFolders={currentSubFolders}
                notes={currentNotes}
                onAddFolder={(name) => handleAddFolder(name, selectedFolderId)}
                onAddNote={(title, isTemplate) => handleAddNote(title, selectedFolderId, isTemplate)}
                onNavigate={setSelectedFolderId}
                renamingId={renamingId}
                onRename={handleRename}
                onDelete={handleDelete}
                onToggleTemplate={handleToggleTemplate}
                setRenamingId={setRenamingId}
            />
        </div>
    );
}

export default App;
