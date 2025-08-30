const ACTION_VERBS = ['led', 'built', 'delivered', 'created', 'designed', 'implemented', 'optimized', 'launched', 'improved', 'reduced', 'increased', 'developed'];
const SECTION_HEADERS = ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'conferences', 'publications'];

// PUBLIC_INTERFACE
export function computeAtsScore(data) {
  /**
   * Compute an ATS-style score based on:
   * - completeness (personal fields, presence of key sections)
   * - keyword usage (action verbs)
   * - approximate readability: short bullet lines
   */
  let score = 0;
  const feedback = [];

  // Completeness checks
  const P = data.personal || {};
  const required = ['fullName', 'email', 'phone'];
  const missing = required.filter(k => !P[k]);
  if (missing.length === 0) score += 25;
  else feedback.push(`Add missing personal info: ${missing.join(', ')}`);

  if ((data.summary || '').length > 80) score += 10;
  else feedback.push('Write a concise professional summary (80+ chars).');

  const expCount = (data.experience || []).filter(e => e.title).length;
  if (expCount > 0) score += 15; else feedback.push('Include at least one work experience.');

  const skillsCount = (data.skills || []).filter(Boolean).length;
  if (skillsCount >= 5) score += 10; else feedback.push('List 5+ relevant skills.');

  // Keywords (action verbs) presence
  const textCorpus = [
    data.summary,
    ...(data.experience || []).map(e => e.description),
    ...(data.projects || []).map(p => p.description)
  ].filter(Boolean).join(' ').toLowerCase();
  const foundVerbs = ACTION_VERBS.filter(v => textCorpus.includes(v));
  if (foundVerbs.length >= 3) score += 15;
  else feedback.push('Use more action verbs (e.g., led, built, delivered...).');

  // Section headers existence
  const presentSections = SECTION_HEADERS.filter(s => {
    if (s === 'summary') return Boolean(data.summary);
    if (s === 'experience') return (data.experience || []).some(e=>e.title);
    if (s === 'projects') return (data.projects || []).some(e=>e.title);
    if (s === 'education') return (data.education || [])[0]?.title;
    if (s === 'skills') return (data.skills || []).some(Boolean);
    if (s === 'certifications') return (data.certifications || []).some(Boolean);
    if (s === 'conferences') return (data.conferences || []).some(Boolean);
    if (s === 'publications') return (data.publications || []).some(Boolean);
    return false;
  });
  score += Math.min(20, presentSections.length * 3); // up to 20

  // Basic readability: check average bullet length (should be concise)
  const bullets = textCorpus.split('\n').filter(Boolean);
  if (bullets.length > 0) {
    const avgLen = bullets.reduce((a,b)=>a+b.length,0)/bullets.length;
    if (avgLen < 160) score += 5; else feedback.push('Make bullet points more concise.');
  } else {
    feedback.push('Add bullet points to describe achievements.');
  }

  // Normalize score to 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (!presentSections.includes('keywords') && (data.keywords || []).length === 0) {
    feedback.push('Include role-specific keywords to match job descriptions.');
  }

  return { value: score, feedback };
}
