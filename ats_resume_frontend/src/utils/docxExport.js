import JSZip from 'jszip';

/**
 * Minimal DOCX export: generates a very basic WordprocessingML document from resume data.
 * No styling/templates; keeps file size small and avoids extra heavy dependencies.
 * Note: For richer formatting, consider a dedicated DOCX generation library in the future.
 */

// PUBLIC_INTERFACE
export async function exportResumeToDocx(data, fileName = 'Resume.docx') {
  /** Export resume data to a simple .docx file with headings and paragraphs. */
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file('[Content_Types].xml', `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`.trim());

  // _rels/.rels
  zip.file('_rels/.rels', `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`.trim());

  // word/_rels/document.xml.rels
  zip.file('word/_rels/document.xml.rels', `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`.trim());

  const P = data.personal || {};
  const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const para = (t, opts = {}) => `
    <w:p>
      ${opts.heading ? `<w:pPr><w:pStyle w:val="${opts.heading}"/></w:pPr>` : ''}
      <w:r><w:t>${esc(t)}</w:t></w:r>
    </w:p>
  `;

  const bullets = (arr) => (arr || []).filter(Boolean).map(b => `
    <w:p>
      <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>
      <w:r><w:t>${esc(b)}</w:t></w:r>
    </w:p>
  `).join('');

  const lines = [];

  // Header
  const headerLine = [P.fullName, P.title].filter(Boolean).join(' — ');
  lines.push(para(headerLine, { heading: 'Heading1' }));
  const meta = [P.email, P.phone, P.location, P.website].filter(Boolean).join(' | ');
  if (meta) lines.push(para(meta));

  // Summary
  if (data.summary) {
    lines.push(para('Summary', { heading: 'Heading2' }));
    lines.push(para(data.summary));
  }

  // Experience
  const exp = (data.experience || []).filter(e => e.title);
  if (exp.length) {
    lines.push(para('Experience', { heading: 'Heading2' }));
    exp.forEach(e => {
      lines.push(para(`${e.title} — ${e.subtitle || ''}`.trim(), { heading: 'Heading3' }));
      const dates = [e.startDate, e.endDate].filter(Boolean).join(' - ');
      if (dates) lines.push(para(dates));
      const bl = String(e.description || '').split('\n').filter(Boolean);
      if (bl.length) lines.push(bullets(bl));
    });
  }

  // Projects
  const pro = (data.projects || []).filter(p => p.title);
  if (pro.length) {
    lines.push(para('Projects', { heading: 'Heading2' }));
    pro.forEach(p => {
      lines.push(para(`${p.title} — ${p.subtitle || ''}`.trim(), { heading: 'Heading3' }));
      const dates = [p.startDate, p.endDate].filter(Boolean).join(' - ');
      if (dates) lines.push(para(dates));
      const bl = String(p.description || '').split('\n').filter(Boolean);
      if (bl.length) lines.push(bullets(bl));
    });
  }

  // Education
  const edu = (data.education || [])[0];
  if (edu?.title) {
    lines.push(para('Education', { heading: 'Heading2' }));
    lines.push(para(`${edu.title} — ${edu.subtitle || ''}`.trim(), { heading: 'Heading3' }));
    const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
    if (dates) lines.push(para(dates));
    if (edu.description) {
      const bl = String(edu.description || '').split('\n').filter(Boolean);
      if (bl.length) lines.push(bullets(bl));
    }
  }

  // Skills
  const skills = (data.skills || []).filter(Boolean);
  if (skills.length) {
    lines.push(para('Skills', { heading: 'Heading2' }));
    lines.push(para(skills.join(' • ')));
  }

  const documentXml = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${lines.join('\n')}
    <w:sectPr/>
  </w:body>
</w:document>`.trim();

  zip.file('word/document.xml', documentXml);

  // Note: For real bullets numbering you'd also include numbering.xml; this minimal file renders as paragraphs.
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
}
