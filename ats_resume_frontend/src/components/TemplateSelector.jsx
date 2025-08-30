import React from 'react';
import { useResumeStore } from '../store/useResumeStore';

const templates = ['minimalist', 'modern', 'corporate', 'creative'];

// PUBLIC_INTERFACE
export function TemplateSelector() {
  /** Simple template toggle buttons. */
  const { template, setTemplate } = useResumeStore();
  return (
    <div className="template-select" aria-label="Template selection">
      {templates.map(t => (
        <button
          key={t}
          className={`template-option ${template === t ? 'active' : ''}`}
          onClick={() => setTemplate(t)}
        >
          {t[0].toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}
