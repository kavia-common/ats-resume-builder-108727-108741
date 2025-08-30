import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js';
import mammoth from 'mammoth';

/**
 * Enhanced client-side parsing utilities:
 * - PDF: pdfjs-dist text extraction
 * - DOCX: mammoth to extract raw text (robust for most .docx resumes)
 * - TXT: plain text
 * Heuristic parsing to extract personal info, sections, and bullets with international heading variants,
 * flexible bullet/separator recognition, and minimal language detection to guide parsing.
 */

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Regex helpers: broaden to recognize more phone, url, and bullet variants
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(?:(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4})/;
const URL_RE = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/i;

// Common decorative separators to strip in headings
const DECOR_SEP = /^[\s•·●▪︎▹▸▶►▻◆■□▪︎◦➤➣➔➜→\-–—_=~•.*#]+\s*|\s*[\s•·●▪︎▹▸▶►▻◆■□▪︎◦➤➣➔➜→\-–—_=~•.*#]+$/g;

// Expanded bullet starters incl. numbers and parenthesis styles
const BULLET_START_RE = /^(\(?\d{1,2}\)|\d{1,2}[.)-]|[-–—•·●▪︎▹▸▶►▻◆■□▪︎◦➤➣➔➜→*]+)\s+/;

// Date range separators
const DATE_SEP_RE = /\s(?:-|–|—|to|hasta|à|al|até|fino a)\s/i;

// Minimal language detection via heading and stopword hints
function detectLanguageHints(text) {
  const s = text.toLowerCase();
  const signals = {
    en: ['summary', 'experience', 'education', 'skills', 'projects'],
    es: ['resumen', 'experiencia', 'educación', 'habilidades', 'proyectos'],
    fr: ['profil', 'résumé', 'expérience', 'formation', 'compétences', 'projets'],
    de: ['zusammenfassung', 'erfahrung', 'bildung', 'kenntnisse', 'projekte'],
    pt: ['resumo', 'experiência', 'formação', 'habilidades', 'projetos'],
    it: ['profilo', 'esperienza', 'istruzione', 'competenze', 'progetti'],
    nl: ['profiel', 'ervaring', 'opleiding', 'vaardigheden', 'projecten'],
    pl: ['podsumowanie', 'doświadczenie', 'wykształcenie', 'umiejętności', 'projekty']
  };
  const scores = Object.fromEntries(Object.keys(signals).map(k => [k, 0]));
  Object.entries(signals).forEach(([lang, keys]) => {
    keys.forEach(k => { if (s.includes(k)) scores[lang] += 1; });
  });
  const best = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
  return (best && best[1] > 0) ? best[0] : 'en';
}

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
    // Join with spaces to preserve word ordering; add newline per page
    fullText += strings.join(' ') + '\n';
  }
  return fullText;
}

async function extractDocxText(file) {
  const arrayBuffer = await readAsArrayBuffer(file);
  try {
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return (value || '').replace(/\r/g, '');
  } catch (e) {
    try {
      const txt = await readAsText(file);
      if (typeof txt === 'string' && txt.trim().length > 0) return txt;
    } catch (_) { /* ignore */ }
    throw new Error('Failed to parse DOCX. Please try exporting your resume as a text-based PDF or TXT.');
  }
}

async function extractTxt(file) {
  return readAsText(file);
}

