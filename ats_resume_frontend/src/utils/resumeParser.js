// Use CRA-compatible entry points from pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js';

/**
 * Minimal client-side parsing utilities without backend:
 * - PDF: uses pdfjs-dist to extract text
 * - DOCX: uses a naive approach: read as ArrayBuffer -> try to locate text via unzip fallback is not used here to avoid adding heavy deps;
 *         we fallback to reading as text if browser infers text/plain, otherwise we throw a helpful error to the user.
 * - TXT: plain text
 * Then, apply heuristic parsing to extract personal info, sections, and bullets.
 */

// Configure pdfjs worker
// For CRA, the imported workerUrl is a module that resolves to the built asset URL.
// Assign it directly so pdfjs can spawn the worker correctly.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Regex helpers
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(\+\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/;
const URL_RE = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/i;

async function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsArrayBuffer(file);
  });
}

async function readAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsText(file);
  });
}

async function extractPdfText(file) {
  const arrayBuffer = await readAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map(it => it.str);
    fullText += strings.join(' ') + '\n';
  }
  return fullText;
}

async function extractDocxTextFallback(file) {
  // We don't add a heavy unzip/docx parser dependency. Provide a graceful message.
  // Some browsers may expose docx with text content when copied from certain generators; try readAsText.
  try {
    const txt = await readAsText(file);
    if (typeof txt === 'string' && txt.trim().length > 0) return txt;
  } catch (e) {
    // ignore
  }
  throw new Error('DOCX parsing not supported in this build. Please upload a PDF or a TXT export of your resume.');
}

async function extractTxt(file) {
  return readAsText(file);
}

