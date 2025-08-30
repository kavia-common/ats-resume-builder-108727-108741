import React from 'react';

// PUBLIC_INTERFACE
export function TemplateCorporate({ data, colors }) {
  const P = data.personal || {};
  return (
    <div className="resume">
      <div className="header">
        <h1>{P.fullName || 'Your Name'}</h1>
        <div className="meta">{[P.email, P.phone, P.location, P.website].filter(Boolean).join(' | ')}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          {data.summary && (
            <>
              <h2 style={{ color: colors.secondary }}>Profile</h2>
              <p>{data.summary}</p>
            </>
          )}
          {Array.isArray(data.experience) && data.experience.filter(e=>e.title).length > 0 && (
            <>
              <h2 style={{ color: colors.secondary }}>Experience</h2>
              {data.experience.map((e, i)=> e.title ? (
                <div key={i} style={{ marginBottom: 8 }}>
                  <h3>{e.title} — {e.subtitle}</h3>
                  <div className="meta">{[e.startDate, e.endDate].filter(Boolean).join(' - ')}</div>
                  <ul>{(e.description || '').split('\n').filter(Boolean).map((b, idx)=><li key={idx}>{b}</li>)}</ul>
                </div>
              ) : null)}
            </>
          )}
        </div>
        <div>
          {Array.isArray(data.skills) && data.skills.filter(Boolean).length > 0 && (
            <>
              <h2 style={{ color: colors.secondary }}>Skills</h2>
              <ul>{data.skills.filter(Boolean).map((s,i)=><li key={i}>{s}</li>)}</ul>
            </>
          )}
          {Array.isArray(data.certifications) && data.certifications.filter(Boolean).length > 0 && (
            <>
              <h2 style={{ color: colors.secondary }}>Certifications</h2>
              <ul>{data.certifications.filter(Boolean).map((s,i)=><li key={i}>{s}</li>)}</ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
