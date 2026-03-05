import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  folders: defineTable({
    folderId: v.string(),
    name: v.string(),
    parentId: v.union(v.string(), v.null()),
    updatedAt: v.number(),
  })
    .index('by_folder_id', ['folderId'])
    .index('by_parent_id', ['parentId']),
  notes: defineTable({
    noteId: v.string(),
    title: v.string(),
    folderId: v.string(),
    content: v.string(),
    isTemplate: v.boolean(),
    updatedAt: v.number(),
  })
    .index('by_note_id', ['noteId'])
    .index('by_folder_id', ['folderId']),
});