// Build a multilingual heading map and robust detector
function buildHeadingDictionary() {
  const map = new Map();

  const add = (canonical, variants) => {
    variants.forEach(v => map.set(v, canonical));
  };

  add('summary', [
    'summary','professional summary','profile','objective',
    'about','about me',
    // es/fr/de/pt/it/nl/pl
    'resumen','perfil','objetivo','acerca de',
    'résumé','profil','objectif','à propos',
    'zusammenfassung','profil','ziel',
    'resumo','perfil','objetivo',
    'profilo','obiettivo','riassunto',
    'profiel','samenvatting','doel',
    'podsumowanie','profil','cel'
  ]);

  add('experience', [
    'experience','work experience','employment','professional experience',
    'experiencia','experiencia laboral','empleo',
    'expérience','expérience professionnelle','emploi',
    'erfahrung','berufserfahrung','beschäftigung',
    'experiência','experiência profissional','emprego',
    'esperienza','esperienza professionale','impiego',
    'ervaring','werkervaring',
    'doświadczenie','doświadczenie zawodowe'
  ]);

  add('projects', [
    'projects','selected projects','side projects',
    'proyectos','projetos','projets','progetti','projecten','projekty'
  ]);

  add('education', [
    'education','academic background','academics',
    'educación','formación académica','estudios',
    'formation','éducation','parcours académique',
    'bildung','ausbildung','studium',
    'formação','educação','escolaridade',
    'istruzione','formazione','percorso accademico',
    'opleiding','onderwijs',
    'wykształcenie','edukacja'
  ]);

  add('skills', [
    'skills','technical skills','toolkit','competencies','competences',
    'habilidades','competencias','aptitudes',
    'compétences','compétences techniques',
    'kenntnisse','fähigkeiten',
    'habilidades técnicas','competências',
    'competenze','competenze tecniche',
    'vaardigheden','technische vaardigheden',
    'umiejętności','kompetencje'
  ]);

  add('certifications', [
    'certifications','certification','licenses','licences',
    'certificaciones','certificación','licencias',
    'certifications','certification','licences',
    'zertifizierungen','zertifizierung',
    'certificações','certificação',
    'certificazioni','certificazione',
    'certificaten','licenties',
    'certyfikaty','certyfikacja'
  ]);

  add('conferences', [
    'conferences','talks','presentations',
    'conferencias','charlas','ponencias',
    'conférences','présentations',
    'konferenzen','vorträge',
    'conferências','palestras',
    'conferenze','interventi',
    'conferenties','lezingen',
    'konferencje','wystąpienia'
  ]);

  add('publications', [
    'publications','articles','papers',
    'publicaciones','artículos',
    'publications','articles',
    'veröffentlichungen','artikel',
    'publicações','artigos',
    'pubblicazioni','articoli',
    'publicaties','artikelen',
    'publikacje','artykuły'
  ]);

  add('awards', [
    'awards','achievements','honors','honours',
    'premios','logros',
    'récompenses','distinctions',
    'auszeichnungen','erfolge',
    'prêmios','conquistas',
    'premi','riconoscimenti',
    'prijzen','onderscheidingen',
    'nagrody','osiągnięcia'
  ]);

  return map;
}

const HEADING_DICT = buildHeadingDictionary();

function normalizeHeading(line) {
  const cleaned = line.replace(DECOR_SEP, '').trim();
  const lower = cleaned.toLowerCase();
  // Allow headings like "Experience:", "Experience —", "Experience |"
  const stripped = lower.replace(/\s*[:|\-–—]*\s*$/, '');
  const canonical = HEADING_DICT.get(stripped);
  if (canonical) return canonical;

  // ALL CAPS heuristic
  const isAllCaps = /^[A-Z\s&/+-]{3,}$/.test(cleaned) && cleaned.length < 48;
  if (isAllCaps) {
    // map major categories by keywords
    if (/experience|employment|professional/i.test(cleaned)) return 'experience';
    if (/education|academic|bildung|formation|formação|istruzione|opleiding|wykształcenie/i.test(cleaned)) return 'education';
    if (/project/i.test(cleaned)) return 'projects';
    if (/skill|competenc/i.test(cleaned)) return 'skills';
    if (/summary|profile|objective|profil/i.test(cleaned)) return 'summary';
    if (/certif|licen/i.test(cleaned)) return 'certifications';
    if (/conference|talk|présent|vortr|palestr|lezing|konferen/i.test(cleaned)) return 'conferences';
    if (/publication|article|paper|veröffent/i.test(cleaned)) return 'publications';
    if (/award|achievement|honou|prem|prix|auszeich/i.test(cleaned)) return 'awards';
  }
  return null;
}

