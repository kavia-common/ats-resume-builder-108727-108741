import React from 'react';

// PUBLIC_INTERFACE
export function TemplateMinimalist({ data, colors }) {
  /** Clean, spacing-focused template with subtle section headers. */
  const P = data.personal || {};
  const Section = ({ title, children }) => (
    <>
      <h2 style={{ color: '#64748b', textTransform: 'uppercase' }}>{title}</h2>
      <div>{children}</div>
    </>
  );

  return (
    <div className="resume" style={{ borderTop: `4px solid ${colors.primary}`, paddingTop: 8 }}>
      <div className="header">
        <h1>{P.fullName || 'Your Name'}</h1>
        <div className="meta">
          {[P.title, P.email, P.phone, P.location, P.website].filter(Boolean).join(' · ')}
        </div>
      </div>

      {data.summary && (
        <Section title="Summary">
          <p style={{ marginTop: 0 }}>{data.summary}</p>
        </Section>
      )}

      {Array.isArray(data.experience) && data.experience.filter(e=>e.title).length > 0 && (
        <Section title="Experience">
          {data.experience.map((e, i) => e.title ? (
            <div key={i} style={{ marginBottom: 8 }}>
              <h3>{e.title} — {e.subtitle}</h3>
              <div className="meta">{[e.startDate, e.endDate].filter(Boolean).join(' - ')}</div>
              <ul>{(e.description || '').split('\n').filter(Boolean).map((b, idx)=><li key={idx}>{b}</li>)}</ul>
            </div>
          ) : null)}
        </Section>
      )}

      {Array.isArray(data.projects) && data.projects.filter(p=>p.title).length > 0 && (
        <Section title="Projects">
          {data.projects.map((p, i) => p.title ? (
            <div key={i} style={{ marginBottom: 8 }}>
              <h3>{p.title} — {p.subtitle}</h3>
              <div className="meta">{[p.startDate, p.endDate].filter(Boolean).join(' - ')}</div>
              <ul>{(p.description || '').split('\n').filter(Boolean).map((b, idx)=><li key={idx}>{b}</li>)}</ul>
            </div>
          ) : null)}
        </Section>
      )}

      {Array.isArray(data.education) && data.education[0]?.title && (
        <Section title="Education">
          <div>
            <h3>{data.education[0].title} — {data.education[0].subtitle}</h3>
            <div className="meta">{[data.education[0].startDate, data.education[0].endDate].filter(Boolean).join(' - ')}</div>
            <p>{data.education[0].description}</p>
          </div>
        </Section>
      )}

      {Array.isArray(data.skills) && data.skills.filter(Boolean).length > 0 && (
        <Section title="Skills">
          <p>{data.skills.filter(Boolean).join(' • ')}</p>
        </Section>
      )}

      {Array.isArray(data.certifications) && data.certifications.filter(Boolean).length > 0 && (
        <Section title="Certifications">
          <ul>{data.certifications.filter(Boolean).map((c,i)=><li key={i}>{c}</li>)}</ul>
        </Section>
      )}

      {Array.isArray(data.conferences) && data.conferences.filter(Boolean).length > 0 && (
        <Section title="Conferences">
          <ul>{data.conferences.filter(Boolean).map((c,i)=><li key={i}>{c}</li>)}</ul>
        </Section>
      )}

      {Array.isArray(data.publications) && data.publications.filter(Boolean).length > 0 && (
        <Section title="Publications">
          <ul>{data.publications.filter(Boolean).map((c,i)=><li key={i}>{c}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}
