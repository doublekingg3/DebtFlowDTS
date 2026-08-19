import { Class } from '../types';

export const getAcademicYears = (): string[] => {
  try {
    const stored = localStorage.getItem('academicYears');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return ['2023-2024', '2024-2025', '2025-2026'];
};

export const saveAcademicYears = (years: string[]) => {
  localStorage.setItem('academicYears', JSON.stringify(years));
};

export const getClasses = (): Class[] => {
  try {
    const stored = localStorage.getItem('schoolClasses');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return [
    { id: '1', name: '10A1', grade: '10', academicYear: '2024-2025' },
    { id: '2', name: '10A2', grade: '10', academicYear: '2024-2025' },
    { id: '3', name: '6A1', grade: '6', academicYear: '2024-2025' },
    { id: '4', name: '1A1', grade: '1', academicYear: '2024-2025' },
  ];
};

export const saveClasses = (classes: Class[]) => {
  localStorage.setItem('schoolClasses', JSON.stringify(classes));
};
