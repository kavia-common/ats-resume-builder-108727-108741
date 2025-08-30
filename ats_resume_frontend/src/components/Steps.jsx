import React from 'react';
import { useResumeStore } from '../store/useResumeStore';

const steps = [
  'Personal', 'Summary', 'Experience', 'Projects', 'Education', 'Skills', 'Certifications', 'Conferences', 'Publications'
];

// PUBLIC_INTERFACE
export function Steps() {
  /** Render step chips and allow navigation. */
  const { currentStep, setStep } = useResumeStore();
  return (
    <div className="steps" role="tablist" aria-label="Form steps">
      {steps.map((s, i) => (
        <button
          key={s}
          className={`step-chip ${currentStep === i ? 'active' : ''}`}
          onClick={() => setStep(i)}
          role="tab"
          aria-selected={currentStep === i}
        >
          {i + 1}. {s}
        </button>
      ))}
    </div>
  );
}
