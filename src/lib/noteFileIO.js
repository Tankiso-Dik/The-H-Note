import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

const escapeHtml = (value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const splitIntoParagraphs = (text) => text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

export const plainTextToHtml = (text) => {
    const paragraphs = splitIntoParagraphs(text);

    if (paragraphs.length === 0) {
        return '<p></p>';
    }

    return paragraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
        .join('');
};

export const inferTitleFromFilename = (filename) => {
    if (!filename) {
        return 'Imported Note';
    }

    return filename.replace(/\.[^.]+$/, '').trim() || 'Imported Note';
};

const extractPdfText = async (file) => {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

    const buffer = await file.arrayBuffer();
    const document = await pdfjs.getDocument({ data: buffer }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const lines = [];
        let currentLine = '';
        let lastY = null;

        for (const item of content.items) {
            if (!('str' in item)) {
                continue;
            }

            const y = item.transform?.[5] ?? null;
            if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
                if (currentLine.trim()) {
                    lines.push(currentLine.trim());
                }
                currentLine = '';
            }

            currentLine += item.str;
            lastY = y;
        }

        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }

        pages.push(lines.join('\n'));
    }

    return pages.filter(Boolean).join('\n\n');
};

export const readImportedNoteFile = async (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const title = inferTitleFromFilename(file.name);

    if (extension === 'md' || extension === 'markdown') {
        return {
            title,
            format: 'markdown',
            content: await file.text(),
            notice: '',
        };
    }

    if (extension === 'txt') {
        return {
            title,
            format: 'text',
            content: await file.text(),
            notice: '',
        };
    }

    if (extension === 'pdf') {
        return {
            title,
            format: 'text',
            content: await extractPdfText(file),
            notice: 'Imported PDF as extracted text. Layout, tables, and images may not carry over.',
        };
    }

    throw new Error(`Unsupported file type: ${file.name}`);
};
