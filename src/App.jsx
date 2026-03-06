import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import Sidebar from './components/Sidebar';
import MainGrid from './components/MainGrid';
import {
    createExportBundle,
    downloadJson,
    parseImportedJsonText,
} from './lib/importExport';
import { getNextFolderSortOrder, orderFoldersForDisplay, reorderSiblings } from './lib/folderOrder';

const LazyNoteEditorShell = lazy(() => import('./components/editor/NoteEditorShell'));

const CACHE_KEY = 'h-note-convex-cache-v1';
const DRAFTS_KEY = 'h-note-note-drafts-v1';
const DRAFT_SYNC_DELAY_MS = 1800;

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const safeParse = (raw, fallback) => {
    if (!raw) {
        return fallback;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const loadCachedBundle = () => {
    const parsed = safeParse(localStorage.getItem(CACHE_KEY), null);
    if (!parsed || !Array.isArray(parsed.folders) || !Array.isArray(parsed.notes)) {
        return null;
    }

    return parsed;
};

const loadDraftMap = () => {
    const parsed = safeParse(localStorage.getItem(DRAFTS_KEY), {});
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
    }

    return parsed;
};

function App() {
    const data = useQuery('notes:getAll');
    const ensureBootstrapData = useMutation('notes:ensureBootstrapData');
    const upsertFolder = useMutation('notes:upsertFolder');
    const reorderFolders = useMutation('notes:reorderFolders');
    const deleteFolderRecursive = useMutation('notes:deleteFolderRecursive');
    const upsertNote = useMutation('notes:upsertNote');
    const deleteNote = useMutation('notes:deleteNote');
    const replaceAll = useMutation('notes:replaceAll');

    const [cachedBundle, setCachedBundle] = useState(() => loadCachedBundle());
    const [localDrafts, setLocalDrafts] = useState(() => loadDraftMap());

    const effectiveData = data ?? cachedBundle;
    const folders = effectiveData?.folders ?? [];
    const notes = effectiveData?.notes ?? [];

    const [selectedFolderId, setSelectedFolderId] = useState('folder-1');
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [renamingId, setRenamingId] = useState(null);
    const [dataStatus, setDataStatus] = useState('');
    const [isSlowLoad, setIsSlowLoad] = useState(false);
    const [pendingFolders, setPendingFolders] = useState([]);
    const [pendingNotes, setPendingNotes] = useState([]);

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'light';
    });

    const bootstrappedRef = useRef(false);
    const pendingContentSavesRef = useRef(new Map());
    const notesRef = useRef(notes);

    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (data === undefined) {
            return;
        }

        setCachedBundle(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    }, [data]);

    useEffect(() => {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(localDrafts));
    }, [localDrafts]);

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

        const selectedFolderStillExists = [...folders, ...pendingFolders].some(
            (folder) => folder.id === selectedFolderId
        );
        if (selectedFolderStillExists) {
            return;
        }

        const homeFolder = folders.find((folder) => folder.id === 'folder-1');
        const firstRootFolder = folders.find((folder) => folder.parentId === null);
        const fallbackFolder = homeFolder || firstRootFolder || folders[0];

        if (fallbackFolder && selectedFolderId !== fallbackFolder.id) {
            setSelectedFolderId(fallbackFolder.id);
        }
    }, [folders, pendingFolders, selectedFolderId]);

    useEffect(() => {
        if (pendingFolders.length === 0) {
            return;
        }

        const persistedIds = new Set(folders.map((folder) => folder.id));
        setPendingFolders((prev) => prev.filter((folder) => !persistedIds.has(folder.id)));
    }, [folders, pendingFolders.length]);

    useEffect(() => {
        if (!activeNoteId) {
            return;
        }

        const activeStillExists = [...notes, ...pendingNotes].some((note) => note.id === activeNoteId);
        if (!activeStillExists) {
            setActiveNoteId(null);
        }
    }, [activeNoteId, notes, pendingNotes]);

    useEffect(() => {
        if (pendingNotes.length === 0) {
            return;
        }

        const persistedIds = new Set(notes.map((note) => note.id));
        setPendingNotes((prev) => prev.filter((note) => !persistedIds.has(note.id)));
    }, [notes, pendingNotes.length]);

    useEffect(() => {
        return () => {
            for (const timeoutId of pendingContentSavesRef.current.values()) {
                window.clearTimeout(timeoutId);
            }
            pendingContentSavesRef.current.clear();
        };
    }, []);

    useEffect(() => {
        if (data !== undefined) {
            setIsSlowLoad(false);
            return;
        }

        const timerId = window.setTimeout(() => {
            setIsSlowLoad(true);
        }, 2000);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [data]);

    useEffect(() => {
        if (!dataStatus) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setDataStatus((current) => (current === dataStatus ? '' : current));
        }, 4200);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [dataStatus]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const clearDraft = (noteId) => {
        setLocalDrafts((prev) => {
            if (!(noteId in prev)) {
                return prev;
            }

            const next = { ...prev };
            delete next[noteId];
            return next;
        });
    };

    const persistNote = async (note) => {
        await upsertNote({ note });
    };

    const allFolders = useMemo(() => {
        const persistedIds = new Set(folders.map((folder) => folder.id));
        const optimisticFolders = pendingFolders.filter((folder) => !persistedIds.has(folder.id));
        return orderFoldersForDisplay([...folders, ...optimisticFolders]);
    }, [folders, pendingFolders]);
    const pendingFolderCreations = pendingFolders.reduce((acc, folder) => {
        acc[folder.id] = true;
        return acc;
    }, {});

    const persistedNoteIds = new Set(notes.map((note) => note.id));
    const optimisticNotes = pendingNotes.filter((note) => !persistedNoteIds.has(note.id));
    const allNotesForDisplay = [...notes, ...optimisticNotes];

    const currentFolder = allFolders.find((folder) => folder.id === selectedFolderId) ?? null;
    const currentNotes = allNotesForDisplay.filter((note) => note.folderId === selectedFolderId);
    const currentSubFolders = allFolders.filter((folder) => folder.parentId === selectedFolderId);

    const activeNoteBase = allNotesForDisplay.find((note) => note.id === activeNoteId) ?? null;
    const activeDraft = activeNoteId ? localDrafts[activeNoteId] : undefined;
    const activeNote =
        activeNoteBase && typeof activeDraft === 'string'
            ? { ...activeNoteBase, content: activeDraft }
            : activeNoteBase;

    const handleAddFolder = (name, parentId) => {
        const id = createId('folder');
        const siblingParentId = parentId ?? null;
        setPendingFolders((prev) => [
            ...prev,
            {
                id,
                name,
                parentId: siblingParentId,
                sortOrder: getNextFolderSortOrder([...folders, ...prev], siblingParentId),
            },
        ]);
        setSelectedFolderId(id);
        setActiveNoteId(null);
        setRenamingId(id);
        return id;
    };

    const handleAddNote = (title, folderId, isTemplate = false, content = '') => {
        if (!folderId) {
            setDataStatus('Select a folder before creating a note.');
            return null;
        }

        const id = createId('note');
        const note = {
            id,
            title,
            folderId,
            content,
            isTemplate,
        };

        setPendingNotes((prev) => [...prev, note]);
        setSelectedFolderId(folderId);
        setActiveNoteId(id);
        setRenamingId(null);
        void persistNote({
            ...note,
        });
        return id;
    };

    const handleRename = (id, newName) => {
        const pendingFolder = pendingFolders.find((item) => item.id === id);
        const folder = folders.find((item) => item.id === id);
        const pendingNote = pendingNotes.find((item) => item.id === id);
        const note = notes.find((item) => item.id === id);

        if (pendingFolder) {
            void upsertFolder({
                folder: {
                    id: pendingFolder.id,
                    name: newName,
                    parentId: pendingFolder.parentId,
                    sortOrder: pendingFolder.sortOrder,
                },
            });
            setPendingFolders((prev) => prev.map((item) => (
                item.id === id ? { ...item, name: newName } : item
            )));
        }

        if (folder) {
            void upsertFolder({
                folder: {
                    id: folder.id,
                    name: newName,
                    parentId: folder.parentId,
                    sortOrder: folder.sortOrder,
                },
            });
        }

        if (pendingNote || note) {
            const sourceNote = pendingNote || note;
            const draftContent = localDrafts[sourceNote.id];
            void persistNote({
                ...sourceNote,
                content: typeof draftContent === 'string' ? draftContent : sourceNote.content,
                title: newName,
            });

            if (pendingNote) {
                setPendingNotes((prev) => prev.map((item) => (
                    item.id === id ? { ...item, title: newName } : item
                )));
            }
        }

        setRenamingId(null);
    };

    const handleDelete = (id) => {
        const pendingFolder = pendingFolders.find((item) => item.id === id);
        const folder = folders.find((item) => item.id === id);
        const pendingNote = pendingNotes.find((item) => item.id === id);
        const note = notes.find((item) => item.id === id);

        if (pendingFolder) {
            setPendingFolders((prev) => prev.filter((item) => item.id !== id));
            if (renamingId === id) {
                setRenamingId(null);
            }
            return;
        }

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
                clearDraft(note.id);
            });
        }

        if (pendingNote) {
            setPendingNotes((prev) => prev.filter((item) => item.id !== id));
            if (activeNoteId === pendingNote.id) {
                setActiveNoteId(null);
            }
            clearDraft(pendingNote.id);
        }
    };

    const handleCancelRename = (id) => {
        const pendingFolder = pendingFolders.find((item) => item.id === id);

        if (pendingFolder) {
            void upsertFolder({
                folder: {
                    id: pendingFolder.id,
                    name: pendingFolder.name,
                    parentId: pendingFolder.parentId,
                    sortOrder: pendingFolder.sortOrder,
                },
            });
        }

        setRenamingId(null);
    };

    const handleToggleTemplate = (id) => {
        const note = allNotesForDisplay.find((item) => item.id === id);
        if (!note) {
            return;
        }

        void persistNote({
            ...note,
            isTemplate: !note.isTemplate,
        });
    };

    const queueDeferredContentSave = (id, content) => {
        setLocalDrafts((prev) => ({
            ...prev,
            [id]: content,
        }));

        const currentTimeout = pendingContentSavesRef.current.get(id);
        if (currentTimeout) {
            window.clearTimeout(currentTimeout);
        }

        const timeoutId = window.setTimeout(() => {
            const latestNote = notesRef.current.find((note) => note.id === id);
            if (!latestNote) {
                clearDraft(id);
                pendingContentSavesRef.current.delete(id);
                return;
            }

            const payload = {
                ...latestNote,
                content,
            };

            void persistNote(payload)
                .then(() => {
                    setLocalDrafts((prev) => {
                        if (prev[id] !== content) {
                            return prev;
                        }

                        const next = { ...prev };
                        delete next[id];
                        return next;
                    });
                })
                .catch((error) => {
                    console.error(error);
                    setDataStatus('Sync issue: draft kept locally, retrying on next change.');
                })
                .finally(() => {
                    pendingContentSavesRef.current.delete(id);
                });
        }, DRAFT_SYNC_DELAY_MS);

        pendingContentSavesRef.current.set(id, timeoutId);
    };

    const handleUpdateNote = (id, updates) => {
        const existing = allNotesForDisplay.find((note) => note.id === id);
        if (!existing) {
            return;
        }

        const hasOnlyContentUpdate =
            Object.keys(updates).length === 1 && Object.prototype.hasOwnProperty.call(updates, 'content');

        if (hasOnlyContentUpdate) {
            queueDeferredContentSave(id, updates.content);
            return;
        }

        const draftContent = localDrafts[id];
        const merged = {
            ...existing,
            ...(typeof draftContent === 'string' ? { content: draftContent } : {}),
            ...updates,
        };

        const isPending = pendingNotes.some((note) => note.id === id);
        if (isPending) {
            setPendingNotes((prev) => prev.map((note) => (
                note.id === id ? merged : note
            )));
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

        setCachedBundle(bundle);
        localStorage.setItem(CACHE_KEY, JSON.stringify(bundle));
        setLocalDrafts({});
        setPendingFolders([]);
        localStorage.setItem(DRAFTS_KEY, JSON.stringify({}));

        setSelectedFolderId(null);
        setActiveNoteId(null);
        setRenamingId(null);
    };

    const handleReorderFolders = async (orderedFolderIds, parentId = null) => {
        const targetParentId = parentId ?? null;

        setPendingFolders((prev) => reorderSiblings(prev, targetParentId, orderedFolderIds));
        setCachedBundle((prev) => {
            if (!prev) {
                return prev;
            }

            return {
                ...prev,
                folders: reorderSiblings(prev.folders, targetParentId, orderedFolderIds),
            };
        });

        try {
            await reorderFolders({
                parentId: targetParentId,
                orderedFolderIds,
            });
        } catch (error) {
            console.error(error);
            setDataStatus('Could not save folder order. Refresh to resync.');
        }
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

    if (effectiveData === null) {
        return (
            <div
                className="app-container"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                <div>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Loading notes…</div>
                    <div style={{ opacity: 0.8 }}>
                        {isSlowLoad
                            ? 'Still connecting to Convex. Check VITE_CONVEX_URL and Convex deployment status.'
                            : 'Connecting to Convex…'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            {!activeNote && (
                <Sidebar
                    folders={allFolders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={(id) => {
                        setSelectedFolderId(id);
                        setActiveNoteId(null);
                    }}
                    onAddFolder={handleAddFolder}
                    renamingId={renamingId}
                    setRenamingId={setRenamingId}
                    onRename={handleRename}
                    onCancelRename={handleCancelRename}
                    pendingFolderCreations={pendingFolderCreations}
                    onDelete={handleDelete}
                    onReorderFolders={handleReorderFolders}
                    onExportData={handleExportData}
                    onImportDataFile={handleImportDataFile}
                    dataStatus={dataStatus}
                />
            )}
            {activeNote ? (
                <Suspense fallback={<div className="app-container" style={{ padding: 24 }}>Loading editor…</div>}>
                    <LazyNoteEditorShell
                        note={activeNote}
                        onUpdateNote={handleUpdateNote}
                        onBack={() => setActiveNoteId(null)}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                    />
                </Suspense>
            ) : (
            <MainGrid
                currentFolder={currentFolder}
                allFolders={allFolders}
                subFolders={currentSubFolders}
                notes={currentNotes}
                allNotes={allNotesForDisplay}
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
