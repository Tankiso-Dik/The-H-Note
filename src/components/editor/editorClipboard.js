import { DOMSerializer } from '@tiptap/pm/model';

const serializeClipboardText = (editor, content) => {
    if (editor?.markdown && content) {
        try {
            let contentToSerialize = content;
            if (typeof content.toJSON === 'function') {
                contentToSerialize = content.toJSON();
            }
            const serialized = editor.markdown.serialize(contentToSerialize).trim();
            if (serialized) {
                return serialized;
            }
        } catch (e) {
        }
    }

    return editor?.getText({ blockSeparator: '\n\n' }) || '';
};

export const getEditorPlainText = (editor) => serializeClipboardText(editor, editor?.state?.doc);

const getClipboardContentFromSelection = (editor) => {
    const { selection, schema } = editor.state;

    if (selection.empty) {
        return null;
    }

    const fragment = selection.content().content;
    const wrapper = document.createElement('div');
    const serializer = DOMSerializer.fromSchema(schema);
    wrapper.appendChild(serializer.serializeFragment(fragment));

    return {
        text: serializeClipboardText(editor, fragment) || wrapper.textContent || '',
        html: wrapper.innerHTML,
    };
};

export const getSelectedEditorClipboardContent = (editor) => {
    if (!editor || typeof document === 'undefined') {
        return null;
    }

    return getClipboardContentFromSelection(editor);
};

export const writeClipboardContentToEvent = (event, content) => {
    const clipboardData = event?.clipboardData;

    if (!clipboardData || !content) {
        return false;
    }

    event.preventDefault();
    clipboardData.setData('text/plain', content.text || '');

    if (content.html) {
        clipboardData.setData('text/html', content.html);
    }

    return true;
};

const legacyCopyPlainText = (text) => {
    if (!document?.body) {
        return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const savedRanges = [];
    for (let index = 0; selection && index < selection.rangeCount; index += 1) {
        savedRanges.push(selection.getRangeAt(index).cloneRange());
    }

    const activeElement = document.activeElement;

    textarea.focus();
    textarea.select();

    let didCopy = false;
    try {
        didCopy = document.execCommand('copy');
    } finally {
        document.body.removeChild(textarea);

        if (selection) {
            selection.removeAllRanges();
            savedRanges.forEach((range) => selection.addRange(range));
        }

        if (activeElement instanceof HTMLElement) {
            activeElement.focus({ preventScroll: true });
        }
    }

    return didCopy;
};

const legacyCopyContent = ({ text, html }) => {
    if (typeof document?.execCommand !== 'function') {
        return false;
    }

    let didWriteToClipboard = false;
    const handleCopy = (event) => {
        if (writeClipboardContentToEvent(event, { text, html })) {
            didWriteToClipboard = true;
        }
    };

    document.addEventListener('copy', handleCopy);

    try {
        const didTriggerCopy = document.execCommand('copy');
        if (didTriggerCopy && didWriteToClipboard) {
            return true;
        }
    } finally {
        document.removeEventListener('copy', handleCopy);
    }

    return legacyCopyPlainText(text);
};

export const writeClipboardContent = async ({ text, html }) => {
    if (legacyCopyContent({ text, html })) {
        return;
    }

    if (navigator.clipboard?.write && window.ClipboardItem && html) {
        try {
            const item = new window.ClipboardItem({
                'text/plain': new Blob([text], { type: 'text/plain' }),
                'text/html': new Blob([html], { type: 'text/html' }),
            });
            await navigator.clipboard.write([item]);
            return;
        } catch (error) {
            if (!navigator.clipboard?.writeText) {
                throw error;
            }
        }
    }

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    throw new Error('Clipboard access is unavailable.');
};

export const copyEditorSelection = async (editor) => {
    const content = getSelectedEditorClipboardContent(editor);

    if (!content) {
        return false;
    }

    await writeClipboardContent(content);
    return true;
};

const MARKDOWN_PATTERNS = [
    /^#{1,6}\s/m,
    /^>\s/m,
    /^```[\s\S]*```/m,
    /^[-*+]\s/m,
    /^\d+\.\s/m,
    /^-\s\[[ xX]\]\s/m,
    /!\[[^\]]*]\([^)]+\)/,
    /\[[^\]]+]\([^)]+\)/,
    /^\|.+\|\s*$/m,
];

const looksLikeMarkdown = (text) => {
    if (!text) {
        return false;
    }

    const normalized = text.trim();

    if (!normalized) {
        return false;
    }

    return MARKDOWN_PATTERNS.some((pattern) => pattern.test(normalized));
};

const readClipboardContent = async () => {
    if (navigator.clipboard?.read) {
        try {
            const items = await navigator.clipboard.read();

            for (const item of items) {
                if (item.types.includes('text/html')) {
                    const html = await (await item.getType('text/html')).text();
                    const text = item.types.includes('text/plain')
                        ? await (await item.getType('text/plain')).text()
                        : '';

                    return { text, html };
                }

                if (item.types.includes('text/plain')) {
                    const text = await (await item.getType('text/plain')).text();
                    return { text, html: '' };
                }
            }
        } catch (error) {
            if (!navigator.clipboard?.readText) {
                throw error;
            }
        }
    }

    if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        return { text, html: '' };
    }

    throw new Error('Clipboard access is unavailable.');
};

export const pasteClipboardIntoEditor = async (editor) => {
    if (!editor) {
        return false;
    }

    const content = await readClipboardContent();
    if (!content?.text && !content?.html) {
        return false;
    }

    const normalizedText = content.text.replace(/\r\n?/g, '\n');

    if (content.html) {
        return editor.chain().focus().insertContent(content.html).run();
    }

    if (editor.markdown && looksLikeMarkdown(normalizedText)) {
        const parsedContent = editor.markdown.parse(normalizedText);
        return editor.chain().focus().insertContent(parsedContent).run();
    }

    return editor.chain().focus().insertContent(normalizedText).run();
};
