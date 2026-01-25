NOTE EDITOR SHELL (PHASE 1)

Context (Read Carefully):
We already have a working notes application with:

Folder tree navigation

Note list / grid

Note selection logic

State management already in place

Do NOT refactor, redesign, or modify the existing navigation, folder system, or app structure.

We are now moving on to a new, separate concern:
building the visual shell for the NOTE EDITOR that appears when a note is opened.

This task is only about the editor UI shell, not the rest of the app.

🎯 Objective

Create a Microsoft Word–inspired editor UI shell that will be rendered inside the note view when a note is opened.

This phase is strictly about:

Layout

Visual structure

Theming

Placeholder controls

⚠️ No real text editing logic yet. No TipTap initialization yet. No content handling yet.

📌 Scope Rules (Very Important)
You MAY:

Create new editor-related components (e.g. NoteEditorShell, EditorRibbon, EditorWorkspace)

Add CSS variables and editor-specific styles

Add placeholder buttons and UI controls

Add a theme toggle for the editor

You MUST NOT:

Modify folder navigation

Modify note creation logic

Rewrite global app layout

Introduce TipTap logic

Enable typing, undo, formatting, or keyboard shortcuts

🧱 Phase 1 — Note Editor Architectural Shell (UI ONLY)
1. Overall Layout (Editor Only)

The editor UI is a vertical layout composed of:

Quick Access Header (32px height)

Undo / Redo icons (visual only)

Note title (read-only display)

Ribbon Toolbar (100–120px height)

White background

Grouped controls with vertical separators

Workspace Area

Grey background (#F3F3F3)

Centers a white “Page” canvas

2. Ribbon UI Groups (Non-Functional)

Create visually accurate placeholder controls only.

Clipboard Group

Cut

Copy

Paste

Font Group

Font family dropdown (mock)

Font size dropdown (mock)

Bold

Italic

Underline

Strikethrough

Text color

Highlight

Paragraph Group

Bulleted list

Numbered list

Task list

Blockquote

Horizontal rule

Styles Group

Scrollable preset boxes:

Normal

Heading 1

Heading 2

Heading 3

Each group must:

Be visually separated by a 1px divider

Have a label under the group (Word-style)

3. Page Canvas (Document Area)

The editor content area must resemble Microsoft Word:

Width: 816px

Padding: 96px

Margin: 40px auto

Background: white

Shadow: 0px 2px 8px rgba(0,0,0,0.1)

Centered within a grey workspace

⚠️ This is a visual container only — no typing yet.

4. Right-Click Context Menu (Mockup)

Inside the editor page:

Disable the browser’s default context menu

Show a custom Windows-11-style menu

Include:

Mini toolbar (top row):

Bold

Italic

Underline

Highlight

Menu items:

Cut / Copy / Paste

Styles ▶ (submenu)

Insert ▶ (submenu)

Clear formatting

All actions are visual placeholders only.

5. Theme System (Editor Only)

Implement CSS variables to support instant color inversion:

Light Mode

Workspace: #F3F3F3

Page: #FFFFFF

Text: #1A1A1A

Ribbon: #FFFFFF

Dark / Inverted Mode

Workspace: #202020

Page: #000000

Text: #E0E0E0

Ribbon: #1A1A1A

Theme toggle:

Simple button in the ribbon

Toggles data-theme="dark" on the editor root

🚫 Explicitly Out of Scope (Do NOT Implement)

TipTap editor instance

Text input

Cursor behavior

Undo history

Formatting logic

Keyboard shortcuts

Multi-page layout

✅ Success Criteria

At the end of this task:

Opening a note shows a fully styled Word-like editor shell

All buttons exist visually but do nothing

The editor feels “real” even though it is non-functional

No existing navigation or state logic is touched