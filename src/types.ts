export type Role = 'admin' | 'staff' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  role: Role;
  studentId?: string;
  name: string;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  academicYear?: string;
}

export interface Student {
  id: string; // Document ID
  studentId: string; // e.g. "DT0001"
  name: string;
  classId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  status: 'active' | 'inactive' | 'graduated';
  academicYear?: string; // e.g. "2023-2024"
  feeIds?: string[];
  deductionIds?: string[];
}

export interface DeductionCategory {
  id: string;
  name: string;
  type: 'monthly' | 'once' | 'percentage';
  defaultAmount: number; // For percentage, it could be the percent value like 10 (10%)
}

export interface FeeCategory {
  id: string;
  name: string;
  type: 'monthly' | 'weekly' | 'yearly' | 'once';
  defaultAmount: number;
}

export interface TuitionRecord {
  id: string;
  studentId: string;
  month: number;
  year: number;
  details: {
    categoryId: string;
    amount: number;
    name: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: number;
  paidDate?: number;
}

export interface TrashItem {
  id: string;
  originalCollection: string;
  originalId: string;
  data: any;
  deletedAt: number;
  deletedBy: string;
}