function splitSections(text) {
  const normalized = text.replace(/\r/g, '');
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  const sections = {};
  let current = 'header';
  sections[current] = [];

  for (const raw of lines) {
    const line = raw.replace(DECOR_SEP, '').trim();
    const head = normalizeHeading(line);
    if (head) {
      current = head;
      if (!sections[current]) sections[current] = [];
      continue;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
  }
  return sections;
}

function guessTitleFromHeader(headerLines) {
  // Look for common title separators near name line
  const text = headerLines.join(' • ').slice(0, 200);
  // Patterns like "Name — Title", "Name | Title"
  const m = text.match(/^[^•|—\-–—]+(?:[•|—\-–—]\s*)(.+)$/);
  if (m) {
    const t = (m[1] || '').split(/[,|•]/)[0].trim();
    if (t && !EMAIL_RE.test(t) && !PHONE_RE.test(t)) return t;
  }
  return '';
}

function parsePersonal(text, sections) {
  const firstNonEmpty = text.split('\n').map(s => s.trim()).find(Boolean) || '';
  const headerLines = (sections.header || []).slice(0, 5);
  const fullName = firstNonEmpty.length < 80 ? firstNonEmpty.replace(/[|•·]+/g, ' ').trim() : '';
  const email = (text.match(EMAIL_RE) || [])[0] || '';
  const phone = (text.match(PHONE_RE) || [])[0] || '';
  const website = (text.match(URL_RE) || [])[0] || '';
  const title = guessTitleFromHeader(headerLines);
  // naive location extraction: look for "City, ST" or "City, Country" near header
  const locationMatch = headerLines.join(' | ').match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*,\s*([A-Z]{2,}|[A-Z][a-z]+)\b/);
  const location = locationMatch ? locationMatch[0] : '';
  return { fullName, email, phone, website, location, title };
}

