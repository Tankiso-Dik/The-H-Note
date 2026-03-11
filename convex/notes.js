import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { seedFolders, seedNotes } from './seedData';

const ORDER_STEP = 1024;

const folderInput = v.object({
  id: v.string(),
  name: v.string(),
  parentId: v.union(v.string(), v.null()),
  sortOrder: v.optional(v.number()),
});

const noteInput = v.object({
  id: v.string(),
  title: v.string(),
  folderId: v.string(),
  content: v.string(),
  isTemplate: v.boolean(),
});

const folderFromDoc = (doc) => ({
  id: doc.folderId,
  name: doc.name,
  parentId: doc.parentId,
  ...(typeof doc.sortOrder === 'number' ? { sortOrder: doc.sortOrder } : {}),
});

const noteFromDoc = (doc) => ({
  id: doc.noteId,
  title: doc.title,
  folderId: doc.folderId,
  content: doc.content,
  isTemplate: doc.isTemplate,
});

const getFolderDocByFolderId = async (db, folderId) => {
  return await db
    .query('folders')
    .withIndex('by_folder_id', (q) => q.eq('folderId', folderId))
    .unique();
};

const compareFolderNames = (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

const resolveSiblingSortOrders = (folders) => {
  const legacyFolders = folders
    .filter((folder) => typeof folder.sortOrder !== 'number')
    .sort(compareFolderNames);

  const legacyOrderById = new Map(
    legacyFolders.map((folder, index) => [folder.id, index * ORDER_STEP])
  );

  return folders.map((folder) => ({
    ...folder,
    sortOrder:
      typeof folder.sortOrder === 'number' ? folder.sortOrder : legacyOrderById.get(folder.id) ?? 0,
  }));
};

const flattenFolderTree = (folders) => {
  const resolvedFolders = resolveSiblingSortOrders(folders);
  const childrenByParent = new Map();

  for (const folder of resolvedFolders) {
    const key = folder.parentId ?? '__root__';
    if (!childrenByParent.has(key)) {
      childrenByParent.set(key, []);
    }
    childrenByParent.get(key).push(folder);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.sortOrder - b.sortOrder || compareFolderNames(a, b));
  }

  const ordered = [];

  const visit = (parentId) => {
    const key = parentId ?? '__root__';
    const siblings = childrenByParent.get(key) ?? [];
    for (const folder of siblings) {
      ordered.push(folder);
      visit(folder.id);
    }
  };

  visit(null);

  return ordered;
};

const getResolvedFolderSortOrder = async (db, folderId, parentId) => {
  const siblings = (await db
    .query('folders')
    .withIndex('by_parent_id', (q) => q.eq('parentId', parentId))
    .collect())
    .map(folderFromDoc);

  return (
    resolveSiblingSortOrders(siblings).find((folder) => folder.id === folderId)?.sortOrder ?? null
  );
};

const getNextFolderSortOrder = async (db, parentId, excludeFolderId = null) => {
  const siblings = (await db
    .query('folders')
    .withIndex('by_parent_id', (q) => q.eq('parentId', parentId))
    .collect())
    .map(folderFromDoc)
    .filter((folder) => folder.id !== excludeFolderId);

  if (siblings.length === 0) {
    return 0;
  }

  const resolvedSiblings = resolveSiblingSortOrders(siblings);
  const maxSortOrder = Math.max(...resolvedSiblings.map((folder) => folder.sortOrder ?? 0));
  return maxSortOrder + ORDER_STEP;
};

const resolveFolderSortOrderForWrite = async (db, folder, existing) => {
  if (typeof folder.sortOrder === 'number') {
    return folder.sortOrder;
  }

  if (existing && existing.parentId === folder.parentId) {
    const existingOrder = await getResolvedFolderSortOrder(db, folder.id, folder.parentId);
    if (typeof existingOrder === 'number') {
      return existingOrder;
    }
  }

  return getNextFolderSortOrder(db, folder.parentId, folder.id);
};

