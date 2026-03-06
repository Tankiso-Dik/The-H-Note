const sanitizeFilename = (value, fallback = 'note') => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  const base = trimmed || fallback;
  return base.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').replace(/\s+/g, ' ').trim() || fallback;
};

const downloadBlob = (filename, blob) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const exportMarkdownFile = ({ title, markdown }) => {
  downloadBlob(`${sanitizeFilename(title)}.md`, new Blob([markdown], { type: 'text/markdown' }));
};

export const exportPlainTextFile = ({ title, text }) => {
  downloadBlob(`${sanitizeFilename(title)}.txt`, new Blob([text], { type: 'text/plain' }));
};

const createPrintableHtml = ({ title, bodyHtml }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #f3f4f6;
      color: #111827;
      font-family: Calibri, Arial, sans-serif;
    }

    body {
      padding: 32px;
    }

    .document {
      max-width: 816px;
      margin: 0 auto;
      background: #ffffff;
      padding: 72px 80px;
      box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12);
    }

    h1.document-title {
      margin: 0 0 24px;
      font-size: 28px;
      line-height: 1.2;
      font-weight: 700;
    }

    .document-content {
      font-size: 16px;
      line-height: 1.6;
    }

    .document-content img {
      max-width: 100%;
      height: auto;
    }

    .document-content pre {
      background: #f5f5f5;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    .document-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    .document-content th,
    .document-content td {
      border: 1px solid #d1d5db;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }

    .document-content blockquote {
      margin: 1rem 0;
      padding-left: 16px;
      border-left: 4px solid #d1d5db;
      color: #374151;
    }

    @page {
      size: A4;
      margin: 18mm;
    }

    @media print {
      html, body {
        background: #ffffff;
      }

      body {
        padding: 0;
      }

      .document {
        max-width: none;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <main class="document">
    <h1 class="document-title">${title}</h1>
    <section class="document-content">
      ${bodyHtml}
    </section>
  </main>
</body>
</html>`;

export const exportPdfDocument = ({ title, bodyHtml }) => {
  const html = createPrintableHtml({
    title,
    bodyHtml,
  });
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const printFrame = iframe.contentWindow;
  const printDocument = iframe.contentDocument || printFrame?.document;
  if (!printFrame || !printDocument) {
    document.body.removeChild(iframe);
    throw new Error('Could not start PDF export.');
  }

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 0);
  };

  printDocument.open();
  printDocument.write(html);
  printDocument.close();

  iframe.onload = () => {
    printFrame.focus();
    printFrame.print();
    cleanup();
  };
};
