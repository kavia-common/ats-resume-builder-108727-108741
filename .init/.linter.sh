#!/bin/bash
cd /home/kavia/workspace/code-generation/ats-resume-builder-108727-108741/ats_resume_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

