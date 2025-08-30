import { create } from 'zustand';

const emptyItem = () => ({ title: '', subtitle: '', startDate: '', endDate: '', description: '' });

// PUBLIC_INTERFACE
export const useResumeStore = create((set) => ({
  /** Global resume data state used across forms and preview. */
  data: {
    personal: { fullName: '', title: '', email: '', phone: '', location: '', website: '' },
    summary: '',
    experience: [emptyItem()],
    projects: [emptyItem()],
    education: [{ title: '', subtitle: '', startDate: '', endDate: '', description: '', location: '' }],
    skills: [''],
    certifications: [''],
    conferences: [''],
    publications: [''],
    keywords: []
  },
  currentStep: 0,
  template: 'minimalist',
  atsScore: { value: 0, feedback: [] },

  // PUBLIC_INTERFACE
  setField: (path, value) => set((state) => {
    const newData = JSON.parse(JSON.stringify(state.data));
    const segs = Array.isArray(path) ? path : path.split('.');
    let cur = newData;
    for (let i = 0; i < segs.length - 1; i++) cur = cur[segs[i]];
    cur[segs[segs.length - 1]] = value;
    return { data: newData };
  }),

  // PUBLIC_INTERFACE
  addArrayItem: (key) => set((state) => {
    const newData = JSON.parse(JSON.stringify(state.data));
    if (!Array.isArray(newData[key])) newData[key] = [];
    if (['experience', 'projects'].includes(key)) newData[key].push(emptyItem());
    else newData[key].push('');
    return { data: newData };
  }),

  // PUBLIC_INTERFACE
  removeArrayItem: (key, index) => set((state) => {
    const newData = JSON.parse(JSON.stringify(state.data));
    if (Array.isArray(newData[key])) newData[key].splice(index, 1);
    return { data: newData };
  }),

  // PUBLIC_INTERFACE
  setArrayItem: (key, index, value) => set((state) => {
    const newData = JSON.parse(JSON.stringify(state.data));
    newData[key][index] = value;
    return { data: newData };
  }),

  // PUBLIC_INTERFACE
  setTemplate: (template) => set({ template }),

  // PUBLIC_INTERFACE
  setStep: (n) => set({ currentStep: n }),

  // PUBLIC_INTERFACE
  setAtsScore: (value, feedback) => set({ atsScore: { value, feedback } }),
}));
