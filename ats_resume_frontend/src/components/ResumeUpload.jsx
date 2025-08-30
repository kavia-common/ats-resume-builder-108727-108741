import React, { useRef, useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { parseResumeFile } from '../utils/resumeParser';

// PUBLIC_INTERFACE
export function ResumeUpload() {
  /** 
   * Allows users to upload a resume (PDF/DOCX/TXT). Parses file client-side and
   * maps extracted info into the Zustand store to prefill the multi-step form.
   */
  const fileInputRef = useRef(null);
  const { setField, setArrayItem, addArrayItem, data } = useResumeStore();
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const resetStatus = () => setStatus({ state: 'idle', message: '' });

  const handleClick = () => {
    resetStatus();
    fileInputRef.current?.click();
  };

  const safeSetArray = (key, items, shape = 'string') => {
    // Ensure arrays exist and set values one by one to keep helpers consistent
    const list = Array.isArray(items) ? items : [];
    if (list.length === 0) return;

    // Ensure at least one item exists
    if (!Array.isArray(data[key]) || data[key].length === 0) {
      addArrayItem(key);
    }
    // Replace first item
    setArrayItem(key, 0, shape === 'string' ? (list[0] || '') : (list[0] || {}));
    // Add the rest
    for (let i = 1; i < list.length; i++) {
      addArrayItem(key);
      setArrayItem(key, i, shape === 'string' ? (list[i] || '') : (list[i] || {}));
    }
  };

  const mapParsedToStore = (parsed) => {
    // Personal
    if (parsed.personal) {
      setField('personal', {
        fullName: parsed.personal.fullName || '',
        title: parsed.personal.title || '',
        email: parsed.personal.email || '',
        phone: parsed.personal.phone || '',
        location: parsed.personal.location || '',
        website: parsed.personal.website || ''
      });
    }
    // Summary
    if (parsed.summary !== undefined) {
      setField('summary', parsed.summary || '');
    }
    // Experience
    if (Array.isArray(parsed.experience)) {
      safeSetArray('experience', parsed.experience.map(e => ({
        title: e.title || '',
        subtitle: e.company || e.subtitle || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        description: (Array.isArray(e.bullets) ? e.bullets.join('\n') : (e.description || ''))
      })), 'object');
    }
    // Projects
    if (Array.isArray(parsed.projects)) {
      safeSetArray('projects', parsed.projects.map(p => ({
        title: p.title || '',
        subtitle: p.subtitle || p.role || '',
        startDate: p.startDate || '',
        endDate: p.endDate || '',
        description: (Array.isArray(p.bullets) ? p.bullets.join('\n') : (p.description || ''))
      })), 'object');
    }
    // Education
    if (Array.isArray(parsed.education) && parsed.education.length > 0) {
      const e = parsed.education[0] || {};
      setField('education', [{
        title: e.school || e.title || '',
        subtitle: e.degree || e.subtitle || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        description: (Array.isArray(e.highlights) ? e.highlights.join('\n') : (e.description || '')),
        location: e.location || ''
      }]);
    }
    // Skills, Certs, Conferences, Publications, Keywords
    if (Array.isArray(parsed.skills)) setField('skills', parsed.skills.length ? parsed.skills : ['']);
    if (Array.isArray(parsed.certifications)) setField('certifications', parsed.certifications.length ? parsed.certifications : ['']);
    if (Array.isArray(parsed.conferences)) setField('conferences', parsed.conferences.length ? parsed.conferences : ['']);
    if (Array.isArray(parsed.publications)) setField('publications', parsed.publications.length ? parsed.publications : ['']);
    if (Array.isArray(parsed.keywords)) setField('keywords', parsed.keywords);
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus({ state: 'parsing', message: 'Parsing resume…' });

    try {
      const parsed = await parseResumeFile(file);
      mapParsedToStore(parsed);
      setStatus({ state: 'success', message: 'Resume parsed! Review and refine the fields.' });
    } catch (err) {
      console.error(err);
      setStatus({ state: 'error', message: err?.message || 'Failed to parse file. Try a clearer PDF or paste as TXT.' });
    } finally {
      // reset input to allow uploading same file again
      e.target.value = '';
    }
  };

  return (
    <div className="inline-actions" style={{ marginBottom: 8 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      <button className="btn" type="button" onClick={handleClick}>📄 Upload Resume</button>
      {status.state === 'parsing' && <small className="text-muted">Parsing…</small>}
      {status.state === 'success' && <small style={{ color: 'var(--accent)' }}>{status.message}</small>}
      {status.state === 'error' && <small className="error">{status.message}</small>}
    </div>
  );
}
