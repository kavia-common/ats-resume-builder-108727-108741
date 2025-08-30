import React from 'react';
import { useResumeStore } from '../../../store/useResumeStore';

// PUBLIC_INTERFACE
export function ArrayListForm({ title, field, placeholder }) {
  /** Generic list editor for simple string arrays. */
  const { data, setArrayItem, addArrayItem, removeArrayItem } = useResumeStore();
  const list = data[field] || [];

  const handleChange = (i, value) => setArrayItem(field, i, value);

  return (
    <div className="form-card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {list.map((v, i) => (
        <div className="form-row" key={i}>
          <div className="form-control" style={{ gridColumn: '1 / -1' }}>
            <input value={v} onChange={(e)=>handleChange(i, e.target.value)} placeholder={placeholder} />
            <div className="inline-actions">
              <button className="btn" type="button" onClick={()=>removeArrayItem(field, i)}>Remove</button>
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-primary" type="button" onClick={()=>addArrayItem(field)}>+ Add {title.slice(0,-1)}</button>
    </div>
  );
}
