// Simple PDF/DOCX export helpers – no external deps.
// PDFs are minimal but valid; DOCX is a plain HTML-wrapped blob for now.
// Replace with `jspdf`/`docx` libs if richer formatting is needed.

function escapePdfText(s: string): string { return s.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)"); }

export function buildSimplePdf(title: string, body: string): Buffer {
  const text = `${title}\n\n${body}`.split("\n").map(l=>`(${escapePdfText(l)}) Tj`).join("\nT* ");
  // Minimal PDF 1.4 with one page – sufficient for download, not for print-grade layout
  const content = `BT /F1 11 Tf 50 750 Td ${text} ET`;
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >> endobj
4 0 obj << /Length ${content.length} >> stream
${content}
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000300 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
${350 + content.length}
%%EOF`;
  return Buffer.from(pdf, "utf-8");
}

export function buildDocxLikeHtml(title: string, body: string): Buffer {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1><pre style="white-space:pre-wrap;font-family:serif">${body.replace(/</g,"&lt;")}</pre></body></html>`;
  return Buffer.from(html, "utf-8");
}
