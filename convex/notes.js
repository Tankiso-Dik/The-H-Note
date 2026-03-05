import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { seedFolders, seedNotes } from './seedData';

const folderInput = v.object({
  id: v.string(),
  name: v.string(),
  parentId: v.union(v.string(), v.null()),
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

const getNoteDocByNoteId = async (db, noteId) => {
  return await db
    .query('notes')
    .withIndex('by_note_id', (q) => q.eq('noteId', noteId))
    .unique();
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
    const folders = (await ctx.db.query('folders').collect())
      .map(folderFromDoc)
      .sort((a, b) => a.name.localeCompare(b.name));
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

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: folder.name,
        parentId: folder.parentId,
        updatedAt: Date.now(),
      });
      return folder.id;
    }

    await ctx.db.insert('folders', {
      folderId: folder.id,
      name: folder.name,
      parentId: folder.parentId,
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
    const existingFolders = await ctx.db.query('folders').collect();
    for (const folderDoc of existingFolders) {
      await ctx.db.delete(folderDoc._id);
    }

    const existingNotes = await ctx.db.query('notes').collect();
    for (const noteDoc of existingNotes) {
      await ctx.db.delete(noteDoc._id);
    }

    const now = Date.now();

    for (const folder of folders) {
      await ctx.db.insert('folders', {
        folderId: folder.id,
        name: folder.name,
        parentId: folder.parentId,
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
