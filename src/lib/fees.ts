import { FeeCategory, DeductionCategory } from '../types';

export const DEFAULT_FEES: FeeCategory[] = [
  { id: 'FEE_TUITION', name: 'Học phí cố định', type: 'monthly', defaultAmount: 4500000 },
  { id: 'FEE_BUS', name: 'Tiền xe', type: 'monthly', defaultAmount: 1000000 },
  { id: 'FEE_BOARDING', name: 'Nội trú', type: 'monthly', defaultAmount: 2500000 },
  { id: 'FEE_HALF_BOARDING', name: 'Bán trú', type: 'monthly', defaultAmount: 1500000 },
  { id: 'FEE_UNIFORM', name: 'Đồng phục', type: 'once', defaultAmount: 800000 },
];

export const DEFAULT_DEDUCTIONS: DeductionCategory[] = [
  { id: 'MG_CON_GV', name: 'Miễn giảm NV', type: 'monthly', defaultAmount: 1000000 },
  { id: 'MG_HO_NGHEO', name: 'Hộ nghèo', type: 'monthly', defaultAmount: 2000000 },
  { id: 'DED_HOC_BONG', name: 'Học bổng', type: 'once', defaultAmount: 4500000 },
];

export const getFees = (): FeeCategory[] => {
  try {
    const stored = localStorage.getItem('schoolFees');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return DEFAULT_FEES;
};

export const saveFees = (fees: FeeCategory[]) => {
  localStorage.setItem('schoolFees', JSON.stringify(fees));
};

export const getDeductions = (): DeductionCategory[] => {
  try {
    const stored = localStorage.getItem('schoolDeductions');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return DEFAULT_DEDUCTIONS;
};

export const saveDeductions = (deductions: DeductionCategory[]) => {
  localStorage.setItem('schoolDeductions', JSON.stringify(deductions));
};

export const getAcademicStartMonth = (): number => {
  try {
    const stored = localStorage.getItem('academicStartMonth');
    if (stored) return parseInt(stored);
  } catch (e) {}
  return 8; // Default to August
};

export const saveAcademicStartMonth = (month: number) => {
  localStorage.setItem('academicStartMonth', month.toString());
};

export const getAcademicMonthsOrder = (): number[] => {
  const start = getAcademicStartMonth();
  const order = [];
  for (let i = 0; i < 12; i++) {
    let m = start + i;
    if (m > 12) m -= 12;
    order.push(m);
  }
  return order;
};

export const getAcademicYearString = (month: number, year: number): string => {
  const start = getAcademicStartMonth();
  if (month >= start) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

export const getYearFromAcademicString = (month: number, academicYear: string): number => {
  const start = getAcademicStartMonth();
  const parts = academicYear.split('-');
  if (parts.length !== 2) return new Date().getFullYear();
  if (month >= start) {
    return parseInt(parts[0]);
  } else {
    return parseInt(parts[1]);
  }
};
