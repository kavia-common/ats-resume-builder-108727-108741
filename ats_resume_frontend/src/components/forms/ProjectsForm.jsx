import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';

// PUBLIC_INTERFACE
export function ProjectsForm() {
  /** Manage project entries. */
  const { data, setArrayItem, addArrayItem, removeArrayItem } = useResumeStore();

  const handleChange = (idx, field, value) => {
    const updated = { ...data.projects[idx], [field]: value };
    setArrayItem('projects', idx, updated);
  };

  return (
    <div className="form-card">
      {data.projects.map((p, idx) => (
        <div key={idx} style={{ borderBottom: '1px dashed var(--border)', paddingBottom: 10, marginBottom: 10 }}>
          <div className="form-row">
            <div className="form-control">
              <label>Project</label>
              <input value={p.title} onChange={(e)=>handleChange(idx,'title',e.target.value)} placeholder="Internal Platform Revamp" />
            </div>
            <div className="form-control">
              <label>Role/Tech</label>
              <input value={p.subtitle} onChange={(e)=>handleChange(idx,'subtitle',e.target.value)} placeholder="Lead | React, Node, AWS" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-control">
              <label>Start Date</label>
              <input value={p.startDate} onChange={(e)=>handleChange(idx,'startDate',e.target.value)} placeholder="2022" />
            </div>
            <div className="form-control">
              <label>End Date</label>
              <input value={p.endDate} onChange={(e)=>handleChange(idx,'endDate',e.target.value)} placeholder="2023" />
            </div>
          </div>
          <div className="form-control">
            <label>Highlights</label>
            <textarea value={p.description} onChange={(e)=>handleChange(idx,'description',e.target.value)} placeholder="Built a modular system that ..."/>
          </div>
          <div className="inline-actions">
            <button className="btn" type="button" onClick={()=>removeArrayItem('projects', idx)}>Remove</button>
          </div>
        </div>
      ))}
      <button className="btn btn-primary" type="button" onClick={()=>addArrayItem('projects')}>+ Add Project</button>
    </div>
  );
}
