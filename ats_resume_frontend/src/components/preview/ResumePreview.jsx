import React from 'react';
import { TemplateMinimalist } from './templates/TemplateMinimalist';
import { TemplateModern } from './templates/TemplateModern';
import { TemplateCorporate } from './templates/TemplateCorporate';
import { TemplateCreative } from './templates/TemplateCreative';

// PUBLIC_INTERFACE
export function ResumePreview({ id, data, template, colors }) {
  /** Live resume preview. Switches templates based on user selection. */
  return (
    <div className="preview-wrapper">
      <div className="preview-inner" id={id}>
        {template === 'minimalist' && <TemplateMinimalist data={data} colors={colors} />}
        {template === 'modern' && <TemplateModern data={data} colors={colors} />}
        {template === 'corporate' && <TemplateCorporate data={data} colors={colors} />}
        {template === 'creative' && <TemplateCreative data={data} colors={colors} />}
      </div>
    </div>
  );
}
