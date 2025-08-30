import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';

// PUBLIC_INTERFACE
export function ExperienceForm() {
  /** Manage experience entries with dynamic add/remove. */
  const { data, setArrayItem, addArrayItem, removeArrayItem } = useResumeStore();

  const handleChange = (idx, field, value) => {
    const updated = { ...data.experience[idx], [field]: value };
    setArrayItem('experience', idx, updated);
  };

  return (
    <div className="form-card">
      {data.experience.map((exp, idx) => (
        <div key={idx} style={{ borderBottom: '1px dashed var(--border)', paddingBottom: 10, marginBottom: 10 }}>
          <div className="form-row">
            <div className="form-control">
              <label>Role</label>
              <input value={exp.title} onChange={(e)=>handleChange(idx,'title',e.target.value)} placeholder="Senior Engineer" />
            </div>
            <div className="form-control">
              <label>Company</label>
              <input value={exp.subtitle} onChange={(e)=>handleChange(idx,'subtitle',e.target.value)} placeholder="Acme Inc." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-control">
              <label>Start Date</label>
              <input value={exp.startDate} onChange={(e)=>handleChange(idx,'startDate',e.target.value)} placeholder="Jan 2021" />
            </div>
            <div className="form-control">
              <label>End Date</label>
              <input value={exp.endDate} onChange={(e)=>handleChange(idx,'endDate',e.target.value)} placeholder="Present" />
            </div>
          </div>
          <div className="form-control">
            <label>Highlights</label>
            <textarea value={exp.description} onChange={(e)=>handleChange(idx,'description',e.target.value)} placeholder="Led a team of 5 to deliver..."/>
          </div>
          <div className="inline-actions">
            <button className="btn" type="button" onClick={()=>removeArrayItem('experience', idx)}>Remove</button>
          </div>
        </div>
      ))}
      <button className="btn btn-primary" type="button" onClick={()=>addArrayItem('experience')}>+ Add Experience</button>
    </div>
  );
}
