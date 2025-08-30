import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { PersonalForm } from './PersonalForm';
import { SummaryForm } from './SummaryForm';
import { ExperienceForm } from './ExperienceForm';
import { ProjectsForm } from './ProjectsForm';
import { EducationForm } from './EducationForm';
import { ArrayListForm } from './common/ArrayListForm';

const stepComponents = [
  PersonalForm,
  SummaryForm,
  ExperienceForm,
  ProjectsForm,
  EducationForm,
  // Skills, Certifications, Conferences, Publications share same simple ArrayListForm
];

// PUBLIC_INTERFACE
export function MultiStepForm() {
  /** Render form for current step. */
  const { currentStep } = useResumeStore();
  if (currentStep <= 4) {
    const C = stepComponents[currentStep];
    return <C />;
  }
  if (currentStep === 5) return <ArrayListForm title="Skills" field="skills" placeholder="e.g. React, TypeScript, SQL" />;
  if (currentStep === 6) return <ArrayListForm title="Certifications" field="certifications" placeholder="e.g. AWS Solutions Architect" />;
  if (currentStep === 7) return <ArrayListForm title="Conferences" field="conferences" placeholder="e.g. Speaker at ReactConf 2023" />;
  return <ArrayListForm title="Publications" field="publications" placeholder="e.g. Article on Medium about ..." />;
}
