import React from 'react';
import { TemplateSelector } from './TemplateSelector';

// PUBLIC_INTERFACE
export function Header({ theme, setTheme, colors, onExport }) {
  /** App header with brand, template selector, theme toggle and export action. */
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand" style={{ color: colors.primary }}>
          <span className="dot" />
          <span>ATS Resume Builder</span>
        </div>
        <TemplateSelector />
        <div className="controls">
          <button className="btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button className="btn btn-accent" onClick={onExport}>⬇️ Export PDF</button>
        </div>
      </div>
    </header>
  );
}