const fillMissingSortOrdersFromSource = (folders) => {
  const counters = new Map();

  return folders.map((folder) => {
    if (typeof folder.sortOrder === 'number') {
      const currentMax = counters.get(folder.parentId ?? '__root__') ?? -ORDER_STEP;
      counters.set(folder.parentId ?? '__root__', Math.max(currentMax, folder.sortOrder));
      return folder;
    }

    const key = folder.parentId ?? '__root__';
    const nextSortOrder = (counters.get(key) ?? -ORDER_STEP) + ORDER_STEP;
    counters.set(key, nextSortOrder);
    return {
      ...folder,
      sortOrder: nextSortOrder,
    };
  });
};

const getNoteDocByNoteId = async (db, noteId) => {
  return await db
    .query('notes')
    .withIndex('by_note_id', (q) => q.eq('noteId', noteId))
    .unique();
};

const validateImportBundle = ({ folders, notes }) => {
  const folderById = new Map();

  for (const folder of folders) {
    if (folderById.has(folder.id)) {
      throw new Error(`Duplicate folder ID "${folder.id}" in import bundle.`);
    }

    folderById.set(folder.id, folder);
  }

  for (const folder of folders) {
    if (folder.parentId && !folderById.has(folder.parentId)) {
      throw new Error(`Folder "${folder.id}" references missing parent "${folder.parentId}".`);
    }
  }

  const visited = new Set();
  const visiting = new Set();

  const visitFolder = (folderId) => {
    if (visited.has(folderId)) {
      return;
    }

    if (visiting.has(folderId)) {
      throw new Error(`Folder cycle detected for "${folderId}".`);
    }

    visiting.add(folderId);

    const folder = folderById.get(folderId);
    if (folder?.parentId) {
      visitFolder(folder.parentId);
    }

    visiting.delete(folderId);
    visited.add(folderId);
  };

  for (const folderId of folderById.keys()) {
    visitFolder(folderId);
  }

  const noteIds = new Set();
  for (const note of notes) {
    if (noteIds.has(note.id)) {
      throw new Error(`Duplicate note ID "${note.id}" in import bundle.`);
    }

    noteIds.add(note.id);

    if (!folderById.has(note.folderId)) {
      throw new Error(`Note "${note.id}" references missing folder "${note.folderId}".`);
    }
  }
};

const collectFolderTreeIds = async (db, rootFolderId) => {
  const toVisit = [rootFolderId];
  const collected = new Set();

  while (toVisit.length > 0) {
    const folderId = toVisit.pop();
    if (!folderId || collected.has(folderId)) {
      continue;
    }

    collected.add(folderId);

    const children = await db
      .query('folders')
      .withIndex('by_parent_id', (q) => q.eq('parentId', folderId))
      .collect();

    for (const child of children) {
      toVisit.push(child.folderId);
    }
  }

  return [...collected];
};

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const folders = flattenFolderTree((await ctx.db.query('folders').collect()).map(folderFromDoc));
    const notes = (await ctx.db.query('notes').collect())
      .map(noteFromDoc)
      .sort((a, b) => a.title.localeCompare(b.title));

    return { folders, notes };
  },
});

export const ensureBootstrapData = mutation({
  args: {},
  handler: async (ctx) => {
    const existingFolders = await ctx.db.query('folders').take(1);
    if (existingFolders.length > 0) {
      return { seeded: false };
    }

    const now = Date.now();

    for (const folder of seedFolders) {
      await ctx.db.insert('folders', {
        folderId: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        sortOrder: folder.sortOrder,
        updatedAt: now,
      });
    }

    for (const note of seedNotes) {
      await ctx.db.insert('notes', {
        noteId: note.id,
        title: note.title,
        folderId: note.folderId,
        content: note.content,
        isTemplate: note.isTemplate,
        updatedAt: now,
      });
    }

    return { seeded: true };
  },
});

export const upsertFolder = mutation({
  args: {
    folder: folderInput,
  },
  handler: async (ctx, { folder }) => {
    const existing = await getFolderDocByFolderId(ctx.db, folder.id);
    const sortOrder = await resolveFolderSortOrderForWrite(ctx.db, folder, existing);

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: folder.name,
        parentId: folder.parentId,
        sortOrder,
        updatedAt: Date.now(),
      });
      return folder.id;
    }

    await ctx.db.insert('folders', {
      folderId: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      sortOrder,
      updatedAt: Date.now(),
    });

    return folder.id;
  },
});