function splitSections(text) {
  const normalized = text.replace(/\r/g, '');
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  // Attempt to detect section boundaries by common headings
  const sections = {};
  let current = 'header';
  sections[current] = [];

  const headings = [
    'summary', 'professional summary', 'experience', 'work experience', 'employment',
    'projects', 'education', 'skills', 'certifications', 'certification',
    'conferences', 'publications', 'awards', 'achievements'
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const matched = headings.find(h => lower.startsWith(h));
    if (matched) {
      current = matched.includes('summary') ? 'summary'
        : matched.includes('experience') || matched === 'employment' ? 'experience'
        : matched.includes('project') ? 'projects'
        : matched.includes('education') ? 'education'
        : matched.includes('skill') ? 'skills'
        : matched.includes('certification') ? 'certifications'
        : matched.includes('conference') ? 'conferences'
        : matched.includes('publication') ? 'publications'
        : 'other';
      if (!sections[current]) sections[current] = [];
      continue;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
  }
  return sections;
}

function parsePersonal(text) {
  const firstLine = text.split('\n').map(s => s.trim()).find(Boolean) || '';
  const fullName = firstLine.length < 80 ? firstLine.replace(/[|•·]+/g, ' ').trim() : '';
  const email = (text.match(EMAIL_RE) || [])[0] || '';
  const phone = (text.match(PHONE_RE) || [])[0] || '';
  const website = (text.match(URL_RE) || [])[0] || '';
  const location = ''; // heuristics for location are unreliable without NLP; leave empty
  return { fullName, email, phone, website, location, title: '' };
}

function bulletsFrom(lines) {
  // Convert dash/star bullets into bullet lines
  const bullets = [];
  lines.forEach(line => {
    const m = line.match(/^[-•*]\s*(.+)$/);
    if (m) bullets.push(m[1]);
  });
  // If no explicit bullets, chunk by sentences as fallback
  if (bullets.length === 0) {
    const joined = lines.join(' ');
    joined.split(/(?<=\.)\s+/).forEach(s => {
      const t = s.trim();
      if (t.length > 0) bullets.push(t);
    });
  }
  return bullets;
}

function parseExperience(lines) {
  // Very simple heuristic: group every 3-6 lines as one job, look for date ranges
  const items = [];
  let block = [];
  const flush = () => {
    if (block.length === 0) return;
    const header = block[0] || '';
    const [titlePart, companyPart] = header.split('—').map(s => s.trim());
    const dateLine = block.find(l => /\b(20\d{2}|19\d{2})\b/.test(l)) || '';
    const [startDate = '', endDate = ''] = dateLine.split(/-|–|to/i).map(s => s.trim());
    const descLines = block.slice(1);
    items.push({
      title: (titlePart || '').trim(),
      subtitle: (companyPart || '').trim(),
      company: (companyPart || '').trim(),
      startDate,
      endDate,
      bullets: bulletsFrom(descLines)
    });
    block = [];
  };

  lines.forEach((l) => {
    if (/^\s*$/.test(l)) return;
    if (/^[-•*]\s+/.test(l) || /\b(20\d{2}|19\d{2})\b/.test(l) || block.length === 0) {
      // keep collecting lines for this block
      block.push(l);
      if (block.length >= 6) {
        flush();
      }
    } else {
      block.push(l);
    }
  });
  flush();
  return items.filter(it => it.title || it.company || it.bullets?.length);
}

function parseEducation(lines) {
  // Heuristic: 1st non-empty is school - degree on same or next line, then dates
  if (!lines || lines.length === 0) return [];
  const joined = lines.join(' ');
  const yearMatches = joined.match(/\b(20\d{2}|19\d{2})\b/g) || [];
  const first = lines[0] || '';
  const second = lines[1] || '';
  const [school, degree] = first.includes('—') ? first.split('—').map(s => s.trim()) : [first.trim(), second.trim()];
  const highlights = bulletsFrom(lines.slice(2));
  const startDate = yearMatches[0] || '';
  const endDate = yearMatches[1] || startDate || '';
  return [{
    school,
    degree,
    startDate,
    endDate,
    location: '',
    highlights
  }];
}

function parseSkills(lines) {
  const joined = lines.join(' ');
  return joined.split(/[,•|;/]/).map(s => s.trim()).filter(Boolean);
}

function parseProjects(lines) {
  // Similar to experience but lighter
  if (!lines || lines.length === 0) return [];
  const items = [];
  let block = [];
  const flush = () => {
    if (block.length === 0) return;
    const header = block[0] || '';
    const [title, subtitle] = header.split('—').map(s => s.trim());
    const dateLine = block.find(l => /\b(20\d{2}|19\d{2})\b/.test(l)) || '';
    const [startDate = '', endDate = ''] = dateLine.split(/-|–|to/i).map(s => s.trim());
    items.push({
      title: title || '',
      subtitle: subtitle || '',
      startDate,
      endDate,
      bullets: bulletsFrom(block.slice(1))
    });
    block = [];
  };
  lines.forEach(l => {
    if (/^\s*$/.test(l)) return;
    block.push(l);
    if (block.length >= 6) flush();
  });
  flush();
  return items.filter(it => it.title || it.bullets?.length);
}

// PUBLIC_INTERFACE
export async function parseResumeFile(file) {
  /**
   * Parse a resume file and return a normalized structure:
   * {
   *   personal: { fullName, title, email, phone, location, website },
   *   summary: string,
   *   experience: [{ title, company/subtitle, startDate, endDate, bullets[] }],
   *   projects: [{ title, subtitle, startDate, endDate, bullets[] }],
   *   education: [{ school/title, degree/subtitle, startDate, endDate, location, highlights[] }],
   *   skills: [string],
   *   certifications: [string],
   *   conferences: [string],
   *   publications: [string],
   *   keywords: [string]
   * }
   * Throws an error with user-friendly message on unsupported types or failure.
   */
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  let rawText = '';

  if (file.type === 'application/pdf' || ext === 'pdf') {
    rawText = await extractPdfText(file);
  } else if (ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'doc' || file.type === 'application/msword') {
    rawText = await extractDocxTextFallback(file);
  } else if (ext === 'txt' || file.type.startsWith('text/')) {
    rawText = await extractTxt(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  }

  if (!rawText || rawText.trim().length < 20) {
    throw new Error('Could not extract text from the file. Try a text-based PDF (not a scanned image) or a TXT export.');
  }

  const sections = splitSections(rawText);
  const personal = parsePersonal(rawText);
  const summary = (sections.summary || []).join(' ').trim();
  const experience = parseExperience(sections.experience || sections['work experience'] || []);
  const projects = parseProjects(sections.projects || []);
  const education = parseEducation(sections.education || []);
  const skills = parseSkills(sections.skills || []);

  // Simple keyword guess (top distinct words excluding stopwords)
  const tokens = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\s.+#]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const stop = new Set(['the','and','a','an','to','of','in','for','with','on','at','by','as','is','are','was','were','be','been','or','from','that','this','it','i']);
  const freq = new Map();
  tokens.forEach(t => {
    if (t.length <= 2 || stop.has(t)) return;
    freq.set(t, (freq.get(t) || 0) + 1);
  });
  const keywords = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 15).map(([k]) => k);

  return {
    personal,
    summary,
    experience,
    projects,
    education,
    skills,
    certifications: [],
    conferences: [],
    publications: [],
    keywords
  };
}