function bulletsFrom(lines) {
  const bullets = [];
  lines.forEach(line => {
    const m = line.match(BULLET_START_RE);
    if (m) {
      bullets.push(line.replace(BULLET_START_RE, '').trim());
    }
  });
  // If no explicit bullets, split by semicolons or sentences as fallback
  if (bullets.length === 0) {
    const joined = lines.join(' ');
    joined
      .split(/(?<=\.|\!|\?)\s+|;\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .forEach(s => bullets.push(s));
  }
  // De-duplicate and trim tiny fragments
  const dedup = Array.from(new Set(bullets.map(b => b.replace(/\s+/g, ' ').trim()))).filter(b => b.length > 2);
  return dedup;
}

function extractDates(line) {
  // Look for years or Month Year—Month Year patterns in multiple languages
  const yearRange = line.match(/\b(19|20)\d{2}\b.*?(19|20)\d{2}\b/);
  if (yearRange) {
    const parts = line.split(DATE_SEP_RE);
    if (parts.length >= 2) return [parts[0].trim(), parts[1].trim()];
  }
  const singleYears = line.match(/\b(19|20)\d{2}\b/g) || [];
  if (singleYears.length >= 2) return [singleYears[0], singleYears[1]];
  if (singleYears.length === 1) return [singleYears[0], ''];
  return ['', ''];
}

function splitTitleCompany(header) {
  // Support various separators: —, -, |, •, ·, •, colon
  const parts = header.split(/\s[—–—\-|•·:]\s/);
  if (parts.length >= 2) return [parts[0].trim(), parts.slice(1).join(' - ').trim()];
  // Fallback: try comma
  const p2 = header.split(/\s*,\s*/);
  if (p2.length >= 2) return [p2[0].trim(), p2.slice(1).join(', ').trim()];
  return [header.trim(), ''];
}

function parseExperience(lines) {
  const items = [];
  let block = [];

  const flush = () => {
    if (block.length === 0) return;
    const header = block[0] || '';
    const [titlePart, companyPart] = splitTitleCompany(header);
    const dateLine = block.find(l => /(19|20)\d{2}/.test(l)) || '';
    const [startDate, endDate] = extractDates(dateLine);
    const descLines = block.slice(1);
    const bullets = bulletsFrom(descLines);
    items.push({
      title: (titlePart || '').trim(),
      subtitle: (companyPart || '').trim(),
      company: (companyPart || '').trim(),
      startDate: startDate || '',
      endDate: endDate || '',
      bullets
    });
    block = [];
  };

  lines.forEach((l) => {
    if (/^\s*$/.test(l)) return;
    // new block heuristics: heading-ish line or a date line or bullet after some content
    if (block.length === 0) {
      block.push(l);
    } else if (/(19|20)\d{2}/.test(l) && block.length <= 2) {
      block.push(l);
    } else if (BULLET_START_RE.test(l)) {
      block.push(l);
      if (block.length >= 9) flush();
    } else if (/^[A-Z].{0,80}$/.test(l) && !BULLET_START_RE.test(l) && !/(19|20)\d{2}/.test(l)) {
      // likely a new role header
      flush();
      block.push(l);
    } else {
      block.push(l);
    }
  });
  flush();
  return items.filter(it => (it.title || it.company || (it.bullets && it.bullets.length)));
}

function parseEducation(lines) {
  if (!lines || lines.length === 0) return [];
  const items = [];
  let block = [];

  const flush = () => {
    if (!block.length) return;
    const header = block[0] || '';
    const [school, degree] = splitTitleCompany(header);
    const dateLine = block.find(l => /(19|20)\d{2}/.test(l)) || '';
    const [startDate, endDate] = extractDates(dateLine);
    const highlights = bulletsFrom(block.slice(1));
    items.push({
      school: school || '',
      degree: degree || '',
      startDate: startDate || '',
      endDate: endDate || startDate || '',
      location: '',
      highlights
    });
    block = [];
  };

  lines.forEach(l => {
    if (/^\s*$/.test(l)) return;
    block.push(l);
    if (block.length >= 6) flush();
  });
  flush();

  // If still no structured entries, fallback to a single inferred item
  if (items.length === 0) {
    const joined = lines.join(' ');
    const years = joined.match(/\b(19|20)\d{2}\b/g) || [];
    const startDate = years[0] || '';
    const endDate = years[1] || startDate || '';
    const first = lines[0] || '';
    const second = lines[1] || '';
    const [school, degree] = splitTitleCompany(first.includes('—') ? first : `${first} — ${second}`);
    items.push({ school, degree, startDate, endDate, location: '', highlights: bulletsFrom(lines.slice(2)) });
  }
  return items;
}

function parseSkills(lines) {
  const joined = lines.join(' ');
  // Recognize common separators and bullet prefixes
  return joined
    .split(/\s*[|,;•·●\-]\s+|\n+/)
    .map(s => s.replace(BULLET_START_RE, '').trim())
    .filter(Boolean);
}

function parseProjects(lines) {
  if (!lines || lines.length === 0) return [];
  const items = [];
  let block = [];

  const flush = () => {
    if (block.length === 0) return;
    const header = block[0] || '';
    const [title, subtitle] = splitTitleCompany(header);
    const dateLine = block.find(l => /(19|20)\d{2}/.test(l)) || '';
    const [startDate, endDate] = extractDates(dateLine);
    items.push({
      title: title || '',
      subtitle: subtitle || '',
      startDate: startDate || '',
      endDate: endDate || '',
      bullets: bulletsFrom(block.slice(1))
    });
    block = [];
  };

  lines.forEach(l => {
    if (/^\s*$/.test(l)) return;
    block.push(l);
    if (block.length >= 8) flush();
  });
  flush();
  return items.filter(it => it.title || (it.bullets && it.bullets.length));
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
   *   keywords: [string],
   *   language: 'en' | 'es' | 'fr' | ...
   * }
   * Throws an error with user-friendly message on unsupported types or failure.
   */
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  let rawText = '';

  if (file.type === 'application/pdf' || ext === 'pdf') {
    rawText = await extractPdfText(file);
  } else if (ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    rawText = await extractDocxText(file);
  } else if (ext === 'doc' || file.type === 'application/msword') {
    throw new Error('Legacy .doc files are not supported. Please convert to .docx, PDF, or TXT and try again.');
  } else if (ext === 'txt' || (file.type && file.type.startsWith('text/'))) {
    rawText = await extractTxt(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  }

  if (!rawText || rawText.trim().length < 20) {
    throw new Error('Could not extract text from the file. If uploading a scanned PDF, try OCR or use a DOCX/TXT.');
  }

  const language = detectLanguageHints(rawText);
  const sections = splitSections(rawText);
  const personal = parsePersonal(rawText, sections);

  // Pull summary but allow first paragraph if no explicit section
  let summary = (sections.summary || []).join(' ').trim();
  if (!summary && (sections.header || []).length) {
    const headerTail = sections.header.slice(1, 6).join(' ').trim();
    if (headerTail.length > 40) summary = headerTail.slice(0, 600);
  }

  const experience = parseExperience(sections.experience || sections['work experience'] || []);
  const projects = parseProjects(sections.projects || []);
  const education = parseEducation(sections.education || []);
  const skills = parseSkills(sections.skills || []);

  // Try to map certifications/conferences/publications if detected
  const certifications = (sections.certifications || []).map(s => s.replace(BULLET_START_RE, '').trim()).filter(Boolean);
  const conferences = (sections.conferences || []).map(s => s.replace(BULLET_START_RE, '').trim()).filter(Boolean);
  const publications = (sections.publications || []).map(s => s.replace(BULLET_START_RE, '').trim()).filter(Boolean);

  // Simple keyword guess (top distinct words excluding stopwords)
  const tokens = rawText
    .toLowerCase()
    .replace(/[^a-z0-9À-ſ\s.+#]/g, ' ') // include basic Latin-1 accents
    .split(/\s+/)
    .filter(Boolean);

  // Basic multilingual stopwords
  const stop = new Set([
    'the','and','a','an','to','of','in','for','with','on','at','by','as','is','are','was','were','be','been','or','from','that','this','it','i',
    // es
    'el','la','los','las','y','o','de','del','en','para','con','por','como','es','son','fue','fueron','ser','ha','han','yo','un','una',
    // fr
    'le','la','les','et','ou','de','du','des','en','pour','avec','par','comme','est','sont','été','être','je','un','une',
    // de
    'der','die','das','und','oder','von','im','in','für','mit','auf','als','ist','sind','war','waren','sein','ich','ein','eine',
    // pt
    'o','a','os','as','e','ou','de','do','da','em','para','com','por','como','é','são','foi','foram','ser','eu','um','uma',
    // it
    'il','la','i','gli','le','e','o','di','del','della','in','per','con','da','come','è','sono','ero','siamo','essere','io','un','una',
    // nl
    'de','het','een','en','of','van','in','voor','met','op','als','is','zijn','was','waren','ik',
    // pl
    'i','oraz','albo','lub','w','na','z','do','dla','przy','jak','jest','są','był','była','było','byli','być','ja'
  ]);

  const freq = new Map();
  tokens.forEach(t => {
    if (t.length <= 2 || stop.has(t)) return;
    freq.set(t, (freq.get(t) || 0) + 1);
  });
  const keywords = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 20).map(([k]) => k);

  return {
    personal,
    summary,
    experience,
    projects,
    education,
    skills,
    certifications,
    conferences,
    publications,
    keywords,
    language
  };
}
