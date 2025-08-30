import React, { useRef, useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { parseResumeFile } from '../utils/resumeParser';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js';
import { ocrImageBlobToText } from '../utils/ocr';

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

  // Helper: render PDF to canvases and OCR them page by page
  const ocrPdfFile = async (file) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    const arrayBuffer = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsArrayBuffer(file);
    });

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // higher scale for better OCR
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = { canvasContext: context, viewport };
      await page.render(renderContext).promise;

      // Convert canvas to Blob then OCR
      const pageText = await new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          try {
            const text = await ocrImageBlobToText(blob, 'eng');
            resolve(text);
          } catch (err) {
            reject(err);
          }
        }, 'image/png', 0.95);
      });

      fullText += (pageText || '') + '\n';
    }
    return fullText.trim();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus({ state: 'parsing', message: 'Parsing resume…' });

    try {
      // First attempt: normal structured parsing
      let parsed;
      try {
        parsed = await parseResumeFile(file);
      } catch (primaryErr) {
        // If PDF or image, optionally offer OCR
        const isPdf = file.type === 'application/pdf' || (file.name || '').toLowerCase().endsWith('.pdf');
        const isImage = (file.type || '').startsWith('image/');
        const primaryMsg = primaryErr?.message || '';
        const likelyNoText = primaryMsg.toLowerCase().includes('could not extract text') || primaryMsg.toLowerCase().includes('scanned');

        if ((isPdf || isImage) && likelyNoText) {
          const confirmOcr = window.confirm('It looks like this file has no selectable text (possibly scanned). Run OCR to extract text? This may take a moment.');
          if (confirmOcr) {
            setStatus({ state: 'parsing', message: 'Running OCR…' });
            let ocrText = '';
            if (isPdf) {
              ocrText = await ocrPdfFile(file);
            } else if (isImage) {
              ocrText = await ocrImageBlobToText(file, 'eng');
            }

            if (!ocrText || ocrText.trim().length < 10) {
              throw new Error('OCR could not recognize enough text. Please try a clearer scan or a DOCX/TXT file.');
            }

            // Feed OCR text to a minimal parsed structure and reuse mapping
            parsed = {
              personal: {}, // will be inferred by map if any
              summary: ocrText.split('\n').slice(0, 10).join(' ').slice(0, 1000), // a short start as summary
              experience: [],
              projects: [],
              education: [],
              skills: [],
              certifications: [],
              conferences: [],
              publications: [],
              keywords: []
            };
          } else {
            throw primaryErr;
          }
        } else {
          // Non-PDF/image or different error
          throw primaryErr;
        }
      }

      // Map to store
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
      {status.state === 'error' && <small className="error">{status.message} (PDF/DOCX/TXT supported)</small>}
    </div>
  );
}
