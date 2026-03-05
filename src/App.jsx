import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import Sidebar from './components/Sidebar';
import MainGrid from './components/MainGrid';
import NoteEditorShell from './components/editor/NoteEditorShell';
import {
    STORAGE_KEY,
    createExportBundle,
    downloadJson,
    parseImportedJsonText,
    parseLegacyLocalStorage,
} from './lib/importExport';

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function App() {
    const data = useQuery('notes:getAll');
    const ensureBootstrapData = useMutation('notes:ensureBootstrapData');
    const upsertFolder = useMutation('notes:upsertFolder');
    const deleteFolderRecursive = useMutation('notes:deleteFolderRecursive');
    const upsertNote = useMutation('notes:upsertNote');
    const deleteNote = useMutation('notes:deleteNote');
    const replaceAll = useMutation('notes:replaceAll');

    const folders = data?.folders ?? [];
    const notes = data?.notes ?? [];

    const [selectedFolderId, setSelectedFolderId] = useState('folder-1');
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [renamingId, setRenamingId] = useState(null);
    const [dataStatus, setDataStatus] = useState('');

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'light';
    });

    const bootstrappedRef = useRef(false);
    const pendingContentSavesRef = useRef(new Map());

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (bootstrappedRef.current || data === undefined) {
            return;
        }

        if (folders.length === 0) {
            bootstrappedRef.current = true;
            ensureBootstrapData().catch((error) => {
                bootstrappedRef.current = false;
                console.error(error);
                setDataStatus('Could not bootstrap notes. Check your Convex setup.');
            });
            return;
        }

        bootstrappedRef.current = true;
    }, [data, folders.length, ensureBootstrapData]);

    useEffect(() => {
        if (folders.length === 0) {
            if (selectedFolderId !== null) {
                setSelectedFolderId(null);
            }
            return;
        }

        if (selectedFolderId === null) {
            return;
        }

        const selectedFolderStillExists = folders.some((folder) => folder.id === selectedFolderId);
        if (selectedFolderStillExists) {
            return;
        }

        const homeFolder = folders.find((folder) => folder.id === 'folder-1');
        const firstRootFolder = folders.find((folder) => folder.parentId === null);
        const fallbackFolder = homeFolder || firstRootFolder || folders[0];

        setSelectedFolderId(fallbackFolder?.id ?? null);
    }, [folders, selectedFolderId]);

    useEffect(() => {
        if (!activeNoteId) {
            return;
        }

        const activeStillExists = notes.some((note) => note.id === activeNoteId);
        if (!activeStillExists) {
            setActiveNoteId(null);
        }
    }, [activeNoteId, notes]);

    useEffect(() => {
        return () => {
            for (const timeoutId of pendingContentSavesRef.current.values()) {
                window.clearTimeout(timeoutId);
            }
            pendingContentSavesRef.current.clear();
        };
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const currentFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null;
    const currentNotes = notes.filter((note) => note.folderId === selectedFolderId);
    const currentSubFolders = folders.filter((folder) => folder.parentId === selectedFolderId);
    const activeNote = notes.find((note) => note.id === activeNoteId) ?? null;

    const persistNote = async (note) => {
        await upsertNote({ note });
    };

    const handleAddFolder = (name, parentId) => {
        const id = createId('folder');
        void upsertFolder({
            folder: {
                id,
                name,
                parentId: parentId ?? null,
            },
        });
        setRenamingId(id);
        return id;
    };

    const handleAddNote = (title, folderId, isTemplate = false, content = '') => {
        if (!folderId) {
            setDataStatus('Select a folder before creating a note.');
            return null;
        }

        const id = createId('note');
        void persistNote({
            id,
            title,
            folderId,
            content,
            isTemplate,
        });
        setRenamingId(id);
        return id;
    };

    const handleRename = (id, newName) => {
        const folder = folders.find((item) => item.id === id);
        const note = notes.find((item) => item.id === id);

        if (folder) {
            void upsertFolder({
                folder: {
                    id: folder.id,
                    name: newName,
                    parentId: folder.parentId,
                },
            });
        }

        if (note) {
            void persistNote({
                ...note,
                title: newName,
            });
        }

        setRenamingId(null);
    };

    const handleDelete = (id) => {
        const folder = folders.find((item) => item.id === id);
        const note = notes.find((item) => item.id === id);

        if (folder) {
            void deleteFolderRecursive({ folderId: folder.id }).then(() => {
                if (selectedFolderId === folder.id) {
                    setSelectedFolderId(null);
                }
            });
        }

        if (note) {
            void deleteNote({ noteId: note.id }).then(() => {
                if (activeNoteId === note.id) {
                    setActiveNoteId(null);
                }
            });
        }
    };

    const handleToggleTemplate = (id) => {
        const note = notes.find((n) => n.id === id);
        if (!note) {
            return;
        }

        void persistNote({
            ...note,
            isTemplate: !note.isTemplate,
        });
    };

    const handleUpdateNote = (id, updates) => {
        const existing = notes.find((note) => note.id === id);
        if (!existing) {
            return;
        }

        const merged = { ...existing, ...updates };
        const hasOnlyContentUpdate =
            Object.keys(updates).length === 1 && Object.prototype.hasOwnProperty.call(updates, 'content');

        if (hasOnlyContentUpdate) {
            const currentTimeout = pendingContentSavesRef.current.get(id);
            if (currentTimeout) {
                window.clearTimeout(currentTimeout);
            }

            const timeoutId = window.setTimeout(() => {
                void persistNote(merged);
                pendingContentSavesRef.current.delete(id);
            }, 300);

            pendingContentSavesRef.current.set(id, timeoutId);
            return;
        }

        void persistNote(merged);
    };

    const handleExportData = () => {
        const bundle = createExportBundle({ folders, notes });
        const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        downloadJson(`h-note-export-${stamp}.json`, bundle);
        setDataStatus('Exported notes to JSON file.');
    };

    const handleImportBundle = async (bundle) => {
        await replaceAll({
            folders: bundle.folders,
            notes: bundle.notes,
        });
        setSelectedFolderId(null);
        setActiveNoteId(null);
        setRenamingId(null);
    };

    const handleImportDataFile = async (file) => {
        try {
            const text = await file.text();
            const bundle = parseImportedJsonText(text);
            await handleImportBundle(bundle);
            setDataStatus(`Imported ${bundle.notes.length} notes from ${file.name}.`);
        } catch (error) {
            console.error(error);
            setDataStatus('Import failed. Check that your JSON has folders[] and notes[].');
        }
    };

    const handleImportFromLocalStorage = async () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                setDataStatus('No localStorage backup found for h-note-storage.');
                return;
            }
            const bundle = parseLegacyLocalStorage(raw);
            await handleImportBundle(bundle);
            setDataStatus(`Migrated ${bundle.notes.length} notes from localStorage.`);
        } catch (error) {
            console.error(error);
            setDataStatus('localStorage migration failed.');
        }
    };

    if (data === undefined) {
        return <div className="app-container" />;
    }

    return (
        <div className="app-container">
            {!activeNote && (
                <Sidebar
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={(id) => {
                        setSelectedFolderId(id);
                        setActiveNoteId(null);
                    }}
                    onAddFolder={handleAddFolder}
                    renamingId={renamingId}
                    setRenamingId={setRenamingId}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onExportData={handleExportData}
                    onImportDataFile={handleImportDataFile}
                    onImportFromLocalStorage={handleImportFromLocalStorage}
                    dataStatus={dataStatus}
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
                    allNotes={notes}
                    onAddFolder={(name) => handleAddFolder(name, selectedFolderId)}
                    onAddNote={(title, isTemplate, content) =>
                        handleAddNote(title, selectedFolderId, isTemplate, content)
                    }
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
