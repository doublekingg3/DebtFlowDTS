import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Download, Upload, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Student } from '../types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { getFees, getDeductions, getAcademicStartMonth, getAcademicMonthsOrder, getAcademicYearString, getYearFromAcademicString } from '../lib/fees';
import { getClasses, getAcademicYears } from '../lib/schoolData';

let nextStudentSequence = 1;
const generateStudentId = () => {
  const idStr = nextStudentSequence.toString().padStart(4, '0');
  nextStudentSequence++;
  return `DT${idStr}`;
};

const INITIAL_STUDENTS: Student[] = [
  { id: '1', studentId: generateStudentId(), name: 'Nguyễn Văn A', classId: '10A1', academicYear: '2023-2024', parentName: 'Nguyễn Văn B', parentEmail: 'b@duytan.edu.vn', parentPhone: '0901234567', status: 'active', feeIds: ['FEE_TUITION', 'FEE_BUS'], deductionIds: [] },
  { id: '2', studentId: generateStudentId(), name: 'Trần Thị B', classId: '10A2', academicYear: '2023-2024', parentName: 'Trần Văn C', parentEmail: 'c@duytan.edu.vn', parentPhone: '0901234568', status: 'active', feeIds: ['FEE_TUITION', 'FEE_BOARDING'], deductionIds: ['DED_HOC_BONG'] },
];

