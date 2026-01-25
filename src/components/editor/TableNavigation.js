import { Extension } from '@tiptap/core';

export const TableNavigation = Extension.create({
    name: 'tableNavigation',

    addKeyboardShortcuts() {
        return {
            // Press Tab in the last cell to exit the table
            'Tab': () => {
                const { state } = this.editor;
                const { selection } = state;
                const { $anchor } = selection;

                // Check if we're in a table
                const table = $anchor.node(-3);
                if (table && table.type.name === 'table') {
                    // Check if we're in the last cell
                    const tableEnd = $anchor.end(-3);
                    const isLastCell = $anchor.pos >= tableEnd - 2;

                    if (isLastCell) {
                        // Exit the table by inserting a paragraph after it
                        const tablePos = $anchor.before(-3);
                        const afterTable = tablePos + table.nodeSize;

                        this.editor
                            .chain()
                            .insertContentAt(afterTable, { type: 'paragraph' })
                            .focus(afterTable + 1)
                            .run();

                        return true;
                    }
                }
                return false;
            },

            // Press Enter twice in an empty cell to exit the table
            'Mod-Enter': () => {
                const { state } = this.editor;
                const { selection } = state;
                const { $anchor } = selection;

                // Check if we're in a table
                const table = $anchor.node(-3);
                if (table && table.type.name === 'table') {
                    // Exit the table by inserting a paragraph after it
                    const tablePos = $anchor.before(-3);
                    const afterTable = tablePos + table.nodeSize;

                    this.editor
                        .chain()
                        .insertContentAt(afterTable, { type: 'paragraph' })
                        .focus(afterTable + 1)
                        .run();

                    return true;
                }
                return false;
            },

            // Arrow down in the last row exits the table
            'ArrowDown': () => {
                const { state } = this.editor;
                const { selection } = state;
                const { $anchor } = selection;

                // Check if we're in a table
                const table = $anchor.node(-3);
                if (table && table.type.name === 'table') {
                    const row = $anchor.node(-2);
                    const tableNode = $anchor.node(-3);

                    // Get the index of the current row
                    let rowIndex = 0;
                    tableNode.forEach((node, offset, index) => {
                        if (node === row) {
                            rowIndex = index;
                        }
                    });

                    // Check if we're in the last row
                    const isLastRow = rowIndex === tableNode.childCount - 1;

                    if (isLastRow) {
                        // Exit the table by inserting a paragraph after it
                        const tablePos = $anchor.before(-3);
                        const afterTable = tablePos + table.nodeSize;

                        // Check if there's already content after the table
                        const nodeAfter = state.doc.nodeAt(afterTable);

                        if (!nodeAfter) {
                            this.editor
                                .chain()
                                .insertContentAt(afterTable, { type: 'paragraph' })
                                .focus(afterTable + 1)
                                .run();
                        } else {
                            this.editor
                                .chain()
                                .focus(afterTable + 1)
                                .run();
                        }

                        return true;
                    }
                }
                return false;
            },
        };
    },
});
