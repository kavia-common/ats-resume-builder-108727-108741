import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useResumeStore } from '../../store/useResumeStore';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  title: z.string().optional(),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Phone is required'),
  location: z.string().optional(),
  website: z.string().url('Invalid URL').or(z.literal('')).optional()
});

// PUBLIC_INTERFACE
export function PersonalForm() {
  /** Collect personal information with validation. */
  const { data, setField } = useResumeStore();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: data.personal,
    mode: 'onChange'
  });

  useEffect(() => {
    // Keep form in sync if store updates externally
    Object.entries(data.personal).forEach(([k, v]) => setValue(k, v));
  }, [data.personal, setValue]);

  const onSubmit = (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    setField('personal', parsed.data);
  };

  return (
    <form className="form-card" onBlur={handleSubmit(onSubmit)} onSubmit={(e)=>e.preventDefault()}>
      <div className="form-row">
        <div className="form-control">
          <label>Full Name</label>
          <input {...register('fullName', { required: 'Full name is required' })} placeholder="Jane Doe" />
          {errors.fullName && <span className="error">{errors.fullName.message}</span>}
        </div>
        <div className="form-control">
          <label>Title</label>
          <input {...register('title')} placeholder="Senior Software Engineer" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-control">
          <label>Email</label>
          <input {...register('email', { required: 'Email is required' })} placeholder="jane@example.com" />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>
        <div className="form-control">
          <label>Phone</label>
          <input {...register('phone', { required: 'Phone is required' })} placeholder="+1 555 555 5555" />
          {errors.phone && <span className="error">{errors.phone.message}</span>}
        </div>
      </div>
      <div className="form-row">
        <div className="form-control">
          <label>Location</label>
          <input {...register('location')} placeholder="San Francisco, CA" />
        </div>
        <div className="form-control">
          <label>Website</label>
          <input {...register('website')} placeholder="https://janedoe.dev" />
          {errors.website && <span className="error">{errors.website.message}</span>}
        </div>
      </div>
      <div className="inline-actions">
        <small className="text-muted">Changes are saved automatically.</small>
      </div>
    </form>
  );
}
