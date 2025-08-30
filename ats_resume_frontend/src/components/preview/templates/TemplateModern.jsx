import React from 'react';

// PUBLIC_INTERFACE
export function TemplateModern({ data, colors }) {
  const P = data.personal || {};
  const barStyle = { height: 6, background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`, borderRadius: 6, marginBottom: 10 };

  return (
    <div className="resume">
      <div style={barStyle} />
      <div className="header">
        <h1 style={{ color: colors.primary }}>{P.fullName || 'Your Name'}</h1>
        <div className="meta">{[P.title, P.email, P.phone, P.location, P.website].filter(Boolean).join(' · ')}</div>
      </div>

      {data.summary && (
        <>
          <h2 style={{ color: colors.primary }}>Summary</h2>
          <p>{data.summary}</p>
        </>
      )}

      {Array.isArray(data.experience) && data.experience.filter(e=>e.title).length > 0 && (
        <>
          <h2 style={{ color: colors.primary }}>Experience</h2>
          {data.experience.map((e, i)=> e.title ? (
            <div key={i} style={{ marginBottom: 8 }}>
              <h3>{e.title} — {e.subtitle}</h3>
              <div className="meta">{[e.startDate, e.endDate].filter(Boolean).join(' - ')}</div>
              <ul>{(e.description || '').split('\n').filter(Boolean).map((b, idx)=><li key={idx}>{b}</li>)}</ul>
            </div>
          ): null)}
        </>
      )}

      {Array.isArray(data.skills) && data.skills.filter(Boolean).length > 0 && (
        <>
          <h2 style={{ color: colors.primary }}>Skills</h2>
          <p>{data.skills.filter(Boolean).join(' • ')}</p>
        </>
      )}
    </div>
  );
}
