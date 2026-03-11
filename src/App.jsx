import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import Sidebar from './components/Sidebar';
import MainGrid from './components/MainGrid';
import ConfirmDialog from './components/ConfirmDialog';
import StatusToast from './components/StatusToast';
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

const createStatusNotice = (message, tone = 'info') => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    tone,
});

const collectDescendantFolderIds = (folders, folderId) => {
    const ids = new Set([folderId]);
    const queue = [folderId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        const children = folders.filter((folder) => folder.parentId === currentId);

        children.forEach((child) => {
            if (ids.has(child.id)) {
                return;
            }

            ids.add(child.id);
            queue.push(child.id);
        });
    }

    return ids;
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
    const [statusNotice, setStatusNotice] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [isSlowLoad, setIsSlowLoad] = useState(false);
    const [pendingFolders, setPendingFolders] = useState([]);
    const [pendingNotes, setPendingNotes] = useState([]);
    const [noteOverrides, setNoteOverrides] = useState({});

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'light';
    });

    const bootstrappedRef = useRef(false);
    const pendingContentSavesRef = useRef(new Map());
    const noteSnapshotRef = useRef(new Map());

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
                setStatusNotice(createStatusNotice('Could not bootstrap notes. Check your Convex setup.', 'error'));
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
        if (!statusNotice?.id) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setStatusNotice((current) => (current?.id === statusNotice.id ? null : current));
        }, 4200);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [statusNotice]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const showStatus = (message, tone = 'info') => {
        setStatusNotice(createStatusNotice(message, tone));
    };

    const restoreNoteOverride = (noteId, override) => {
        setNoteOverrides((prev) => {
            if (override === undefined) {
                if (!(noteId in prev)) {
                    return prev;
                }

                const next = { ...prev };
                delete next[noteId];
                return next;
            }

            return {
                ...prev,
                [noteId]: override,
            };
        });
    };

    const mergeNoteOverride = (noteId, patch) => {
        setNoteOverrides((prev) => ({
            ...prev,
            [noteId]: {
                ...(prev[noteId] || {}),
                ...patch,
            },
        }));
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

    const cancelPendingSave = (noteId) => {
        const timeoutId = pendingContentSavesRef.current.get(noteId);
        if (!timeoutId) {
            return;
        }

        window.clearTimeout(timeoutId);
        pendingContentSavesRef.current.delete(noteId);
    };

    const cancelPendingSaves = (noteIds = null) => {
        if (!Array.isArray(noteIds)) {
            for (const timeoutId of pendingContentSavesRef.current.values()) {
                window.clearTimeout(timeoutId);
            }
            pendingContentSavesRef.current.clear();
            return;
        }

        noteIds.forEach((noteId) => {
            cancelPendingSave(noteId);
        });
    };

    const discardNoteTransientState = (noteIds = null) => {
        const targetIds = Array.isArray(noteIds) ? [...new Set(noteIds)] : null;

        cancelPendingSaves(targetIds);

        if (!targetIds) {
            setPendingNotes([]);
            setLocalDrafts({});
            setNoteOverrides({});
            setActiveNoteId(null);
            return;
        }

        const targetIdSet = new Set(targetIds);
        setPendingNotes((prev) => prev.filter((note) => !targetIdSet.has(note.id)));
        setLocalDrafts((prev) => {
            let changed = false;
            const next = { ...prev };

            targetIdSet.forEach((noteId) => {
                if (noteId in next) {
                    delete next[noteId];
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
        setNoteOverrides((prev) => {
            let changed = false;
            const next = { ...prev };

            targetIdSet.forEach((noteId) => {
                if (noteId in next) {
                    delete next[noteId];
                    changed = true;
                }
            });

            return changed ? next : prev;
        });

        if (activeNoteId && targetIdSet.has(activeNoteId)) {
            setActiveNoteId(null);
        }
    };

    const rollbackPendingFolderCreation = (folderId, parentId = null) => {
        setPendingFolders((prev) => prev.filter((folder) => folder.id !== folderId));
        setSelectedFolderId((current) => (current === folderId ? parentId : current));
        setRenamingId((current) => (current === folderId ? null : current));
    };

    const rollbackPendingNoteCreation = (noteId) => {
        cancelPendingSave(noteId);
        clearDraft(noteId);
        restoreNoteOverride(noteId, undefined);
        setPendingNotes((prev) => prev.filter((note) => note.id !== noteId));
        setActiveNoteId((current) => (current === noteId ? null : current));
    };

    const persistFolder = async (folder, options = {}) => {
        const { errorMessage, onError, onSuccess } = options;

        try {
            await upsertFolder({ folder });
            onSuccess?.();
            return true;
        } catch (error) {
            console.error(error);
            if (errorMessage) {
                showStatus(errorMessage, 'error');
            }
            onError?.(error);
            return false;
        }
    };

    const persistNote = async (note, options = {}) => {
        const { errorMessage, onError, onSuccess } = options;

        try {
            await upsertNote({ note });
            onSuccess?.();
            return true;
        } catch (error) {
            console.error(error);
            if (errorMessage) {
                showStatus(errorMessage, 'error');
            }
            onError?.(error);
            return false;
        }
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

    const allNotesForDisplay = useMemo(() => {
        const mergedPersistedNotes = notes.map((note) => (
            noteOverrides[note.id] ? { ...note, ...noteOverrides[note.id] } : note
        ));
        const persistedNoteIds = new Set(mergedPersistedNotes.map((note) => note.id));
        const optimisticNotes = pendingNotes.filter((note) => !persistedNoteIds.has(note.id));
        return [...mergedPersistedNotes, ...optimisticNotes];
    }, [notes, pendingNotes, noteOverrides]);

    useEffect(() => {
        const pendingNoteIds = new Set(pendingNotes.map((note) => note.id));

        setNoteOverrides((prev) => {
            const persistedById = new Map(notes.map((note) => [note.id, note]));
            let changed = false;
            const next = { ...prev };

            Object.entries(prev).forEach(([noteId, override]) => {
                const persisted = persistedById.get(noteId);
                if (!persisted) {
                    if (!pendingNoteIds.has(noteId)) {
                        delete next[noteId];
                        changed = true;
                    }
                    return;
                }

                const isApplied = Object.entries(override).every(([key, value]) => persisted[key] === value);
                if (isApplied) {
                    delete next[noteId];
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [notes, pendingNotes]);

    useEffect(() => {
        noteSnapshotRef.current = new Map(
            allNotesForDisplay.map((note) => [
                note.id,
                typeof localDrafts[note.id] === 'string'
                    ? { ...note, content: localDrafts[note.id] }
                    : note,
            ])
        );
    }, [allNotesForDisplay, localDrafts]);

    const currentFolder = allFolders.find((folder) => folder.id === selectedFolderId) ?? null;
    const currentNotes = allNotesForDisplay.filter((note) => note.folderId === selectedFolderId);
    const currentSubFolders = allFolders.filter((folder) => folder.parentId === selectedFolderId);

    const activeNoteBase = allNotesForDisplay.find((note) => note.id === activeNoteId) ?? null;
    const activeDraft = activeNoteId ? localDrafts[activeNoteId] : undefined;
    const activeNote =
        activeNoteBase && typeof activeDraft === 'string'
            ? { ...activeNoteBase, content: activeDraft }
            : activeNoteBase;

    const getLatestNoteSnapshot = (noteId) => {
        const cached = noteSnapshotRef.current.get(noteId);
        if (cached) {
            return cached;
        }

        const current = allNotesForDisplay.find((note) => note.id === noteId);
        if (!current) {
            return null;
        }

        return typeof localDrafts[noteId] === 'string'
            ? { ...current, content: localDrafts[noteId] }
            : current;
    };

    const handleAddFolder = (name, parentId, options = {}) => {
        const { navigateToFolder = true } = options;
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
        if (navigateToFolder) {
            setSelectedFolderId(id);
        } else {
            setSelectedFolderId(siblingParentId);
        }
        setActiveNoteId(null);
        setRenamingId(id);
        return id;
    };

    const handleAddNote = (title, folderId, isTemplate = false, content = '') => {
        if (!folderId) {
            showStatus('Select a folder before creating a note.', 'warning');
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
        void persistNote(note, {
            errorMessage: `Could not create note "${title}".`,
            onError: () => rollbackPendingNoteCreation(id),
        });
        return id;
    };

    const applyNoteUpdates = (id, updates) => {
        const existing = getLatestNoteSnapshot(id);
        if (!existing) {
            return;
        }

        const hasOnlyContentUpdate =
            Object.keys(updates).length === 1 && Object.prototype.hasOwnProperty.call(updates, 'content');

        if (hasOnlyContentUpdate) {
            queueDeferredContentSave(id, updates.content);
            return;
        }

        const merged = {
            ...existing,
            ...updates,
        };

        const isPending = pendingNotes.some((note) => note.id === id);

        if (isPending) {
            setPendingNotes((prev) => prev.map((note) => (
                note.id === id ? merged : note
            )));

            void persistNote(merged, {
                errorMessage: `Could not update note "${merged.title}".`,
                onError: () => {
                    setPendingNotes((prev) => prev.map((note) => (
                        note.id === id ? existing : note
                    )));
                },
            });
            return;
        }

        mergeNoteOverride(id, {
            title: merged.title,
            folderId: merged.folderId,
            isTemplate: merged.isTemplate,
        });

        void persistNote(merged, {
            errorMessage: `Could not update note "${merged.title}".`,
        });
    };

    const handleRename = (id, newName) => {
        const pendingFolder = pendingFolders.find((item) => item.id === id);
        const folder = folders.find((item) => item.id === id);
        const pendingNote = pendingNotes.find((item) => item.id === id);
        const note = notes.find((item) => item.id === id);

        if (pendingFolder) {
            const updatedFolder = {
                id: pendingFolder.id,
                name: newName,
                parentId: pendingFolder.parentId,
                sortOrder: pendingFolder.sortOrder,
            };

            setPendingFolders((prev) => prev.map((item) => (
                item.id === id ? { ...item, name: newName } : item
            )));

            void persistFolder(updatedFolder, {
                errorMessage: `Could not save folder "${newName}".`,
                onError: () => rollbackPendingFolderCreation(id, pendingFolder.parentId),
            });
        }

        if (folder) {
            void persistFolder({
                id: folder.id,
                name: newName,
                parentId: folder.parentId,
                sortOrder: folder.sortOrder,
            }, {
                errorMessage: `Could not rename folder "${folder.name}".`,
            });
        }

        if (pendingNote || note) {
            applyNoteUpdates(id, { title: newName });
        }

        setRenamingId(null);
    };

    const performDelete = (id) => {
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
            const relatedFolderIds = collectDescendantFolderIds(allFolders, folder.id);
            const relatedNoteIds = allNotesForDisplay
                .filter((item) => relatedFolderIds.has(item.folderId))
                .map((item) => item.id);

            discardNoteTransientState(relatedNoteIds);

            void deleteFolderRecursive({ folderId: folder.id })
                .then(() => {
                    if (selectedFolderId === folder.id) {
                        setSelectedFolderId(null);
                    }
                    showStatus(`Deleted folder "${folder.name}".`, 'success');
                })
                .catch((error) => {
                    console.error(error);
                    showStatus(`Could not delete folder "${folder.name}".`, 'error');
                });
        }

        if (note) {
            void deleteNote({ noteId: note.id })
                .then(() => {
                    if (activeNoteId === note.id) {
                        setActiveNoteId(null);
                    }
                    clearDraft(note.id);
                    showStatus(`Deleted note "${note.title}".`, 'success');
                })
                .catch((error) => {
                    console.error(error);
                    showStatus(`Could not delete note "${note.title}".`, 'error');
                });
        }

        if (pendingNote) {
            setPendingNotes((prev) => prev.filter((item) => item.id !== id));
            if (activeNoteId === pendingNote.id) {
                setActiveNoteId(null);
            }
            clearDraft(pendingNote.id);
            showStatus(`Deleted note "${pendingNote.title}".`, 'success');
        }
    };

    const handleDeleteRequest = (id) => {
        const folder = [...pendingFolders, ...folders].find((item) => item.id === id);
        const note = [...pendingNotes, ...notes].find((item) => item.id === id);

        if (folder) {
            const relatedFolderIds = collectDescendantFolderIds(allFolders, folder.id);
            const nestedFolderCount = Math.max(0, relatedFolderIds.size - 1);
            const noteCount = allNotesForDisplay.filter((item) => relatedFolderIds.has(item.folderId)).length;
            const details = [];

            if (nestedFolderCount > 0) {
                details.push(`${nestedFolderCount} nested folder${nestedFolderCount === 1 ? '' : 's'}`);
            }
            if (noteCount > 0) {
                details.push(`${noteCount} note${noteCount === 1 ? '' : 's'}`);
            }

            setDeleteConfirmation({
                id,
                title: `Delete "${folder.name}"?`,
                message: details.length > 0
                    ? 'This removes the folder and everything inside it.'
                    : 'This folder will be removed immediately.',
                details: details.length > 0 ? `Also removes ${details.join(' and ')}.` : '',
                confirmLabel: 'Delete folder',
            });
            return;
        }

        if (note) {
            setDeleteConfirmation({
                id,
                title: `Delete "${note.title}"?`,
                message: 'This note will be removed immediately.',
                details: 'There is no undo for this action yet.',
                confirmLabel: 'Delete note',
            });
            return;
        }

        performDelete(id);
    };

    const handleCancelRename = (id) => {
        const pendingFolder = pendingFolders.find((item) => item.id === id);

        if (pendingFolder) {
            void persistFolder({
                id: pendingFolder.id,
                name: pendingFolder.name,
                parentId: pendingFolder.parentId,
                sortOrder: pendingFolder.sortOrder,
            }, {
                errorMessage: `Could not create folder "${pendingFolder.name}".`,
                onError: () => rollbackPendingFolderCreation(id, pendingFolder.parentId),
            });
        }

        setRenamingId(null);
    };

    const handleToggleTemplate = (id) => {
        const note = allNotesForDisplay.find((item) => item.id === id);
        if (!note) {
            return;
        }

        applyNoteUpdates(id, { isTemplate: !note.isTemplate });
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
            const latestNote = getLatestNoteSnapshot(id);
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
                .then((didPersist) => {
                    if (!didPersist) {
                        showStatus('Sync issue: draft kept locally, retrying on next change.', 'warning');
                        return;
                    }

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
                    showStatus('Sync issue: draft kept locally, retrying on next change.', 'warning');
                })
                .finally(() => {
                    pendingContentSavesRef.current.delete(id);
                });
        }, DRAFT_SYNC_DELAY_MS);

        pendingContentSavesRef.current.set(id, timeoutId);
    };

    const handleUpdateNote = (id, updates) => {
        applyNoteUpdates(id, updates);
    };

    const handleImportNote = ({ title, content, sourceName, notice }) => {
        if (!activeNote?.folderId) {
            showStatus('Select a folder before importing into a new note.', 'warning');
            return;
        }

        const nextTitle = title?.trim() || 'Imported Note';
        const createdId = handleAddNote(nextTitle, activeNote.folderId, false, content);

        if (!createdId) {
            return;
        }

        if (notice) {
            showStatus(notice, 'warning');
            return;
        }

        showStatus(`Imported ${sourceName} into "${nextTitle}".`, 'success');
    };

    const handleExportData = () => {
        const bundle = createExportBundle({ folders, notes });
        const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        downloadJson(`h-note-export-${stamp}.json`, bundle);
        showStatus('Exported notes to a JSON file.', 'success');
    };

    const handleImportBundle = async (bundle) => {
        discardNoteTransientState();
        await replaceAll({
            folders: bundle.folders,
            notes: bundle.notes,
        });

        setCachedBundle(bundle);
        localStorage.setItem(CACHE_KEY, JSON.stringify(bundle));
        setPendingFolders([]);
        setNoteOverrides({});
        localStorage.setItem(DRAFTS_KEY, JSON.stringify({}));

        setSelectedFolderId(null);
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
            showStatus('Could not save folder order. Refresh to resync.', 'error');
        }
    };

    const handleImportDataFile = async (file) => {
        try {
            const text = await file.text();
            const bundle = parseImportedJsonText(text);
            await handleImportBundle(bundle);
            showStatus(`Imported ${bundle.notes.length} notes from ${file.name}.`, 'success');
        } catch (error) {
            console.error(error);
            showStatus('Import failed. Check that your JSON has folders[] and notes[].', 'error');
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
        <div className={`app-container ${activeNote ? 'editor-mode' : 'browser-mode'}`}>
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
                    onDelete={handleDeleteRequest}
                    onReorderFolders={handleReorderFolders}
                    onExportData={handleExportData}
                    onImportDataFile={handleImportDataFile}
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
                        onStatusMessage={showStatus}
                        onImportNote={handleImportNote}
                    />
                </Suspense>
            ) : (
            <MainGrid
                currentFolder={currentFolder}
                allFolders={allFolders}
                subFolders={currentSubFolders}
                notes={currentNotes}
                allNotes={allNotesForDisplay}
                    onAddFolder={(name) => handleAddFolder(name, selectedFolderId, { navigateToFolder: false })}
                    onAddNote={(title, isTemplate, content) =>
                        handleAddNote(title, selectedFolderId, isTemplate, content)
                    }
                    onNavigate={setSelectedFolderId}
                    onOpenNote={setActiveNoteId}
                    renamingId={renamingId}
                    onRename={handleRename}
                    onDelete={handleDeleteRequest}
                    onToggleTemplate={handleToggleTemplate}
                    setRenamingId={setRenamingId}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />
            )}
            <ConfirmDialog
                open={Boolean(deleteConfirmation)}
                title={deleteConfirmation?.title}
                message={deleteConfirmation?.message}
                details={deleteConfirmation?.details}
                confirmLabel={deleteConfirmation?.confirmLabel}
                destructive
                onConfirm={() => {
                    if (deleteConfirmation?.id) {
                        performDelete(deleteConfirmation.id);
                    }
                    setDeleteConfirmation(null);
                }}
                onCancel={() => setDeleteConfirmation(null)}
            />
            <StatusToast notice={statusNotice} onDismiss={() => setStatusNotice(null)} />
        </div>
    );
}

export default App;
