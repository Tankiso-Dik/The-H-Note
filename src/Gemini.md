
# Gemini.md: Design Specification

## 1. Design Principles

* **Spatial Familiarity:** Users should intuitively understand the hierarchy based on Windows File Explorer mental models.
* **Visual Softness:** Utilize rounded corners, subtle drop shadows, and layered translucency (Mica effect) to reduce visual fatigue.
* **Interaction Intent:** Every hover and click should provide immediate, subtle visual feedback to confirm the system is listening.
* **Information Density:** Maintain a "Balanced" density—spacious enough for touch/web but tight enough for power users.

---

## 2. Visual Tone & Geometry

* **Typography:** Primary font is **Segoe UI Variable**.
* *Headers:* 14px Semi-bold.
* *Body/Labels:* 12px Regular.


* **Corner Radii:** * Main Windows/Containers: `8px`.
* Buttons/Hover States: `4px`.


* **Color Palette (Light Mode Foundation):**
* *Sidebar Background:* `#F3F3F3` (Subtle Grey).
* *Main Grid Background:* `#FFFFFF` (Pure White).
* *Accent Color:* `#0078D4` (Windows Blue) for active states.
* *Border/Stroke:* `1px solid #E5E5E5`.


* **Shadows:** * *Context Menus:* `0px 8px 16px rgba(0,0,0,0.14)`.

---

## 3. Layout Architecture

### Sidebar (Navigation Pane)

* **Width:** Fixed at `240px` (resizable up to `400px`).
* **Structure:** Vertical list of folders.
* **Hierarchy:** Nested folders use a `16px` indentation per level.
* **Interactions:**
* **Selection:** Clicking a folder highlights the row with a light-blue tint and a `3px` vertical blue "pill" on the far left.
* **Chevron:** A small arrow (toggle) appears to the left of folders containing sub-folders.
* **Right-Click:** Triggers "Rename" or "Delete" actions.



### Main Content Grid

* **View Style:** Large Icon View.
* **Card Dimensions:** `120px` x `140px`.
* **Spacing:** `24px` gap between cards.
* **Card Contents:**
* *Folders:* Standard Windows-style folder icon (Yellow/Manila palette).
* *Notes:* Document icon with a preview of the note title.


* **Empty State:** When a folder is empty, display a centered, desaturated icon with the text "This folder is empty" in 14px grey text.

---

## 4. Interaction Rules

### Selection & Hover

* **Hover State:** Items (folders/notes) gain a light grey background (`#EDEDED`) and a subtle `1px` border.
* **Selection State:** Item gains a light blue background (`#E9F5FF`) and a `1px` solid blue border (`#0078D4`).
* **Multi-select:** (Standard Desktop) Holding `Ctrl` allows clicking multiple items; `Shift` allows range selection.

### The Create Affordance (+)

* **Visual:** A floating or top-aligned `+ New` button.
* **Interaction:** * **Hover:** Button expands slightly or deepens in color.
* **Click/Hover Menu:** Opens a dropdown containing:
1. **New Note** (Empty).
2. **New Folder**.
3. **Templates Section** (Divided by a horizontal rule).




* **Template Logic:** Only templates created within the *current* active folder are visible in this menu.

### Editor Entry

* **Trigger:** Double-click on a Note card (Mobile/Touch: Single tap).
* **Behavior:** The Main Grid is replaced by the Editor view.
* **Navigation:** A "Breadcrumb" bar appears at the top (e.g., `Home > Projects > Ideas`) allowing the user to click "Projects" to return to the grid view.

---

## 5. Conceptual Templates

* **Creation:** Any note can be right-clicked and "Save as Template" selected.
* **Scope:** The template is anchored to its parent folder.
* **UX Flow:** If a user is in the "Meeting Notes" folder, the `+ New` menu will prioritize "Weekly Sync Template" if it was saved there previously.

---

## 6. Out of Scope (For Now)

* Search bar functionality and UI.
* Details Pane (Right-side metadata panel).
* File transfer/Upload logic.
* Rich text editor internal toolbar.
* Dark Mode color mapping.

Single click: selects note

Double click: opens editor

Enter key: opens editor (accessibility + power users)

This mirrors Explorer and feels good on web

B. Sidebar “Home” is not special

Add under Sidebar:

“Home is a default folder, not a privileged root.
All folders are treated equally by the system.”

Create menu ordering (small UX win)

Right now templates are just a section.

Recommend:

New Note (Empty)

——

Templates (folder-scoped)

——

New Folder

This subtly prioritizes writing over structure.

Context menu scope (note vs folder)

Add:

Folder context menu:

Rename

Delete

New Note

New Folder

Note context menu:

Open

Rename

Delete

Save as Template

This avoids ambiguity during build.