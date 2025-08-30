import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import { useResumeStore } from './store/useResumeStore';
import { Header } from './components/Header';
import { Steps } from './components/Steps';
import { MultiStepForm } from './components/forms/MultiStepForm';
import { ResumePreview } from './components/preview/ResumePreview';
import { computeAtsScore } from './utils/atsScore';
import { exportAsPdf } from './utils/pdf';

const primary = '#2563eb';
const secondary = '#64748b';
const accent = '#10b981';

// PUBLIC_INTERFACE
function App() {
  /** App shell manages theme, layout, and connects store to preview and form. */
  const [theme, setTheme] = useState('light');
  const { data, setAtsScore, atsScore, template } = useResumeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const score = useMemo(() => computeAtsScore(data), [data]);

  useEffect(() => {
    setAtsScore(score.value, score.feedback);
  }, [score, setAtsScore]);

  const handleExport = async () => {
    await exportAsPdf('resume-preview', `Resume_${data.personal.fullName || 'My'}.pdf`);
  };

  return (
    <div className="app-root" data-theme="light">
      <Header
        theme={theme}
        setTheme={setTheme}
        colors={{ primary, secondary, accent }}
        onExport={handleExport}
      />
      <main className="main-layout">
        <section className="left-pane">
          <Steps />
          <MultiStepForm />
        </section>
        <section className="right-pane">
          <div className="ats-score">
            <div className="score-circle" style={{ borderColor: primary }}>
              <span>{atsScore.value}</span>
            </div>
            <div className="score-details">
              <h4>ATS Score</h4>
              <ul>
                {atsScore.feedback.slice(0, 4).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
          <ResumePreview id="resume-preview" data={data} template={template} colors={{ primary, secondary, accent }} />
        </section>
      </main>
      <footer className="app-footer">
        <small>© {new Date().getFullYear()} ATS Resume Builder. Optimized for modern browsers.</small>
      </footer>
    </div>
  );
}

export default App;
