export const seedFolders = [
  { id: 'folder-1', name: 'Home', parentId: null },
  { id: 'folder-2', name: 'Projects', parentId: null },
  { id: 'folder-3', name: 'Personal', parentId: null },
  { id: 'folder-4', name: 'Work', parentId: 'folder-2' },
  { id: 'folder-5', name: 'Ideas', parentId: 'folder-2' },
  { id: 'folder-6', name: 'Archive', parentId: null },
];

export const seedNotes = [
  {
    id: 'note-1',
    title: 'Meeting Notes',
    folderId: 'folder-4',
    content: 'Discuss Q1 goals...',
    isTemplate: false,
  },
  {
    id: 'note-2',
    title: 'Project Plan',
    folderId: 'folder-4',
    content: 'Timeline and milestones...',
    isTemplate: false,
  },
  {
    id: 'note-3',
    title: 'Shopping List',
    folderId: 'folder-3',
    content: 'Milk, Eggs, Bread...',
    isTemplate: false,
  },
  {
    id: 'note-4',
    title: 'App Idea',
    folderId: 'folder-5',
    content: 'A notes app that looks like Explorer...',
    isTemplate: false,
  },
  {
    id: 'note-5',
    title: 'Welcome',
    folderId: 'folder-1',
    content: 'Welcome to The H Note!',
    isTemplate: false,
  },
];
