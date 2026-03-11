const isStringOrNull = (value) => typeof value === 'string' || value === null;
const isNumberOrMissing = (value) => value === undefined || Number.isFinite(value);

const normalizeFolder = (folder) => {
  if (!folder || typeof folder.id !== 'string' || typeof folder.name !== 'string') {
    return null;
  }

  if (!isStringOrNull(folder.parentId)) {
    return null;
  }

  if (!isNumberOrMissing(folder.sortOrder)) {
    return null;
  }

  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId ?? null,
    ...(typeof folder.sortOrder === 'number' ? { sortOrder: folder.sortOrder } : {}),
  };
};

const normalizeNote = (note) => {
  if (
    !note ||
    typeof note.id !== 'string' ||
    typeof note.title !== 'string' ||
    typeof note.folderId !== 'string'
  ) {
    return null;
  }

  return {
    id: note.id,
    title: note.title,
    folderId: note.folderId,
    content: typeof note.content === 'string' ? note.content : '',
    isTemplate: Boolean(note.isTemplate),
  };
};

export const normalizeDataBundle = (bundle) => {
  const foldersRaw = Array.isArray(bundle?.folders) ? bundle.folders : [];
  const notesRaw = Array.isArray(bundle?.notes) ? bundle.notes : [];

  const folders = foldersRaw.map(normalizeFolder).filter(Boolean);
  const notes = notesRaw.map(normalizeNote).filter(Boolean);

  return { folders, notes };
};

export const createExportBundle = ({ folders, notes }) => {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    folders,
    notes,
  };
};

export const downloadJson = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const parseImportedJsonText = (text) => {
  const parsed = JSON.parse(text);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Import file must contain a JSON object.');
  }

  if (!Array.isArray(parsed.folders) || !Array.isArray(parsed.notes)) {
    throw new Error('Import file must include folders[] and notes[].');
  }

  const normalized = normalizeDataBundle(parsed);

  if (normalized.folders.length !== parsed.folders.length || normalized.notes.length !== parsed.notes.length) {
    throw new Error('Import file contains invalid folder or note entries.');
  }

  return normalized;
};
