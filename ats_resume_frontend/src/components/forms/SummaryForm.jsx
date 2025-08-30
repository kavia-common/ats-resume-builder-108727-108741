import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useResumeStore } from '../../store/useResumeStore';

// PUBLIC_INTERFACE
export function SummaryForm() {
  /** Professional summary textarea with live store updates. */
  const { data, setField } = useResumeStore();
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { summary: data.summary },
    mode: 'onChange'
  });

  useEffect(() => {
    setValue('summary', data.summary || '');
  }, [data.summary, setValue]);

  const onSubmit = ({ summary }) => setField('summary', summary || '');

  return (
    <form className="form-card" onBlur={handleSubmit(onSubmit)} onSubmit={(e)=>e.preventDefault()}>
      <div className="form-control">
        <label>Professional Summary</label>
        <textarea rows={5} {...register('summary')} placeholder="Impact-driven engineer with 7+ years building scalable web platforms..."/>
      </div>
      <small className="text-muted">
        Use action verbs (led, built, delivered) and include relevant keywords for your target role.
      </small>
    </form>
  );
}
