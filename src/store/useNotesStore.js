import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initialFolders, initialNotes } from '../data/mockData';

const useNotesStore = create(
    persist(
        (set) => ({
            folders: [],
            notes: [],
            activeFolderId: null,
            activeNoteId: null,
            viewMode: 'grid', // 'grid' | 'editor'

            // Setters
            setFolders: (folders) => set({ folders }),
            setNotes: (notes) => set({ notes }),
            setActiveFolderId: (id) => set({ activeFolderId: id, viewMode: 'grid', activeNoteId: null }),
            setActiveNoteId: (id) => set({ activeNoteId: id }),
            setViewMode: (mode) => set({ viewMode: mode }),

            // Folder Actions
            addFolder: (name, parentId) => {
                const newFolder = {
                    id: `folder-${Date.now()}`,
                    name,
                    parentId,
                };
                set((state) => ({ folders: [...state.folders, newFolder] }));
                return newFolder.id;
            },
            updateFolder: (id, updates) =>
                set((state) => ({
                    folders: state.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
                })),
            deleteFolder: (id) =>
                set((state) => ({
                    folders: state.folders.filter((f) => f.id !== id),
                    // Also delete notes in this folder? For now, let's keep it simple, or maybe orphan them?
                    // Requirement says "Delete", implying removal. Ideally we should also delete notes inside.
                    notes: state.notes.filter((n) => n.folderId !== id),
                })),

            // Note Actions
            addNote: (title, folderId, isTemplate = false) => {
                const newNote = {
                    id: `note-${Date.now()}`,
                    title,
                    folderId,
                    content: '',
                    isTemplate,
                };
                set((state) => ({ notes: [...state.notes, newNote] }));
                return newNote.id;
            },
            updateNote: (id, updates) =>
                set((state) => ({
                    notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
                })),
            deleteNote: (id) =>
                set((state) => ({
                    notes: state.notes.filter((n) => n.id !== id),
                    activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
                    viewMode: state.activeNoteId === id ? 'grid' : state.viewMode,
                })),
        }),
        {
            name: 'h-note-storage', // unique name
            onRehydrateStorage: () => (state) => {
                // If state is empty after rehydration (first load), check if we need to load mock data
                if (!state || state.folders.length === 0) {
                    // We can't set state directly here easily without using the set from the store, 
                    // but Zustand persist handles rehydration. 
                    // A better way is to check in the component or use a custom storage wrapper,
                    // or just use `partialize` to exclude initial state if needed. 
                    // However, the simplest "If localStorage is empty, load initial data" logic:
                    // The `persist` middleware loads from storage. If storage is null, it uses initial state defined in `create`.
                    // So we can just set the actual initial state to the mock data!
                    // Wait, the prompt says "If localStorage is empty, load initial data from src/data/mockData.js".
                    // If I set `folders: []` initially, and storage is empty, it stays empty.
                    // If I set `folders: initialFolders` initially, it uses that if storage is empty. 
                    // Perfect.
                }
            }
        }
    )
);

// Re-defining the store with initial data directly is the cleaner way to handle "fallback to mock data"
// because `persist` uses the default state if no storage is found.
// However, if the user deliberately deletes everything, we don't want to reload mock data on refresh.
// But the prompt says "If localStorage is empty...". "Empty" usually means "no key found".
// Just setting the default state to initialFolders works for the "fresh start" case.
// If user deletes all, storage has key with empty arrays. That is NOT empty storage.

const useNotesStoreFinal = create(
    persist(
        (set) => ({
            folders: initialFolders,
            notes: initialNotes,
            activeFolderId: 'folder-1', // Default selection
            activeNoteId: null,
            viewMode: 'grid',

            setFolders: (folders) => set({ folders }),
            setNotes: (notes) => set({ notes }),
            setActiveFolderId: (id) => set({ activeFolderId: id, viewMode: 'grid', activeNoteId: null }),
            setActiveNoteId: (id) => set({ activeNoteId: id }),
            setViewMode: (mode) => set({ viewMode: mode }),

            addFolder: (name, parentId) => {
                const newFolder = {
                    id: `folder-${Date.now()}`,
                    name,
                    parentId, // Component must pass null for root or valid ID
                };
                set((state) => ({ folders: [...state.folders, newFolder] }));
                return newFolder.id;
            },
            updateFolder: (id, updates) =>
                set((state) => ({
                    folders: state.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
                })),
            deleteFolder: (id) =>
                set((state) => {
                    const getIdsToDelete = (folderId, allFolders) => {
                        let ids = [folderId];
                        const children = allFolders.filter(f => f.parentId === folderId);
                        children.forEach(child => {
                            ids = [...ids, ...getIdsToDelete(child.id, allFolders)];
                        });
                        return ids;
                    };

                    const idsToDelete = getIdsToDelete(id, state.folders);

                    return {
                        folders: state.folders.filter(f => !idsToDelete.includes(f.id)),
                        notes: state.notes.filter(n => !idsToDelete.includes(n.folderId)),
                        activeFolderId: idsToDelete.includes(state.activeFolderId) ? null : state.activeFolderId
                    };
                }),

            addNote: (title, folderId, isTemplate = false) => {
                const newNote = {
                    id: `note-${Date.now()}`,
                    title,
                    folderId,
                    content: '',
                    isTemplate,
                };
                set((state) => ({ notes: [...state.notes, newNote] }));
                return newNote.id;
            },
            updateNote: (id, updates) =>
                set((state) => ({
                    notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
                })),
            deleteNote: (id) =>
                set((state) => ({
                    notes: state.notes.filter((n) => n.id !== id),
                    activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
                    viewMode: state.activeNoteId === id ? 'grid' : state.viewMode,
                })),
        }),
        {
            name: 'h-note-storage',
        }
    )
);

export default useNotesStoreFinal;