const getStoredStudents = () => {
  try {
    const stored = localStorage.getItem('demoStudents');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return INITIAL_STUDENTS;
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>(() => {
    const data = getStoredStudents();
    // Initialize sequence based on highest DTxxxx
    let maxSeq = 0;
    data.forEach(s => {
      const match = s.studentId.match(/^DT(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxSeq) maxSeq = num;
      }
    });
    nextStudentSequence = maxSeq + 1;
    return data;
  });
  const [tuitions, setTuitions] = useState<any[]>([]);

  // Dynamic Categories from LocalStorage
  const FEE_CATEGORIES = getFees().map(f => ({ ...f, price: f.defaultAmount }));
  const DEDUCTION_CATEGORIES = getDeductions().map(d => ({ ...d, value: d.type === 'percentage' ? d.defaultAmount : -d.defaultAmount }));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'graduated'>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(''); // Default to empty to prevent full load
  
  // App Data
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [schoolAcademicYears, setSchoolAcademicYears] = useState<string[]>([]);

  // Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  useEffect(() => {
    setSchoolClasses(getClasses());
    setSchoolAcademicYears(getAcademicYears());
  }, []);

  useEffect(() => {
    localStorage.setItem('demoStudents', JSON.stringify(students));
    try {
      const storedTuitions = localStorage.getItem('demoTuitions');
      if (storedTuitions) {
        setTuitions(JSON.parse(storedTuitions));
      }
    } catch(e) {}
  }, [students]);
  const [bulkActionType, setBulkActionType] = useState<'class' | 'status'>('class');
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkStatus, setBulkStatus] = useState<'active' | 'inactive' | 'graduated'>('active');

  // File Import Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Mapping State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRawData, setImportRawData] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [importSheets, setImportSheets] = useState<string[]>([]);
  const [selectedImportSheet, setSelectedImportSheet] = useState<string>('ALL');
  const [importAcademicYear, setImportAcademicYear] = useState<string>('2024-2025');
  
  const [mapColLastName, setMapColLastName] = useState<string>('');
  const [mapColFirstName, setMapColFirstName] = useState<string>('');
  const [mapColClass, setMapColClass] = useState<string>('');
  const [mapColPhone, setMapColPhone] = useState<string>('');
  
  const [mapColMonth, setMapColMonth] = useState<string>('');
  const [mapColFeeAmount, setMapColFeeAmount] = useState<string>('');
  const [mapColFeeStatus, setMapColFeeStatus] = useState<string>('');

  const [isImportSuccessModalOpen, setIsImportSuccessModalOpen] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [studentModalTab, setStudentModalTab] = useState<'profile' | 'tuition'>('profile');
  const [studentTuitionHist, setStudentTuitionHist] = useState<any[]>([]);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    classId: '',
    academicYear: '2024-2025',
    parentName: '',
    parentPhone: '',
    feeIds: [],
    deductionIds: []
  });

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setStudentModalTab('profile');
    setStudentTuitionHist([]);
    setFormData({ 
      name: '', classId: '', academicYear: '2024-2025', parentName: '', parentPhone: '', feeIds: [], deductionIds: [] 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setModalMode('edit');
    setEditingId(student.id);
    setStudentModalTab('profile');
    try {
      const stored = JSON.parse(localStorage.getItem('demoTuitions') || '[]');
      setStudentTuitionHist(stored.filter((t: any) => t.studentId === student.studentId));
    } catch(e) { setStudentTuitionHist([]); }
    setFormData({
      ...student,
      feeIds: student.feeIds || [],
      deductionIds: student.deductionIds || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá học sinh',
      message: 'Bạn có chắc chắn muốn xoá học sinh này không? Dữ liệu công nợ cũ vẫn lưu trữ nhưng học sinh sẽ bị ẩn đi.',
      onConfirm: () => {
        setStudents(students.filter(s => s.id !== id));
        toast.success('Đã xoá học sinh');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleFee = (feeId: string) => {
    setFormData(prev => {
      const current = prev.feeIds || [];
      return {
        ...prev,
        feeIds: current.includes(feeId) ? current.filter(id => id !== feeId) : [...current, feeId]
      };
    });
  };

  const toggleDeduction = (dedId: string) => {
    setFormData(prev => {
      const current = prev.deductionIds || [];
      return {
        ...prev,
        deductionIds: current.includes(dedId) ? current.filter(id => id !== dedId) : [...current, dedId]
      };
    });
  };

  const handleSave = () => {
    if (!formData.name?.trim() || !formData.classId?.trim()) {
      toast.error('Vui lòng điền đủ Tên học sinh và Lớp');
      return;
    }

    if (modalMode === 'create') {
      const newStudent: Student = {
        id: Date.now().toString(),
        studentId: generateStudentId(),
        name: formData.name.trim(),
        classId: formData.classId.trim(),
        academicYear: formData.academicYear?.trim() || '2024-2025',
        parentName: formData.parentName || '',
        parentEmail: '',
        parentPhone: formData.parentPhone || '',
        status: 'active',
        feeIds: formData.feeIds,
        deductionIds: formData.deductionIds
      };
      setStudents([...students, newStudent]);
      toast.success('Đã thêm học sinh: ' + newStudent.studentId);
    } else {
      setStudents(students.map(s => s.id === editingId ? {
        ...s,
        name: formData.name!.trim(),
        classId: formData.classId!.trim(),
        academicYear: formData.academicYear?.trim() || '2024-2025',
        parentName: formData.parentName || '',
        parentPhone: formData.parentPhone || '',
        feeIds: formData.feeIds,
        deductionIds: formData.deductionIds
      } : s));
      toast.success('Đã cập nhật học sinh');
    }

    setIsModalOpen(false);
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá các học sinh đã chọn',
      message: `Bạn có chắc chắn muốn xoá ${selectedStudentIds.length} học sinh này không? Dữ liệu công nợ cũ vẫn lưu trữ nhưng học sinh sẽ bị ẩn đi.`,
      onConfirm: () => {
        setStudents(students.filter(s => !selectedStudentIds.includes(s.id)));
        setSelectedStudentIds([]);
        toast.success(`Đã xoá ${selectedStudentIds.length} học sinh`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá TOÀN BỘ học sinh',
      message: 'Bạn có chắc chắn muốn xoá toàn bộ học sinh? Hành động này sẽ xoá danh sách hiện tại. Dữ liệu công nợ cũ cần xoá riêng bên Quản lý Công nợ.',
      onConfirm: () => {
        setStudents([]);
        setSelectedStudentIds([]);
        toast.success('Đã xoá toàn bộ dữ liệu học sinh');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBulkOperate = (type: 'class' | 'status') => {
    setBulkActionType(type);
    setBulkClassId('');
    setBulkStatus('active');
    setIsBulkModalOpen(true);
  };

  const handleBulkSave = () => {
    if (bulkActionType === 'class' && !bulkClassId.trim()) {
      toast.error('Vui lòng nhập tên lớp mới');
      return;
    }
    
    setStudents(prev => prev.map(s => {
      if (selectedStudentIds.includes(s.id)) {
        if (bulkActionType === 'class') return { ...s, classId: bulkClassId.trim() };
        if (bulkActionType === 'status') return { ...s, status: bulkStatus };
      }
      return s;
    }));
    
    toast.success(`Đã cập nhật ${selectedStudentIds.length} học sinh`);
    setIsBulkModalOpen(false);
    setSelectedStudentIds([]);
  };

  const handleDownloadTemplate = () => {
    const feeNames = FEE_CATEGORIES.map(f => f.name).join(',');
    const monthsOrder = getAcademicMonthsOrder();
    const monthsHeader = monthsOrder.map(m => `Tháng ${m}`).join(',');
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
      `Mã Học Sinh,Họ Tên,Lớp học,Năm học,Tên Phụ Huynh,SĐT Phụ Huynh,${feeNames},Khấu trừ,${monthsHeader}\n` +
      `DT0001,Nguyễn Văn D,10A3,2024-2025,Nguyễn Văn E,0987654321,${FEE_CATEGORIES.map(f => f.id === 'FEE_TUITION' ? 'x' : '').join(',')},MG_CON_GV,4500000,4500000,,,,,,,,,,,\n` +
      `DT0002,Trần Thị G,11B1,2024-2025,Trần Văn H,0912345678,${FEE_CATEGORIES.map(f => f.id === 'FEE_TUITION' || f.id === 'FEE_BOARDING' ? 'x' : '').join(',')},,4500000,1000000,,,,,,,,,,`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Mau_Nhap_Hoc_Sinh_Tien_Do.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải mẫu nhập dữ liệu học sinh');
  };

  const handleExportData = () => {
    if (students.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }
    
    const feeNames = FEE_CATEGORIES.map(f => f.name).join(',');
    const monthsOrder = getAcademicMonthsOrder();
    const monthsHeader = monthsOrder.map(m => `Tháng ${m}`).join(',');
    let csvContent = `data:text/csv;charset=utf-8,\uFEFFMã Học Sinh,Họ Tên,Lớp học,Năm học,Tên Phụ Huynh,SĐT Phụ Huynh,Email Phụ Huynh,Trạng thái,${feeNames},Khấu trừ,Tổng Cần Thu/Tháng,${monthsHeader}\n`;
    
    students.forEach(s => {
      const studentTuitions = tuitions.filter(t => t.studentId === s.studentId && (!s.academicYear || t.academicYear === s.academicYear));
      
      let expectedTotal = 0;
      const feeChecks = FEE_CATEGORIES.map(f => {
        if (s.feeIds?.includes(f.id)) {
          if (f.type !== 'once' && f.type !== 'yearly') {
            expectedTotal += f.price || 0;
          }
          return 'x';
        }
        return '';
      });
      
      const deductionStr = (s.deductionIds || []).map(id => {
        const d = DEDUCTION_CATEGORIES.find(x => x.id === id);
        if (d) {
          if (d.type !== 'once' && d.type !== 'yearly') {
            expectedTotal += d.value || 0;
          }
        }
        return d?.name || id;
      }).join(';');
      expectedTotal = Math.max(0, expectedTotal);

      const row = [
        s.studentId || '',
        s.name || '',
        s.classId || '',
        s.academicYear || '',
        s.parentName || '',
        s.parentPhone || '',
        s.parentEmail || '',
        s.status === 'active' ? 'Đang học' : 'Đã nghỉ',
        ...feeChecks,
        deductionStr,
        expectedTotal.toString()
      ];
      
      monthsOrder.forEach(m => {
        const t = studentTuitions.find(t => t.month === m);
        row.push(t ? (t.total || 0).toString() : '');
      });
      
      csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Danh_Sach_Hoc_Sinh.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất dữ liệu học sinh hiện tại');
  };

  const parseRowsToObjects = (rows: any[][], sheetName: string = '') => {
    if (!rows || rows.length === 0) return [];
    
    let headerIndex = -1;
    let headers: string[] = [];

    // Look for the header by finding a row with "họ", "tên", "lớp"
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;
      
      const rowStr = row.map(cell => String(cell || '').toLowerCase().trim());
      // Check if it's a header row
      if (rowStr.includes('tên') || 
          rowStr.some(v => v.includes('họ và') || v.includes('họ tên') || v === 'họ') || 
          rowStr.includes('lớp')) {
        headerIndex = i;
        // Make non-empty headers unique if needed, but for now just map them
        headers = row.map(cell => String(cell || '').trim());
        break;
      }
    }

    if (headerIndex === -1) {
      headerIndex = 0;
      headers = rows[0]?.map(cell => String(cell || '').trim()) || [];
    }

    const finalData: any[] = [];
    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;
      // Skip empty rows
      if (row.every(cell => cell === undefined || cell === null || cell === '')) continue;
      
      const obj: any = { _sheetName: sheetName };
      headers.forEach((header, index) => {
        if (header && typeof row[index] !== 'undefined') {
          // If duplicate header exists, keep the first one or we can just overwrite
          // Let's just overwrite just in case, but usually Họ and Tên are different columns
          obj[header] = row[index];
        }
      });
      finalData.push(obj);
    }
    
    return finalData;
  };

  const openMappingModal = (data: any[], fileName: string) => {
    if (data.length === 0) {
      toast.error('File không có dữ liệu');
      return;
    }
    
    // Extract unique columns and sheets
    const columnsSet = new Set<string>();
    const sheetsSet = new Set<string>();
    data.forEach(row => {
      if (row._sheetName) sheetsSet.add(row._sheetName);
      Object.keys(row).forEach(k => {
        if (k !== '_sheetName') columnsSet.add(k);
      });
    });
    const cols = Array.from(columnsSet);
    const sheets = Array.from(sheetsSet).filter(Boolean);
    
    // Auto-detect columns
    const detect = (keywords: string[]) => cols.find(c => keywords.some(k => c.toLowerCase().includes(k))) || '';
    
    setMapColLastName(detect(['họ', 'ho']));
    setMapColFirstName(detect(['tên', 'ten']));
    setMapColClass(detect(['lớp', 'lop', 'class']));
    setMapColPhone(detect(['sđt', 'điện thoại', 'phone', 'phụ huynh', 'phu huynh']));
    
    setMapColMonth(detect(['tháng', 'thang', 'kỳ']));
    setMapColFeeAmount(detect(['số tiền', 'thu', 'học phí', 'phí']));
    setMapColFeeStatus(detect(['trạng thái', 'tình trạng', 'ghi chú']));

    setImportSheets(sheets);
    setSelectedImportSheet('ALL');
    setImportColumns(cols);
    setImportRawData(data);
    setImportFileName(fileName);
    setIsImportModalOpen(true);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: false, // get array of arrays
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as any[][];
          const objects = parseRowsToObjects(rows);
          openMappingModal(objects, file.name);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        error: (error) => {
          toast.error(`Lỗi khi đọc file CSV: ${error.message}`);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        
        let allData: any[] = [];
        
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          const sheetObjects = parseRowsToObjects(sheetData, sheetName);
          allData = [...allData, ...sheetObjects];
        });
        
        openMappingModal(allData, file.name);
        
      } catch (error: any) {
        toast.error(`Lỗi khi đọc file Excel: ${error.message}`);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      toast.error('Vui lòng chọn file CSV hoặc Excel (.xlsx, .xls)');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImportData = () => {
    if (!mapColFirstName && !mapColLastName) {
      toast.error('Vui lòng chọn ít nhất Cột Tên (hoặc Cả Họ & Tên) để nhận diện!');
      return;
    }

    const storedTuitions = [];
    try {
      const stored = localStorage.getItem('demoTuitions');
      if (stored) storedTuitions.push(...JSON.parse(stored));
    } catch(e) {}
    
    const newTuitions: any[] = [];
    const uniqueStudents = new Map<string, Student>();
    
    // Filter data by selected sheet if applicable
    const dataToImport = selectedImportSheet === 'ALL' 
      ? importRawData 
      : importRawData.filter(r => r._sheetName === selectedImportSheet);

    dataToImport.forEach((row: any) => {
      // Use mapped columns
      const importedStudentId = mapColLastName ? row[mapColLastName]?.toString().trim() : '';
      const fullName = (mapColFirstName ? row[mapColFirstName] : '')?.toString().trim();
      
      // Skip row if completely no name (or not mapped correctly)
      if (!fullName || fullName === 'TỔNG CỘNG') return;

      const classId = (mapColClass ? row[mapColClass] : (row['_sheetName'] || 'Chưa xếp lớp'))?.toString().trim();
      const phone = mapColPhone ? row[mapColPhone] : '';
      const rowYear = importColumns.includes('Năm học') ? row['Năm học']?.toString().trim() : null;
      const year = rowYear || importAcademicYear || '2024-2025';

      const studentKey = importedStudentId ? `${importedStudentId}-${year}` : `${fullName}-${classId}-${year}`;

      let studentId = '';
      if (!uniqueStudents.has(studentKey)) {
        // check if exists in current students
        let existing;
        if (importedStudentId) {
          existing = students.find(s => s.studentId === importedStudentId && s.academicYear === year);
          studentId = importedStudentId; // Keep the same ID across years even if not existing for THIS year yet
        } else {
          existing = students.find(s => s.name === fullName && s.classId === classId && s.academicYear === year);
          studentId = existing?.studentId || generateStudentId();
        }
        
        // Extract fees
        let feeIds: string[] = existing?.feeIds || ['FEE_TUITION'];
        let deductionIds: string[] = existing?.deductionIds || [];
        
        if (!existing) {
          // Check if row has any of our fee columns
          const hasFeeColumns = FEE_CATEGORIES.some(f => row[f.name] !== undefined);
          if (hasFeeColumns) feeIds = [];

          FEE_CATEGORIES.forEach(f => {
            const val = row[f.name]?.toString().toLowerCase().trim();
            if (val === 'x' || val === 'có') {
              if (!feeIds.includes(f.id)) feeIds.push(f.id);
            }
          });

          // Check if "Mã Khoản Thu" contains fee ids
          const maKhoanThu = row['Mã Khoản Thu (cách nhau dấu phẩy)']?.toString();
          if (maKhoanThu) {
            maKhoanThu.split(/[,;]/).forEach((idRaw: string) => {
              const fid = idRaw.trim();
              if (fid && !feeIds.includes(fid)) feeIds.push(fid);
            });
          }

          const khauTru = row['Khấu trừ']?.toString() || row['Mã Khấu trừ']?.toString();
          if (khauTru) {
             khauTru.split(/[,;]/).forEach((idRaw: string) => {
               const did = idRaw.trim();
               const match = DEDUCTION_CATEGORIES.find(d => d.id === did || d.name === did);
               if (match && !deductionIds.includes(match.id)) {
                 deductionIds.push(match.id);
               }
             });
          }

          const d1Raw = row['Giảm con thứ 2 (10%)'];
          const d1 = parseFloat(d1Raw?.toString().replace(/,/g, '') || '0');
          if (d1 > 0 && !deductionIds.includes('MG_CON_GV')) deductionIds.push('MG_CON_GV'); 
          
          const d2Raw = row['Giảm theo chế độ CB, CNV'] || row['Giảm theo chế độ CB CNV'];
          const d2Str = d2Raw ? d2Raw.toString().trim() : '';
          if (d2Str && d2Str !== '-' && !deductionIds.includes('MG_HO_NGHEO')) deductionIds.push('MG_HO_NGHEO');
          
          // Ensure at least tuition is checked if empty but we don't have explicit columns
          if (feeIds.length === 0 && !hasFeeColumns) {
             feeIds.push(FEE_CATEGORIES[0]?.id || 'FEE_TUITION');
          }
        }

        uniqueStudents.set(studentKey, {
          id: existing?.id || Date.now().toString() + Math.random().toString(36).substring(7),
          studentId: studentId,
          name: fullName,
          classId: classId,
          parentName: row['Tên Phụ Huynh']?.toString() || existing?.parentName || '',
          parentEmail: existing?.parentEmail || '',
          parentPhone: phone?.toString() || existing?.parentPhone || '',
          status: 'active',
          academicYear: year,
          feeIds,
          deductionIds
        });
      } else {
        studentId = uniqueStudents.get(studentKey)!.studentId;
      }

      // ----------------------------------------------------
      // Tuition extractions (Scanning for month/fee data)
      // ----------------------------------------------------
      
      // Calculate expected tuition to infer status
      const studentObj = uniqueStudents.get(studentKey);
      let expectedTotal = 0;
      if (studentObj) {
        studentObj.feeIds?.forEach(fId => {
          const f = FEE_CATEGORIES.find(x => x.id === fId);
          if (f) expectedTotal += f.price || 0;
        });
        studentObj.deductionIds?.forEach(dId => {
          const d = DEDUCTION_CATEGORIES.find(x => x.id === dId);
          if (d) expectedTotal += d.value || 0;
        });
        expectedTotal = Math.max(0, expectedTotal);
      }

      // Check for columns that look like "Tháng X" or "Thang X"
      const monthColumns = Object.keys(row).filter(k => k.toLowerCase().match(/^th[áa]ng\s*(\d+)$/));
      
      if (monthColumns.length > 0) {
        monthColumns.forEach(mCol => {
          const mMatch = mCol.match(/\d+/);
          if (mMatch) {
            const monthNum = parseInt(mMatch[0]);
            const amountRaw = row[mCol]?.toString().replace(/[^\d]/g, '');
            if (amountRaw && parseInt(amountRaw) >= 0) {
              const feeAmount = parseInt(amountRaw);
              
              let feeStatus = 'pending';
              if (feeAmount >= expectedTotal && expectedTotal > 0) {
                feeStatus = 'paid';
              } else if (feeAmount > 0) {
                feeStatus = 'partial';
              }
              
              if (feeAmount > 0 || row[mCol]?.toString().trim() === '0') {
                const yearNum = getYearFromAcademicString(monthNum, year);
                newTuitions.push({
                  id: Date.now().toString() + Math.random().toString(36).substring(7) + monthNum,
                  studentId: studentId,
                  name: fullName,
                  class: classId,
                  month: monthNum,
                  year: yearNum,
                  total: feeAmount,
                  status: feeStatus,
                  academicYear: year
                });
              }
            }
          }
        });
      } else {
        // Legacy mapping support for single month
        let monthStr = mapColMonth ? row[mapColMonth]?.toString() : '';
        if (!monthStr) {
          const sheetName = row['_sheetName']?.toString().toLowerCase() || '';
          if (sheetName.includes('tháng') || sheetName.includes('thang') || sheetName.match(/^t\d+/)) {
            const mMatch = sheetName.match(/\d+/);
            if (mMatch) monthStr = mMatch[0];
          }
        } else {
          const mMatch = monthStr.match(/\d+/);
          if (mMatch) monthStr = mMatch[0];
        }

        const monthNum = parseInt(monthStr);
        let feeAmountRaw = mapColFeeAmount ? row[mapColFeeAmount]?.toString().replace(/[^\d]/g, '') : '0';
        const feeAmount = parseInt(feeAmountRaw || '0');
        
        const statusRaw = mapColFeeStatus ? row[mapColFeeStatus]?.toString().toLowerCase() || '' : '';
        let feeStatus = 'pending';
        if (statusRaw.includes('đã') || statusRaw.includes('ok') || statusRaw.includes('rồi') || statusRaw.includes('có')) {
          feeStatus = 'paid';
        } else if (statusRaw.includes('thiếu') || statusRaw.includes('một phần')) {
          feeStatus = 'partial';
        } else if (statusRaw.includes('nợ') || statusRaw.includes('chưa')) {
          feeStatus = (feeAmount > 0) ? 'overdue' : 'pending';
        } else if (feeAmount >= expectedTotal && expectedTotal > 0) {
           feeStatus = 'paid';
        } else if (feeAmount > 0) {
           feeStatus = 'partial';
        }

        if (!isNaN(monthNum) && monthNum > 0 && monthNum <= 12) {
          const yearNum = getYearFromAcademicString(monthNum, year);
          if (feeAmount > 0 || feeStatus !== 'pending') {
            newTuitions.push({
              id: Date.now().toString() + Math.random().toString(36).substring(7),
              studentId: studentId,
              name: fullName,
              class: classId,
              month: monthNum,
              year: yearNum,
              total: feeAmount || 0,
              status: feeStatus,
              academicYear: year
            });
          }
        }
      }
    });

    const newStudentsArr = Array.from(uniqueStudents.values());

    if (newStudentsArr.length > 0) {
      setStudents(prev => {
         const updated = [...prev];
         newStudentsArr.forEach(ns => {
            const idx = updated.findIndex(u => u.name === ns.name && u.classId === ns.classId && u.academicYear === ns.academicYear);
            if (idx >= 0) {
               updated[idx] = ns; // Override/update
            } else {
               updated.push(ns);
            }
         });
         return updated;
      });
      
      if (newTuitions.length > 0) {
        const uniqueTuitions = [...storedTuitions];
        newTuitions.forEach(nt => {
          // Check if already exists for this student/month/year to overwrite
          const existingIdx = uniqueTuitions.findIndex(t => t.studentId === nt.studentId && t.month === nt.month && t.year === nt.year);
          if (existingIdx >= 0) uniqueTuitions[existingIdx] = nt;
          else uniqueTuitions.push(nt);
        });
        localStorage.setItem('demoTuitions', JSON.stringify(uniqueTuitions));
        toast.success(`Đã quét thêm ${newTuitions.length} bản ghi công nợ!`);
      }

      setImportSuccessCount(newStudentsArr.length);
      setIsImportSuccessModalOpen(true);
      setIsImportModalOpen(false);
      setImportRawData([]);
    } else {
      toast.error('Không tìm thấy dữ liệu hợp lệ để import');
    }
  };

  const filteredStudentsForClasses = academicYearFilter === 'all' 
    ? students 
    : students.filter(s => s.academicYear === academicYearFilter);
  const uniqueClasses = Array.from(new Set(filteredStudentsForClasses.map(s => s.classId || 'Chưa xếp lớp'))).sort();
  const classGrades = uniqueClasses.reduce((acc, cls) => {
    let grade = 'Khác';
    const match = cls.match(/^(\d+)/);
    if (match) {
      grade = `Khối ${match[1]}`;
    } else if (cls === 'Chưa xếp lớp') {
      grade = 'Chưa xếp lớp';
    }
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(cls);
    return acc;
  }, {} as Record<string, string[]>);

  // Sorting grades numerically if possible
  const sortedGrades = Object.keys(classGrades).sort((a, b) => {
    if (a === 'Chưa xếp lớp') return 1;
    if (b === 'Chưa xếp lớp') return -1;
    if (a === 'Khác') return 1;
    if (b === 'Khác') return -1;
    const numA = parseInt(a.replace('Khối ', '')) || 0;
    const numB = parseInt(b.replace('Khối ', '')) || 0;
    return numA - numB;
  });

  const filteredStudents = students.filter(s => {
    // If no class is selected and no search term, don't show any students to prevent heavy DOM rendering
    if (selectedClassFilter === '' && searchTerm.trim() === '') {
      return false;
    }

    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.classId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchYear = academicYearFilter === 'all' || s.academicYear === academicYearFilter;
    const matchClass = selectedClassFilter === 'all' || selectedClassFilter === '' || (s.classId || 'Chưa xếp lớp') === selectedClassFilter;
    return matchSearch && matchStatus && matchYear && matchClass;
  });

  const uniqueYears = Array.from(new Set(students.map(s => s.academicYear || 'Chưa phân loại'))).sort((a, b) => (b as string).localeCompare(a as string));

  return (
    <div className="space-y-6 flex-1 flex flex-col min-w-0 pr-4 pb-4 md:pr-8 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 md:pt-8 pl-4 md:pl-8">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Học sinh</h2>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" onClick={handleDeleteAll} className="border-red-200 text-red-600 hover:bg-red-50">
            Xoá Toàn bộ
          </Button>
          <Button variant="outline" onClick={handleExportData} className="border-slate-200 text-slate-700">
            Xuất Dữ liệu
          </Button>
          <Button variant="outline" onClick={handleDownloadTemplate} className="border-slate-200">
            <Download className="w-4 h-4 mr-2" /> Mẫu Import
          </Button>
          <div className="relative">
            <input 
              type="file" 
              accept=".csv, .xlsx, .xls" 
              onChange={handleImportFile}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              ref={fileInputRef}
            />
            <Button variant="outline" className="w-full text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
              <Upload className="w-4 h-4 mr-2" /> Upload Data
            </Button>
          </div>
          <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Học sinh mới
          </Button>
        </div>
      </div>

      <div className="pl-4 md:pl-8 flex-1 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 max-h-[80vh]">
          <div>
            <h3 className="font-semibold text-slate-800 px-2 text-sm uppercase tracking-wider mb-2">Năm học</h3>
            <select 
              className="w-full border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              value={academicYearFilter}
              onChange={(e) => {
                setAcademicYearFilter(e.target.value);
                setSelectedClassFilter('all'); // Reset class filter when changing year
              }}
            >
              <option value="all">Tất cả Năm học</option>
              {uniqueYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-800 px-2 text-sm uppercase tracking-wider mb-2">Phân loại Lớp</h3>
            <button 
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedClassFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setSelectedClassFilter('all')}
            >
              Tất cả Lớp
            </button>
            {sortedGrades.map(grade => (
              <div key={grade} className="mb-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mt-2">{grade}</div>
                <div className="flex flex-col gap-1">
                  {classGrades[grade].map(cls => (
                    <button 
                      key={cls}
                      className={`text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedClassFilter === cls ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                      onClick={() => setSelectedClassFilter(cls)}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex bg-white gap-2 flex-wrap sm:flex-nowrap max-w-2xl w-full">
              <Input 
                placeholder="Tra cứu MSSV, tên, lớp..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs border-slate-200"
              />
              <select 
                className="border border-slate-200 text-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang học</option>
                <option value="inactive">Đã nghỉ học / Chuyển trường</option>
                <option value="graduated">Ra trường / Tốt nghiệp</option>
              </select>
            </div>
            <Badge variant="outline" className="text-slate-500 font-normal border-slate-200 bg-slate-50 shrink-0">
              Tổng số: {filteredStudents.length} học sinh
            </Badge>
          </div>

          {/* Bulk Actions Bar */}
          {selectedStudentIds.length > 0 && (
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-blue-800 font-medium">
                Đã chọn {selectedStudentIds.length} học sinh
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkOperate('class')} className="border-blue-200 text-blue-700 hover:bg-blue-100">
                  Chuyển / Đổi Lớp
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkOperate('status')} className="border-blue-200 text-blue-700 hover:bg-blue-100">
                  Cập nhật Trạng thái
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkDelete} className="border-red-200 text-red-600 hover:bg-red-50">
                  Xoá Đã Chọn
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedStudentIds([])} className="text-slate-500 hover:bg-white hover:text-slate-700">
                  Bỏ chọn
                </Button>
              </div>
            </div>
          )}
          
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center gap-6 text-xs text-slate-600">
            <span className="font-medium text-slate-800">Chú thích Tiến độ:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-emerald-600 bg-emerald-500"></div>
              <span>Đã đóng đầy đủ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-amber-500 bg-amber-400"></div>
              <span>Đóng nhưng vẫn thiếu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-red-600 bg-red-500"></div>
              <span>Chưa đóng khoản nào</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-slate-200 bg-slate-100 text-[9px] flex items-center justify-center font-bold text-slate-400">?</div>
              <span>Chưa có phiếu thu</span>
            </div>
          </div>

          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="cursor-pointer rounded border-slate-300"
                      checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Mã HS</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Họ Tên</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Lớp</th>
                  <th className="px-6 py-4 font-semibold min-w-[240px]">Tiến độ đóng phí năm học</th>
                  <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      {selectedClassFilter === '' && searchTerm.trim() === '' 
                        ? 'Vui lòng chọn một Lớp ở danh sách bên trái hoặc nhập từ khoá Tìm kiếm để xem danh sách Học sinh.' 
                        : 'Không tìm thấy dữ liệu phù hợp'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                    const studentTuitions = tuitions.filter(t => t.studentId === student.studentId);
                    const months = getAcademicMonthsOrder();
                    
                    return (
                      <tr key={student.id} className={`hover:bg-slate-50/50 transition-colors group ${(student.status === 'inactive' || student.status === 'graduated') ? 'opacity-60 bg-slate-50/50' : ''}`}>
                        <td className="px-4 py-4 text-center">
                          <input 
                            type="checkbox" 
                            className="cursor-pointer rounded border-slate-300"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleToggleSelect(student.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-blue-700">
                          {student.studentId}
                          {student.status === 'inactive' && <Badge className="ml-2 bg-slate-200 text-slate-600 border-none px-1 py-0.5 text-[10px]">Đã chuyển/Nghỉ</Badge>}
                          {student.status === 'graduated' && <Badge className="ml-2 bg-purple-100 text-purple-700 border-none px-1 py-0.5 text-[10px]">Đã ra trường</Badge>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 group/name relative cursor-help">
                            {student.name}
                            
                            {/* Hover tooltip for Fees and Deductions */}
                            <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs bg-slate-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover/name:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                              <div className="font-bold border-b border-slate-600 pb-1 mb-2">Các khoản phí & Khấu trừ</div>
                              <div className="space-y-1">
                                <div><span className="text-slate-400">Phí:</span> {(student.feeIds && student.feeIds.length > 0) ? student.feeIds.map(fid => FEE_CATEGORIES.find(f => f.id === fid)?.name).filter(Boolean).join(', ') : 'Không có'}</div>
                                <div><span className="text-slate-400">Khấu trừ:</span> {(student.deductionIds && student.deductionIds.length > 0) ? student.deductionIds.map(did => DEDUCTION_CATEGORIES.find(d => d.id === did)?.name).filter(Boolean).join(', ') : 'Không có'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">PH: {student.parentName} - {student.parentPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-600">{student.classId}</div>
                          <div className="text-[11px] text-slate-400 mt-1">{student.academicYear || 'Chưa phân loại năm'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 items-center">
                            {months.map(m => {
                              const tMonth = studentTuitions.find(t => t.month === m && (
                                !student.academicYear || t.academicYear === student.academicYear
                              ));
                              let bgColor = 'bg-slate-100 text-slate-400 border-slate-200';
                              let title = `Tháng ${m}: Chưa tạo phiếu`;
                              if (tMonth) {
                                let totalExpected = 0;
                                let expectedText: string[] = [];
                                const feeOrder: {name: string, price: number}[] = [];
                                (student.feeIds || []).forEach(fId => {
                                  const f = FEE_CATEGORIES.find(x => x.id === fId);
                                  if (f) {
                                    totalExpected += f.price || 0;
                                    expectedText.push(`${f.name} (${(f.price || 0).toLocaleString()}đ)`);
                                    feeOrder.push({name: f.name, price: f.price || 0});
                                  }
                                });
                                (student.deductionIds || []).forEach(dId => {
                                  const d = DEDUCTION_CATEGORIES.find(x => x.id === dId);
                                  if (d) {
                                    totalExpected += d.value || 0;
                                    expectedText.push(`${d.name} (${(d.value || 0).toLocaleString()}đ)`);
                                    // Deductions simplify the debt, we can subtract from totalExpected directly
                                  }
                                });
                                totalExpected = Math.max(0, totalExpected);

                                if (tMonth.status === 'paid') {
                                  bgColor = 'bg-emerald-500 text-white border-emerald-600 shadow-sm';
                                  title = `Tháng ${m}: Đã đóng đủ (${tMonth.total?.toLocaleString() || 0}đ)\n- Các khoản: ${expectedText.join(', ') || 'Không có'}`;
                                } else if (tMonth.status === 'partial') {
                                  bgColor = 'bg-amber-400 text-white border-amber-500 shadow-sm';
                                  const paid = tMonth.total || 0;
                                  
                                  let paidRemaining = paid;
                                  let missingItems: string[] = [];
                                  
                                  feeOrder.forEach(f => {
                                    if (paidRemaining >= f.price) {
                                      paidRemaining -= f.price;
                                    } else {
                                      const missingFee = f.price - paidRemaining;
                                      missingItems.push(`${f.name} (thiếu ${missingFee.toLocaleString()}đ)`);
                                      paidRemaining = 0;
                                    }
                                  });
                                  
                                  const missingDetails = missingItems.length > 0 ? `\n- Các khoản chưa đủ:\n  + ${missingItems.join('\n  + ')}` : '';
                                  title = `Tháng ${m}: Đóng thiếu\n- Cần thu: ${totalExpected.toLocaleString()}đ\n- Đã đóng: ${paid.toLocaleString()}đ${missingDetails}`;
                                  
                                } else if (tMonth.status === 'pending' || tMonth.status === 'overdue') {
                                  bgColor = 'bg-red-500 text-white border-red-600 shadow-sm';
                                  title = `Tháng ${m}: Chưa đóng\n- Cần thu: ${totalExpected.toLocaleString()}đ\n- Các khoản: ${expectedText.join(', ') || 'Không có'}`;
                                }
                              }
                              return (
                                <div 
                                  key={m} 
                                  title={title}
                                  className={`w-6 h-6 flex items-center justify-center rounded text-[10px] sm:text-xs font-medium border ${bgColor} cursor-help transition-transform hover:scale-110`}
                                >
                                  {m}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(student)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(student.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Student / Fees Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEnter={handleSave}
        title={modalMode === 'create' ? 'Thêm mới học sinh' : `Cập nhật: ${formData.studentId || ''}`}
        footer={
          studentModalTab === 'profile' ? (
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-200 text-slate-600">
                Huỷ
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                Cập nhật Hồ sơ
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-200 text-slate-600">
              Đóng
            </Button>
          )
        }
      >
        <div className="flex border-b border-slate-200 mb-4">
          <button 
            className={`px-4 py-2 font-medium text-sm ${studentModalTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setStudentModalTab('profile')}
          >
            Hồ sơ học sinh
          </button>
          {modalMode === 'edit' && (
            <button 
              className={`px-4 py-2 font-medium text-sm ${studentModalTab === 'tuition' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setStudentModalTab('tuition')}
            >
              Lịch sử đóng tiền
            </button>
          )}
        </div>
        
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 pb-2">
          {studentModalTab === 'profile' ? (
            <>
              {/* Thông tin cơ bản */}
          <div className="space-y-4 border border-slate-100 p-4 rounded-xl">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2"><div className="w-1.5 h-4 bg-blue-600 rounded-full"></div> Thông tin cơ bản</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label className="text-slate-600">Họ và Tên</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="border-slate-200" placeholder="VD: Nguyễn Văn A" />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1 relative">
                <Label className="text-slate-600">Lớp học</Label>
                <div className="relative">
                  <Input 
                    value={isClassDropdownOpen ? classSearchTerm : formData.classId} 
                    onChange={(e) => {
                      setClassSearchTerm(e.target.value);
                      setIsClassDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsClassDropdownOpen(true);
                      setClassSearchTerm('');
                    }}
                    onBlur={() => {
                      setTimeout(() => setIsClassDropdownOpen(false), 200);
                    }}
                    className="border-slate-200 uppercase w-full" 
                    placeholder={formData.classId || "VD: 10A1 (Tìm kiếm...)"} 
                  />
                  {isClassDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {schoolClasses.filter(c => c.name.toLowerCase().includes(classSearchTerm.toLowerCase())).map(c => (
                        <div 
                          key={c.id} 
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700"
                          onClick={() => {
                            setFormData({...formData, classId: c.name});
                            setIsClassDropdownOpen(false);
                            setClassSearchTerm('');
                          }}
                        >
                          {c.name} {c.academicYear ? `(${c.academicYear})` : ''}
                        </div>
                      ))}
                      {schoolClasses.filter(c => c.name.toLowerCase().includes(classSearchTerm.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-sm text-slate-500 italic">Không tìm thấy lớp phù hợp</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label className="text-slate-600">Năm học</Label>
                <select 
                  value={formData.academicYear || ''} 
                  onChange={(e) => setFormData({...formData, academicYear: e.target.value})} 
                  className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  <option value="">-- Chọn năm học --</option>
                  {schoolAcademicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label className="text-slate-600">Tên Phụ Huynh</Label>
                <Input value={formData.parentName || ''} onChange={(e) => setFormData({...formData, parentName: e.target.value})} className="border-slate-200" placeholder="VD: Mẹ bé..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label className="text-slate-600">SĐT Liên Hệ</Label>
                <Input value={formData.parentPhone || ''} onChange={(e) => setFormData({...formData, parentPhone: e.target.value})} className="border-slate-200" placeholder="VD: 0912345678" />
              </div>
            </div>
          </div>

          {/* Khoản thu */}
          <div className="space-y-4 border border-emerald-100/50 p-4 rounded-xl bg-emerald-50/20">
            <h4 className="font-semibold text-emerald-800 flex items-center gap-2"><div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div> Đăng ký Khoản Thu</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEE_CATEGORIES.map(fee => {
                const checked = formData.feeIds?.includes(fee.id);
                return (
                  <label key={fee.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleFee(fee.id)} />
                    {checked ? <CheckSquare className="w-5 h-5 text-emerald-600 mr-3 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 mr-3 shrink-0" />}
                    <div>
                      <div className={`font-medium ${checked ? 'text-emerald-900' : 'text-slate-700'}`}>{fee.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{fee.id}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Khấu trừ */}
          <div className="space-y-4 border border-amber-100/50 p-4 rounded-xl bg-amber-50/20">
            <h4 className="font-semibold text-amber-800 flex items-center gap-2"><div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Gắn Khấu Trừ / Miễn Giảm</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEDUCTION_CATEGORIES.map(ded => {
                const checked = formData.deductionIds?.includes(ded.id);
                return (
                  <label key={ded.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleDeduction(ded.id)} />
                    {checked ? <CheckSquare className="w-5 h-5 text-amber-600 mr-3 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 mr-3 shrink-0" />}
                    <div>
                      <div className={`font-medium ${checked ? 'text-amber-900' : 'text-slate-700'}`}>{ded.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{ded.id}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
          </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <span className="text-sm text-slate-600">Lịch sử các tháng đã được ghi nhận:</span>
                <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">
                  {studentTuitionHist.length} bản ghi
                </Badge>
              </div>
              
              {studentTuitionHist.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  Chưa có dữ liệu công nợ nào được ghi nhận cho học sinh này.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-medium">Kỳ thu</th>
                        <th className="px-4 py-3 font-medium text-right">Số tiền</th>
                        <th className="px-4 py-3 font-medium text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentTuitionHist.sort((a,b) => b.year - a.year || b.month - a.month).map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">Tháng {t.month}/{t.year}</td>
                          <td className="px-4 py-3 text-right">{(t.total || 0).toLocaleString()}đ</td>
                          <td className="px-4 py-3 text-center">
                            {t.status === 'paid' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Đã đóng</Badge>}
                            {t.status === 'pending' && <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">Chưa đóng</Badge>}
                            {t.status === 'overdue' && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Quá hạn</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Delete */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onEnter={confirmModal.onConfirm}
        title={confirmModal.title}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="border-slate-200 text-slate-600">Huỷ</Button>
            <Button onClick={confirmModal.onConfirm} variant="destructive">Xoá Học Sinh</Button>
          </>
        }
      >
        <p className="text-slate-600">{confirmModal.message}</p>
      </Modal>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onEnter={handleBulkSave}
        title={bulkActionType === 'class' ? 'Chuyển / Đổi lớp hàng loạt' : 'Cập nhật trạng thái hàng loạt'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)} className="border-slate-200 text-slate-600">Huỷ</Button>
            <Button onClick={handleBulkSave} className="bg-blue-600 hover:bg-blue-700 text-white">Xác nhận</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-600 mb-4">Bạn đang chọn thao tác cập nhật cho <strong>{selectedStudentIds.length}</strong> học sinh.</p>
          
          {bulkActionType === 'class' ? (
            <div className="space-y-2">
              <Label className="text-slate-600">Nhập Mã Lớp mới</Label>
              <Input 
                value={bulkClassId} 
                onChange={e => setBulkClassId(e.target.value)} 
                placeholder="VD: 10A1" 
                className="uppercase border-slate-200"
              />
              <div className="bg-amber-50 rounded-lg p-3 mt-3 text-sm flex gap-2 items-start border border-amber-100">
                <span className="shrink-0">💡</span>
                <p className="text-amber-800">
                  <strong>Yên tâm!</strong> Việc chuyển lớp hay cập nhật trạng thái này chỉ áp dụng cho việc tính toán học phí trong <strong>tương lai</strong>. 
                  Toàn bộ dữ liệu công nợ, hóa đơn của <strong>các tháng/năm học cũ</strong> vẫn được bảo lưu nguyên vẹn theo thông tin lóp cũ để bạn dễ dàng đối soát tài chính sau này.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-slate-600">Chọn trạng thái</Label>
              <select 
                className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value as 'active' | 'inactive' | 'graduated')}
              >
                <option value="active">Đang học / Trở lại học</option>
                <option value="inactive">Đã nghỉ học / Chuyển trường</option>
                <option value="graduated">Ra trường / Tốt nghiệp</option>
              </select>
            </div>
          )}
        </div>
      </Modal>

      {/* Import & Mapping Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onEnter={confirmImportData}
        title={`Xem trước dữ liệu import`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)} className="border-slate-200 text-slate-600">Huỷ</Button>
            <Button onClick={confirmImportData} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Upload className="w-4 h-4" /> Xác nhận Nhập dữ liệu
            </Button>
          </>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pb-2">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 text-sm">
            <p>Hệ thống tìm thấy tổng <strong>{importRawData.length}</strong> dòng từ file dữ liệu. <br/>
            Vui lòng kiểm tra đối chiếu các cột chứa dữ liệu tương ứng bên dưới để tránh việc sai lệch dữ liệu.</p>
          </div>

          {(importSheets && importSheets.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700">Gán Năm Học Cho Dữ Liệu Này</Label>
                <Input 
                  placeholder="VD: 2024-2025" 
                  value={importAcademicYear}
                  onChange={(e) => setImportAcademicYear(e.target.value)}
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Chọn Sheet muốn thêm vào</Label>
                <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  value={selectedImportSheet} onChange={e => setSelectedImportSheet(e.target.value)}>
                  <option value="ALL">-- Thêm từ dữ liệu của TẤT CẢ sheet --</option>
                  {importSheets.map(s => <option key={s} value={s}>Sheet: {s}</option>)}
                </select>
              </div>
            </div>
          )}

          {(!importSheets || importSheets.length === 0) && (
            <div className="space-y-1.5 border-b border-slate-100 pb-4">
              <Label className="text-slate-700">Gán Năm Học Cho Dữ Liệu Này</Label>
              <Input 
                placeholder="VD: 2024-2025" 
                value={importAcademicYear}
                onChange={(e) => setImportAcademicYear(e.target.value)}
                className="border-slate-200"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-700">Cột: Mã Học Sinh</Label>
              <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                value={mapColLastName} onChange={e => setMapColLastName(e.target.value)}>
                <option value="">-- Bỏ qua --</option>
                {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Cột: Họ Tên Học Sinh <span className="text-red-500">*</span></Label>
              <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                value={mapColFirstName} onChange={e => setMapColFirstName(e.target.value)}>
                <option value="">-- Vui lòng chọn cột Tên --</option>
                {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Cột: Lớp học</Label>
              <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                value={mapColClass} onChange={e => setMapColClass(e.target.value)}>
                <option value="">-- Mặc định: Lấy theo Khối Sheet Excel / Trống --</option>
                {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Cột: SĐT Liên Hệ</Label>
              <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                value={mapColPhone} onChange={e => setMapColPhone(e.target.value)}>
                <option value="">-- Bỏ qua --</option>
                {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 italic">Công nợ: Tháng (1-12)</Label>
              <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
                value={mapColMonth} onChange={e => setMapColMonth(e.target.value)}>
                <option value="">-- Tự nhận diện từ tên Sheet --</option>
                {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 italic">Công nợ: Số tiền (VNĐ)</Label>
              <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
                value={mapColFeeAmount} onChange={e => setMapColFeeAmount(e.target.value)}>
                <option value="">-- Có thể bỏ qua nếu k có học phí --</option>
                {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-slate-700 italic">Công nợ: Tình trạng (Đã nộp, Chưa...)</Label>
              <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
                value={mapColFeeStatus} onChange={e => setMapColFeeStatus(e.target.value)}>
                <option value="">-- Hệ thống tự xét dựa vào số tiền / cột này --</option>
                {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Xem trước kết quả ({selectedImportSheet === 'ALL' ? 'Tất cả sheet' : selectedImportSheet} - Bỏ qua các dòng trống / không có tên)</Label>
            <div className="bg-slate-50 border border-slate-100 rounded-lg overflow-hidden text-sm max-h-[160px] overflow-y-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-100/50 text-slate-500 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">Mã Học Sinh</th>
                    <th className="px-3 py-2 font-medium">Họ & Tên</th>
                    <th className="px-3 py-2 font-medium">Lớp</th>
                    <th className="px-3 py-2 font-medium text-amber-700">Tháng (Công nợ)</th>
                    <th className="px-3 py-2 font-medium text-amber-700">Số Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedImportSheet === 'ALL' ? importRawData : importRawData.filter(r => r._sheetName === selectedImportSheet))
                    .filter(row => {
                      const f = mapColFirstName ? row[mapColFirstName] : '';
                      return (f || '').toString().trim();
                    })
                    .slice(0, 5) // Show top 5 instead of 3 for better preview
                    .map((row, idx) => {
                    const l = mapColLastName ? row[mapColLastName] : '';
                    const f = mapColFirstName ? row[mapColFirstName] : '';
                    const full = (f || '').toString().trim();
                    const importedId = (l || '').toString().trim();
                    const c = mapColClass ? row[mapColClass] : (row['_sheetName'] || 'Chưa xếp lớp');
                    
                    let monthStr = mapColMonth ? row[mapColMonth]?.toString() : '';
                    if (!monthStr) {
                      const sheetConfig = row['_sheetName']?.toString().toLowerCase() || '';
                      if (sheetConfig.includes('tháng') || sheetConfig.includes('thang') || sheetConfig.match(/^t\d+/)) {
                        const mMatch = sheetConfig.match(/\d+/);
                        if (mMatch) monthStr = mMatch[0];
                      }
                    } else {
                      const mm = monthStr.match(/\d+/);
                      if (mm) monthStr = mm[0];
                    }

                    const feeAmountRaw = mapColFeeAmount ? row[mapColFeeAmount]?.toString().replace(/[^\d]/g, '') : '0';
                    const feeAmount = parseInt(feeAmountRaw || '0');

                    return (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-slate-500 font-mono text-xs">{importedId || '-'}</td>
                        <td className="px-3 py-2 font-medium text-slate-700">{full}</td>
                        <td className="px-3 py-2 text-slate-600">{c}</td>
                        <td className="px-3 py-2 text-amber-700">{monthStr ? `T${monthStr}` : '-'}</td>
                        <td className="px-3 py-2 text-amber-700">{feeAmount > 0 ? feeAmount.toLocaleString() : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </Modal>

      {/* Import Success Modal */}
      <Modal
        isOpen={isImportSuccessModalOpen}
        onClose={() => setIsImportSuccessModalOpen(false)}
        title="Nhập dữ liệu thành công!"
        footer={
          <Button onClick={() => setIsImportSuccessModalOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
            Đã hiểu & Đóng
          </Button>
        }
      >
        <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckSquare className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800">Hoàn tất nhập liệu</h3>
            <p className="text-slate-600">
              Bạn đã nhập thành công <strong>{importSuccessCount}</strong> học sinh vào hệ thống. Các học sinh đã được phân bổ vào các lớp tương ứng.
            </p>
          </div>
        </div>
      </Modal>

    </div>
  );
}
