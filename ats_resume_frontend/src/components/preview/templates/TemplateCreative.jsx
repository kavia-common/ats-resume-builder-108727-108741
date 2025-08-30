import React from 'react';

// PUBLIC_INTERFACE
export function TemplateCreative({ data, colors }) {
  const P = data.personal || {};
  const Section = ({ title, children }) => (
    <div style={{ borderLeft: `4px solid ${colors.accent}`, paddingLeft: 10, marginBottom: 10 }}>
      <h2 style={{ margin: '0 0 6px 0', color: colors.accent }}>{title}</h2>
      <div>{children}</div>
    </div>
  );
  return (
    <div className="resume">
      <div className="header" style={{ borderBottomColor: colors.accent }}>
        <h1 style={{ color: colors.accent }}>{P.fullName || 'Your Name'}</h1>
        <div className="meta">{[P.title, P.email, P.phone, P.location].filter(Boolean).join(' · ')}</div>
      </div>
      {data.summary && <Section title="About">{data.summary}</Section>}
      {Array.isArray(data.projects) && data.projects.filter(p=>p.title).length > 0 && (
        <Section title="Projects">
          {data.projects.map((p,i)=> p.title ? (
            <div key={i} style={{ marginBottom: 8 }}>
              <h3>{p.title} — {p.subtitle}</h3>
              <div className="meta">{[p.startDate, p.endDate].filter(Boolean).join(' - ')}</div>
              <p>{p.description}</p>
            </div>
          ) : null)}
        </Section>
      )}
      {Array.isArray(data.skills) && data.skills.filter(Boolean).length > 0 && (
        <Section title="Toolkit">
          <p>{data.skills.filter(Boolean).join(' • ')}</p>
        </Section>
      )}
    </div>
  );
}
