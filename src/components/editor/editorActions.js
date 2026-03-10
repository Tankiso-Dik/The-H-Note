const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read file.'));
    reader.readAsDataURL(file);
});

export const runEditorCommand = (editor, command, options = {}) => {
    if (!editor) {
        return false;
    }

    const chain = editor.chain().focus();

    switch (command) {
    case 'toggleBold':
        return chain.toggleBold().run();
    case 'toggleItalic':
        return chain.toggleItalic().run();
    case 'toggleUnderline':
        return chain.toggleUnderline().run();
    case 'toggleCode':
        return chain.toggleCode().run();
    case 'toggleHighlight':
        return chain.toggleHighlight({ color: options.color || '#ffeb3b' }).run();
    case 'toggleCodeBlock':
        return chain.toggleCodeBlock().run();
    case 'toggleBulletList':
        return chain.toggleBulletList().run();
    case 'toggleOrderedList':
        return chain.toggleOrderedList().run();
    case 'toggleTaskList':
        return chain.toggleTaskList().run();
    case 'toggleBlockquote':
        return chain.toggleBlockquote().run();
    case 'selectAll':
        return chain.selectAll().run();
    case 'clearFormatting':
        return chain.unsetAllMarks().clearNodes().run();
    default:
        return false;
    }
};

export const applyEditorLink = (editor, url) => {
    if (!editor) {
        return false;
    }

    if (!url) {
        return editor.chain().focus().unsetLink().run();
    }

    return editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
};

export const insertEditorImageFromUrl = (editor, url) => {
    if (!editor || !url) {
        return false;
    }

    return editor.chain().focus().setImage({ src: url }).run();
};

export const insertEditorImageFromFile = async (editor, file) => {
    if (!editor || !file) {
        return false;
    }

    const src = await readFileAsDataUrl(file);
    return editor.chain().focus().setImage({ src }).run();
};