export const deleteFolderRecursive = mutation({
  args: {
    folderId: v.string(),
  },
  handler: async (ctx, { folderId }) => {
    const folderTreeIds = await collectFolderTreeIds(ctx.db, folderId);

    for (const id of folderTreeIds) {
      const folderDoc = await getFolderDocByFolderId(ctx.db, id);
      if (folderDoc) {
        await ctx.db.delete(folderDoc._id);
      }

      const notesInFolder = await ctx.db
        .query('notes')
        .withIndex('by_folder_id', (q) => q.eq('folderId', id))
        .collect();

      for (const noteDoc of notesInFolder) {
        await ctx.db.delete(noteDoc._id);
      }
    }

    return { deletedFolderIds: folderTreeIds };
  },
});

export const upsertNote = mutation({
  args: {
    note: noteInput,
  },
  handler: async (ctx, { note }) => {
    const existing = await getNoteDocByNoteId(ctx.db, note.id);

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: note.title,
        folderId: note.folderId,
        content: note.content,
        isTemplate: note.isTemplate,
        updatedAt: Date.now(),
      });
      return note.id;
    }

    await ctx.db.insert('notes', {
      noteId: note.id,
      title: note.title,
      folderId: note.folderId,
      content: note.content,
      isTemplate: note.isTemplate,
      updatedAt: Date.now(),
    });

    return note.id;
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.string(),
  },
  handler: async (ctx, { noteId }) => {
    const existing = await getNoteDocByNoteId(ctx.db, noteId);
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { deleted: !!existing };
  },
});

export const replaceAll = mutation({
  args: {
    folders: v.array(folderInput),
    notes: v.array(noteInput),
  },
  handler: async (ctx, { folders, notes }) => {
    validateImportBundle({ folders, notes });

    const existingFolders = await ctx.db.query('folders').collect();
    for (const folderDoc of existingFolders) {
      await ctx.db.delete(folderDoc._id);
    }

    const existingNotes = await ctx.db.query('notes').collect();
    for (const noteDoc of existingNotes) {
      await ctx.db.delete(noteDoc._id);
    }

    const now = Date.now();

    for (const folder of fillMissingSortOrdersFromSource(folders)) {
      await ctx.db.insert('folders', {
        folderId: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        sortOrder: folder.sortOrder,
        updatedAt: now,
      });
    }

    for (const note of notes) {
      await ctx.db.insert('notes', {
        noteId: note.id,
        title: note.title,
        folderId: note.folderId,
        content: note.content,
        isTemplate: note.isTemplate,
        updatedAt: now,
      });
    }

    return {
      folders: folders.length,
      notes: notes.length,
    };
  },
});

export const reorderFolders = mutation({
  args: {
    parentId: v.union(v.string(), v.null()),
    orderedFolderIds: v.array(v.string()),
  },
  handler: async (ctx, { parentId, orderedFolderIds }) => {
    const siblings = await ctx.db
      .query('folders')
      .withIndex('by_parent_id', (q) => q.eq('parentId', parentId))
      .collect();

    const siblingIds = siblings.map((folder) => folder.folderId).sort();
    const requestedIds = [...orderedFolderIds].sort();

    if (
      siblingIds.length !== requestedIds.length ||
      siblingIds.some((folderId, index) => folderId !== requestedIds[index])
    ) {
      throw new Error('orderedFolderIds must contain every sibling exactly once.');
    }

    const folderDocById = new Map(siblings.map((folder) => [folder.folderId, folder]));

    for (const [index, folderId] of orderedFolderIds.entries()) {
      const folderDoc = folderDocById.get(folderId);
      if (!folderDoc) {
        continue;
      }

      await ctx.db.patch(folderDoc._id, {
        sortOrder: index * ORDER_STEP,
        updatedAt: Date.now(),
      });
    }

    return { reordered: orderedFolderIds.length };
  },
});
