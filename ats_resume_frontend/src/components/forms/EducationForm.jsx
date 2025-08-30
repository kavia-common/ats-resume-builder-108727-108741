import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';

// PUBLIC_INTERFACE
export function EducationForm() {
  /** Manage education entries. */
  const { data, setField } = useResumeStore();
  const edu = data.education?.[0] || { title:'', subtitle:'', location:'', startDate:'', endDate:'', description:'' };

  const handleChange = (field, value) => {
    const updated = { ...edu, [field]: value };
    setField('education', [updated]);
  };

  return (
    <div className="form-card">
      <div className="form-row">
        <div className="form-control">
          <label>School</label>
          <input value={edu.title} onChange={(e)=>handleChange('title', e.target.value)} placeholder="University of Somewhere" />
        </div>
        <div className="form-control">
          <label>Degree</label>
          <input value={edu.subtitle} onChange={(e)=>handleChange('subtitle', e.target.value)} placeholder="B.S. Computer Science" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-control">
          <label>Location</label>
          <input value={edu.location || ''} onChange={(e)=>handleChange('location', e.target.value)} placeholder="City, Country" />
        </div>
        <div className="form-control">
          <label>Dates</label>
          <input value={`${edu.startDate || ''} - ${edu.endDate || ''}`} onChange={()=>{}} disabled />
        </div>
      </div>
      <div className="form-row">
        <div className="form-control">
          <label>Start Date</label>
          <input value={edu.startDate} onChange={(e)=>handleChange('startDate', e.target.value)} placeholder="2016" />
        </div>
        <div className="form-control">
          <label>End Date</label>
          <input value={edu.endDate} onChange={(e)=>handleChange('endDate', e.target.value)} placeholder="2020" />
        </div>
      </div>
      <div className="form-control">
        <label>Details</label>
        <textarea value={edu.description} onChange={(e)=>handleChange('description', e.target.value)} placeholder="Graduated with honors, relevant coursework ..." />
      </div>
    </div>
  );
}
