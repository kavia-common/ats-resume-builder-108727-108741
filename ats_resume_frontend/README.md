# ATS Resume Builder (Frontend)

Modern, lightweight React app to craft ATS-friendly resumes with live preview, ATS scoring, and PDF export.

## Features
- Multi-step forms: Personal, Summary, Experience, Projects, Education, Skills, Certifications, Conferences, Publications
- Real-time validation: react-hook-form + zod (personal form uses validation rules)
- ATS optimization: suggestions and scoring based on completeness, action verbs, keywords, readability
- Template selection: Minimalist, Modern, Corporate, Creative
- Live preview synced with form data
- PDF export: html2canvas + jsPDF
- State management with zustand
- Responsive, modern, light-themed UI

## Getting Started
- npm install
- npm start
- Open http://localhost:3000

## Usage
- Fill details in the left pane; watch live preview on the right
- Switch templates from the header
- Export as PDF with the Export button

## Tech
- React 18, Zustand, react-hook-form, zod, html2canvas, jsPDF

## Notes
- Environment variables: none required for frontend
- All data is kept in memory only (no backend)

