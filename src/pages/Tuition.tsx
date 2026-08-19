import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FileText, Send, Search, Trash2, Plus, Upload, Download, CheckCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import Papa from 'papaparse';
import { getFees, getDeductions, getAcademicStartMonth, getAcademicYearString, getAcademicMonthsOrder } from '../lib/fees';

export default function Tuition() {
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Dynamic Categories from LocalStorage
  const FEE_CATEGORIES = getFees().map(f => ({ ...f, price: f.defaultAmount }));
  const DEDUCTION_CATEGORIES = getDeductions().map(d => ({ ...d, value: d.type === 'percentage' ? d.defaultAmount : -d.defaultAmount }));
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const initialAcademicYear = getAcademicYearString(currentMonth, currentYear);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(initialAcademicYear);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [isEditing, setIsEditing] = useState(false);
  const [editRecordId, setEditRecordId] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    studentId: '',
    name: '',
    class: '',
    month: currentMonth,
    year: currentYear,
    total: 0,
    status: 'pending'
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalRecord, setDetailModalRecord] = useState<any>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importRawData, setImportRawData] = useState<any[]>([]);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [mapColStudentId, setMapColStudentId] = useState('');
  const [mapColMonth, setMapColMonth] = useState('');
  const [mapColAmount, setMapColAmount] = useState('');
  const [mapColStatus, setMapColStatus] = useState('');

  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [createFormFeeDetails, setCreateFormFeeDetails] = useState<any[]>([]);

  useEffect(() => {
    if (isCreateModalOpen && !isEditing) {
      const selectedStudent = studentsList.find(s => s.studentId === createFormData.studentId || s.name === createFormData.name);
      if (selectedStudent) {
        let details: any[] = [];
        const mNum = Number(createFormData.month);
        selectedStudent.feeIds?.forEach((fId: string) => {
          const f = FEE_CATEGORIES.find(x => x.id === fId);
          if (f) {
            let price = f.price || 0;
            if (f.type === 'once' || f.type === 'yearly') {
              if (mNum !== getAcademicStartMonth() && mNum !== getAcademicStartMonth() + 1) price = 0;
            }
            if (price > 0) {
              details.push({ feeId: f.id, name: f.name, expected: price, paid: price, checked: true });
            }
          }
        });
        selectedStudent.deductionIds?.forEach((dId: string) => {
          const d = DEDUCTION_CATEGORIES.find(x => x.id === dId);
          if (d) {
            let discount = d.value || 0;
            if (d.type === 'once' || d.type === 'yearly') {
              if (mNum !== getAcademicStartMonth() && mNum !== getAcademicStartMonth() + 1) discount = 0;
            }
            if (discount !== 0) {
              details.push({ feeId: d.id, name: d.name, expected: discount, paid: discount, checked: true });
            }
          }
        });
        setCreateFormFeeDetails(details);
      } else {
        setCreateFormFeeDetails([]);
      }
    }
  }, [createFormData.studentId, createFormData.name, createFormData.month, createFormData.year, isCreateModalOpen, isEditing]);

  useEffect(() => {
    if (isCreateModalOpen && createFormFeeDetails.length > 0) {
      let sum = 0;
      createFormFeeDetails.forEach(d => {
        if (d.expected > 0) {
          if (d.checked) sum += Number(d.paid || 0);
        } else {
          sum += Number(d.paid || 0); // Deductions apply unconditionally to sum
        }
      });
      setCreateFormData(prev => ({ ...prev, total: Math.max(0, sum) }));
    }
  }, [createFormFeeDetails, isCreateModalOpen]);

  const dynamicYears = Array.from(new Set(records.map(r => r.academicYear || getAcademicYearString(r.month, r.year)))).sort((a,b) => (b as string).localeCompare(a as string));
  const academicYears = dynamicYears.length > 0 ? dynamicYears : [
    '2023-2024',
    '2024-2025',
    '2025-2026',
    '2026-2027',
    '2027-2028',
  ];

  useEffect(() => {
    try {
      const stored = localStorage.getItem('demoTuitions');
      if (stored) {
        setRecords(JSON.parse(stored));
      } else {
        // Mock data fallback
        setRecords([
          { id: '1', studentId: 'DT0001', name: 'Nguyễn Văn A', class: '10A1', month: 5, year: 2026, total: 4500000, status: 'overdue', parentEmail: 'parentA@example.com' },
          { id: '2', studentId: 'DT0002', name: 'Trần Thị B', class: '10A1', month: 5, year: 2026, total: 4500000, status: 'paid', parentEmail: 'parentB@example.com' },
          { id: '3', studentId: 'DT0003', name: 'Lê Văn C', class: '10A2', month: 4, year: 2026, total: 3200000, status: 'pending', parentEmail: 'parentC@example.com' },
        ]);
      }
      
      const storedStudents = localStorage.getItem('demoStudents');
      if (storedStudents) {
        setStudentsList(JSON.parse(storedStudents));
      }
    } catch(e) {}
  }, []);

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF() as any;
      doc.setFontSize(16);
      doc.text('BÁO CÁO CÔNG NỢ HỌC PHÍ', 14, 20);
      
      const tableData = records.map(r => [
        r.studentId, r.name, r.class, `Tháng ${r.month}/${r.year}`, 
        r.total.toLocaleString() + ' VND', 
        r.status === 'paid' ? 'Đã thu' : r.status === 'overdue' ? 'Quá hạn' : 'Chưa thu'
      ]);

      doc.autoTable({
        startY: 30,
        head: [['Mã HS', 'Họ Tên', 'Lớp', 'Tháng', 'Tổng Tiền', 'Trạng Thái']],
        body: tableData,
      });

      doc.save('Bao_Cao_Cong_No.pdf');
      toast.success('Đã xuất PDF báo cáo thành công.');
    } catch (err) {
      toast.error('Lỗi khi tải thư viện PDF.');
      console.error(err);
    }
  };

  const handleRemind = (email: string) => {
    toast.success(`Đã gửi email nhắc nhở đến: ${email}`);
  };

  const handleDeleteRecord = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá bản ghi công nợ',
      message: 'Bạn có chắc chắn muốn xoá dòng công nợ này?',
      onConfirm: () => {
        const newRecords = records.filter(r => r.id !== id);
        setRecords(newRecords);
        localStorage.setItem('demoTuitions', JSON.stringify(newRecords));
        toast.success('Đã xoá bản ghi');
        setConfirmModal(prev => ({...prev, isOpen: false}));
      }
    });
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá các bản ghi đã chọn',
      message: `Bạn có chắc muốn xoá ${selectedRows.length} bản ghi công nợ này không?`,
      onConfirm: () => {
        const newRecords = records.filter(r => !selectedRows.includes(r.id));
        setRecords(newRecords);
        localStorage.setItem('demoTuitions', JSON.stringify(newRecords));
        setSelectedRows([]);
        toast.success(`Đã xoá ${selectedRows.length} bản ghi`);
        setConfirmModal(prev => ({...prev, isOpen: false}));
      }
    });
  };

  const handleDeleteAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá TOÀN BỘ công nợ',
      message: 'Bạn có chắc chắn muốn xoá toàn bộ dữ liệu công nợ không? Hành động này không thể hoàn tác.',
      onConfirm: () => {
        localStorage.removeItem('demoTuitions');
        setRecords([]);
        setSelectedRows([]);
        toast.success('Đã xoá toàn bộ dữ liệu công nợ');
        setConfirmModal(prev => ({...prev, isOpen: false}));
      }
    });
  };

  const handleQuickPay = (id: string) => {
    const newRecords = records.map(r => {
      if (r.id === id) {
        const remaining = r.expectedAmount - r.total;
        const newTotal = r.expectedAmount;
        const newFeeDetails = r.feeDetails ? r.feeDetails.map((fd: any) => {
          if (fd.expected > 0) return { ...fd, paid: fd.expected, checked: true };
          return fd;
        }) : [];
        return { ...r, total: newTotal, status: 'paid', feeDetails: newFeeDetails };
      }
      return r;
    });
    setRecords(newRecords);
    localStorage.setItem('demoTuitions', JSON.stringify(newRecords));
    toast.success('Đã xác nhận thu đủ tiền học phí!');
  };

  const handleOpenEdit = (record: any) => {
    setIsEditing(true);
    setEditRecordId(record.id);
    setCreateFormData({
      studentId: record.studentId,
      name: record.name,
      class: record.class,
      month: record.month,
      year: record.year,
      total: record.total,
      status: record.status
    });
    setCreateFormFeeDetails(record.feeDetails ? record.feeDetails.map((fd: any) => ({ ...fd, checked: fd.paid > 0 || fd.expected <= 0 })) : []);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = () => {
    if (!createFormData.studentId && !createFormData.name) {
      toast.error('Vui lòng chọn hoặc nhập tên học sinh');
      return;
    }
    const selectedStudent = studentsList.find(s => s.studentId === createFormData.studentId || s.name === createFormData.name);
    
    let expectedTotal = 0;
    let finalFeeDetails: any[] = [];
    if (createFormFeeDetails.length > 0) {
      createFormFeeDetails.forEach(fd => {
        if (fd.expected > 0) {
          expectedTotal += fd.expected;
          finalFeeDetails.push({ feeId: fd.feeId, name: fd.name, expected: fd.expected, paid: fd.checked ? fd.paid : 0 });
        } else {
          expectedTotal += fd.expected;
          finalFeeDetails.push({ feeId: fd.feeId, name: fd.name, expected: fd.expected, paid: fd.expected });
        }
      });
      expectedTotal = Math.max(0, expectedTotal);
    } else if (selectedStudent) {
      const mNum = Number(createFormData.month);
      selectedStudent.feeIds?.forEach((fId: string) => {
        const f = FEE_CATEGORIES.find(x => x.id === fId);
        if (f) {
          let price = f.price || 0;
          if (f.type === 'once' || f.type === 'yearly') {
            if (mNum !== getAcademicStartMonth() && mNum !== getAcademicStartMonth() + 1) price = 0;
          }
          if (price > 0) {
            expectedTotal += price;
            finalFeeDetails.push({ feeId: f.id, name: f.name, expected: price, paid: price });
          }
        }
      });
      selectedStudent.deductionIds?.forEach((dId: string) => {
        const d = DEDUCTION_CATEGORIES.find(x => x.id === dId);
        if (d) {
          let discount = d.value || 0;
          if (d.type === 'once' || d.type === 'yearly') {
            if (mNum !== getAcademicStartMonth() && mNum !== getAcademicStartMonth() + 1) discount = 0;
          }
          if (discount !== 0) {
            expectedTotal += discount;
            finalFeeDetails.push({ feeId: d.id, name: d.name, expected: discount, paid: discount });
          }
        }
      });
      expectedTotal = Math.max(0, expectedTotal);
      
      // Auto allocation if manual details weren't used
      let remainingAlloc = Number(createFormData.total);
      finalFeeDetails.forEach(fd => {
         if (fd.expected > 0) {
            if (remainingAlloc >= fd.expected) {
               fd.paid = fd.expected;
               remainingAlloc -= fd.expected;
            } else if (remainingAlloc > 0) {
               fd.paid = remainingAlloc;
               remainingAlloc = 0;
            } else {
               fd.paid = 0;
            }
         }
      });
    }

    let st = createFormData.status;
    const amt = Number(createFormData.total);
    if (st === 'pending' || st === 'partial') {
       if (amt >= expectedTotal && expectedTotal > 0) st = 'paid';
       else if (amt > 0 && amt < expectedTotal) st = 'partial';
       else if (amt === 0) st = 'pending';
    }

    const newRecord = {
      id: isEditing ? editRecordId : Date.now().toString() + Math.random().toString(36).substring(7),
      studentId: selectedStudent?.studentId || createFormData.studentId || 'DT' + Date.now().toString().slice(-4),
      name: selectedStudent?.name || createFormData.name,
      class: selectedStudent?.classId || createFormData.class || 'Chưa xếp lớp',
      month: Number(createFormData.month),
      year: Number(createFormData.year),
      total: amt,
      expectedAmount: expectedTotal,
      feeDetails: finalFeeDetails,
      status: st,
      academicYear: getAcademicYearString(Number(createFormData.month), Number(createFormData.year))
    };

    let newRecords;
    if (isEditing) {
      newRecords = records.map(r => r.id === editRecordId ? newRecord : r);
    } else {
      newRecords = [...records, newRecord];
    }
    
    setRecords(newRecords);
    localStorage.setItem('demoTuitions', JSON.stringify(newRecords));
    toast.success(isEditing ? 'Đã cập nhật công nợ / thu tiền thành công' : 'Đã thêm công nợ thành công');
    setIsCreateModalOpen(false);
    setIsEditing(false);
    setEditRecordId('');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setImportRawData(results.data);
            const cols = Object.keys(results.data[0] as any);
            setImportColumns(cols);
            
            const detect = (keywords: string[]) => cols.find(c => keywords.some(k => c.toLowerCase().includes(k))) || '';
            setMapColStudentId(detect(['mã', 'ma', 'tên', 'ten', 'họ', 'hsw']));
            setMapColMonth(detect(['tháng', 'thang']));
            setMapColAmount(detect(['tiền', 'phí', 'thu']));
            setMapColStatus(detect(['trạng thái', 'nợ', 'thực tế']));

            setImportFileName(file.name);
            setIsImportModalOpen(true);
          }
        }
      });
    } else {
      toast.error('Giai đoạn này hỗ trợ file CSV. Vui lòng Save As file Excel sang CSV (Comma delimited).');
    }
  };

  const handleImportSubmit = () => {
    if (!mapColStudentId) {
      toast.error('Vui lòng chọn ít nhất Cột Nhận Diện (Mã hoặc Tên) !');
      return;
    }
    
    let addedCount = 0;
    const newRecords = [...records];

    importRawData.forEach((row: any) => {
      const studentIdentifier = row[mapColStudentId]?.toString().trim();
      if (!studentIdentifier) return;

      const stu = studentsList.find(s => s.studentId === studentIdentifier || s.name === studentIdentifier);
      const studentId = stu ? stu.studentId : (studentIdentifier.includes('DT') ? studentIdentifier : `DT${Date.now().toString().slice(-4)}`);
      const name = stu ? stu.name : studentIdentifier;
      const classId = stu ? stu.classId : 'Chưa xếp lớp';

      // Check for horizontal month columns
      const monthColumns = Object.keys(row).filter(k => k.toLowerCase().match(/^th[áa]ng\s*(\d+)$/));
      if (monthColumns.length > 0) {
        monthColumns.forEach(mCol => {
          const mMatch = mCol.match(/\d+/);
          if (mMatch) {
            const mNum = parseInt(mMatch[0]);
            const amountRawStr = row[mCol]?.toString().trim();
            if (amountRawStr !== undefined) {
              const amt = parseInt(amountRawStr.replace(/[^\d]/g, '') || '0');
              
              // Calculate expected total based on student fees
              let expectedTotal = 0;
              let feeDetails: any[] = [];
              if (stu) {
                stu.feeIds?.forEach((fId: string) => {
                  const f = FEE_CATEGORIES.find(x => x.id === fId);
                  if (f) {
                    let price = f.price || 0;
                    if (f.type === 'once' || f.type === 'yearly') {
                      if (mNum !== getAcademicStartMonth() && mNum !== getAcademicStartMonth() + 1) price = 0; // Usually collect once/yearly fees in Aug/Sep
                    }
                    if (price > 0) {
                      expectedTotal += price;
                      feeDetails.push({ feeId: f.id, name: f.name, expected: price, paid: 0 });
                    }
                  }
                });
                stu.deductionIds?.forEach((dId: string) => {
                  const d = DEDUCTION_CATEGORIES.find(x => x.id === dId);
                  if (d) {
                    let discount = d.value || 0;
                    if (d.type === 'once' || d.type === 'yearly') {
                      if (mNum !== getAcademicStartMonth() && mNum !== getAcademicStartMonth() + 1) discount = 0;
                    } else if (d.type === 'percentage') {
                      // Apply percentage logic - simplified
                    }
                    if (discount !== 0) {
                      expectedTotal += discount;
                      feeDetails.push({ feeId: d.id, name: d.name, expected: discount, paid: discount });
                    }
                  }
                });
                expectedTotal = Math.max(0, expectedTotal);
              }

              // Allocate paid amount
              let remainingAlloc = amt;
              feeDetails.forEach(fd => {
                 if (fd.expected > 0) {
                    if (remainingAlloc >= fd.expected) {
                       fd.paid = fd.expected;
                       remainingAlloc -= fd.expected;
                    } else if (remainingAlloc > 0) {
                       fd.paid = remainingAlloc;
                       remainingAlloc = 0;
                    }
                 }
              });

              let st = 'pending';
              if (amt >= expectedTotal && expectedTotal > 0) {
                st = 'paid';
              } else if (amt > 0 && amt < expectedTotal) {
                st = 'partial';
              } else if (amt === 0 && amountRawStr === '') {
                // If it's literally empty, they owe the expected amount
                st = 'pending';
              } else if (amt > 0) {
                st = 'paid';
              }
              
              let y = currentYear;
              newRecords.push({
                id: Date.now().toString() + Math.random().toString(36).substring(7) + mNum,
                studentId,
                name,
                class: classId,
                month: mNum,
                year: y,
                total: amt, // Amount Paid
                expectedAmount: expectedTotal,
                feeDetails, // Breakdown details
                status: st,
                academicYear: getAcademicYearString(mNum, y)
              });
              addedCount++;
            }
          }
        });
      } else {
        let m = currentMonth;
        let y = currentYear;
        if (mapColMonth) {
          const mStr = row[mapColMonth]?.toString();
          const mMatch = mStr?.match(/\d+/);
          if (mMatch) m = parseInt(mMatch[0]);
        }

        let amt = 0;
        if (mapColAmount) {
          amt = parseInt(row[mapColAmount]?.toString().replace(/[^\d]/g, '') || '0');
        }

        let st = 'pending';
        if (mapColStatus) {
          const sRaw = row[mapColStatus]?.toString().toLowerCase() || '';
          if (sRaw.includes('đã') || sRaw.includes('ok')) st = 'paid';
          else if (sRaw.includes('thiếu') || sRaw.includes('một phần')) st = 'partial';
          else if (sRaw.includes('nợ') || sRaw.includes('chưa')) st = 'overdue';
        } else {
          if (amt > 0) st = 'paid';
        }

        newRecords.push({
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          studentId,
          name,
          class: classId,
          month: m,
          year: y,
          total: amt,
          status: st,
          academicYear: getAcademicYearString(m, y)
        });
        addedCount++;
      }
    });

    setRecords(newRecords);
    localStorage.setItem('demoTuitions', JSON.stringify(newRecords));
    toast.success(`Đã import thành công ${addedCount} bản ghi công nợ!`);
    setIsImportModalOpen(false);
    setImportRawData([]);
  };

  const filtered = records.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordAcademicYear = r.academicYear || getAcademicYearString(r.month, r.year);
    const matchAcademicYear = selectedAcademicYear === '' || recordAcademicYear === selectedAcademicYear;
    
    const matchMonth = selectedMonth === '' || r.month === Number(selectedMonth);
    const matchStatus = selectedStatus === '' || r.status === selectedStatus;

    return matchSearch && matchAcademicYear && matchMonth && matchStatus;
  });

  const handleDownloadTemplate = () => {
    const feeNames = FEE_CATEGORIES.map(f => f.name).join(',');
    const monthsOrder = getAcademicMonthsOrder();
    const monthsHeader = monthsOrder.map(m => `Tháng ${m}`).join(',');
    let csvContent = `data:text/csv;charset=utf-8,\uFEFFMã Học Sinh,Họ Tên,Lớp học,${feeNames},Khấu trừ,Tổng Cần Thu/Tháng,${monthsHeader}\n`;
    
    if (studentsList.length > 0) {
       studentsList.forEach(s => {
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
         
         const deductionStr = (s.deductionIds || []).map((id: string) => {
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
           ...feeChecks,
           deductionStr,
           expectedTotal.toString()
         ];
         for (let i = 0; i < 12; i++) row.push('');
         csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + "\n";
       });
    } else {
       csvContent += `DT0001,Nguyễn Văn A,10A1,${FEE_CATEGORIES.map(f => f.id === 'FEE_TUITION' || f.id === 'FEE_BUS' ? 'x' : '').join(',')},MG_CON_GV,4500000,4500000,,,,,,,,,,,\n`;
       csvContent += `DT0002,Trần Thị B,11B1,${FEE_CATEGORIES.map(f => f.id === 'FEE_TUITION' || f.id === 'FEE_BOARDING' ? 'x' : '').join(',')},,5500000,,5500000,,,,,,,,,,`;
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Mau_Import_Cong_No.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Công Nợ & Học Phí</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDeleteAll} className="border-red-200 text-red-600 hover:bg-red-50">
            Xoá Dữ liệu Toàn bộ
          </Button>
          <Button variant="outline" onClick={handleDownloadTemplate} className="border-slate-200">
            <Download className="w-4 h-4 mr-2" /> Tải Mẫu CSV
          </Button>
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
            <Upload className="w-4 h-4 mr-2" /> Import Excel
          </Button>
          <Button onClick={handleExportPDF} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-sm">
            <FileText className="w-4 h-4" /> Xuất Báo Cáo PDF
          </Button>
          <Button onClick={() => {
            setIsEditing(false);
            setEditRecordId('');
            setCreateFormData({
              studentId: '', name: '', class: '', month: currentMonth, year: currentYear, total: 0, status: 'pending'
            });
            setCreateFormFeeDetails([]);
            setIsCreateModalOpen(true);
          }} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Thêm công nợ
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tra cứu mã HS hoặc Tên..."
              className="pl-9 bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <select 
              className="bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 flex-1 lg:flex-none min-w-[140px]"
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
            >
              <option value="">Tất cả Năm học</option>
              {academicYears.map(year => (
                <option key={year} value={year}>Năm học {year}</option>
              ))}
            </select>
            <select 
              className="bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 flex-1 lg:flex-none"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">Tất cả Tháng</option>
              {[...Array(12)].map((_, i) => <option key={i} value={i+1}>Tháng {i+1}</option>)}
            </select>
            <select 
              className="bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 flex-1 lg:flex-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="overdue">Quá hạn</option>
              <option value="pending">Chưa đóng</option>
              <option value="partial">Thiếu một phần</option>
              <option value="paid">Đã đóng</option>
            </select>
          </div>
        </div>

        {selectedRows.length > 0 && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-red-800 font-medium">
              Đã chọn {selectedRows.length} bản ghi
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleBulkDelete} className="border-red-200 text-red-700 hover:bg-red-100">
                Xoá Đã Chọn
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedRows([])} className="text-slate-500 hover:bg-white hover:text-slate-700">
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-50 bg-white">
                <th className="px-6 py-4 font-semibold w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-4 h-4"
                    checked={selectedRows.length === filtered.length && filtered.length > 0}
                    onChange={(e) => setSelectedRows(e.target.checked ? filtered.map(r => r.id) : [])}
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Mã HS / Họ tên</th>
                <th className="px-6 py-4 font-semibold text-center">Kỳ thu</th>
                <th className="px-6 py-4 font-semibold text-right">Chi tiết phí</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {filtered.map(r => {
                const debt = (r.expectedAmount || 0) - r.total;
                return (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-4 h-4 mt-1"
                      checked={selectedRows.includes(r.id)}
                      onChange={(e) => setSelectedRows(prev => e.target.checked ? [...prev, r.id] : prev.filter(id => id !== r.id))}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{r.studentId}</div>
                    <div className="text-xs text-slate-500 group/name relative cursor-help w-max">
                      {r.name}
                      {/* Hover tooltip for student fees and deductions */}
                      <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs bg-slate-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover/name:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                        {(() => {
                          const stu = studentsList.find(s => s.studentId === r.studentId);
                          if (!stu) return <div className="text-slate-400">Không có dữ liệu học sinh</div>;
                          const feeNames = (stu.feeIds && stu.feeIds.length > 0) ? stu.feeIds.map((fid: string) => FEE_CATEGORIES.find(f => f.id === fid)?.name).filter(Boolean).join(', ') : 'Không có';
                          const dedNames = (stu.deductionIds && stu.deductionIds.length > 0) ? stu.deductionIds.map((did: string) => DEDUCTION_CATEGORIES.find(d => d.id === did)?.name).filter(Boolean).join(', ') : 'Không có';
                          return (
                            <>
                              <div className="font-bold border-b border-slate-600 pb-1 mb-2">Các khoản phí & Khấu trừ (Mặc định)</div>
                              <div className="space-y-1 text-left">
                                <div><span className="text-slate-400">Phí:</span> {feeNames}</div>
                                <div><span className="text-slate-400">Khấu trừ:</span> {dedNames}</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">
                    T{r.month}/{r.year}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status === 'paid' ? (
                      <div className="flex flex-col items-end">
                        <div className="font-bold text-green-600">{r.total.toLocaleString()} ₫</div>
                        {r.feeDetails && r.feeDetails.length > 0 && (
                          <button onClick={() => { setDetailModalRecord(r); setIsDetailModalOpen(true); }} className="text-xs text-blue-600 hover:underline mt-1 focus:outline-none">Xem chi tiết</button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="text-xs text-slate-500">Cần thu: {(r.expectedAmount || 0).toLocaleString()} ₫</div>
                        <div className="font-bold text-red-600">Nợ: {Math.max(0, debt).toLocaleString()} ₫</div>
                        {r.feeDetails && r.feeDetails.length > 0 && (
                          <button onClick={() => { setDetailModalRecord(r); setIsDetailModalOpen(true); }} className="text-xs text-blue-600 hover:underline mt-1 focus:outline-none">Xem chi tiết</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {r.status === 'paid' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none text-xs rounded-md px-2">Đã đóng</Badge>}
                    {r.status === 'pending' && <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none shadow-none text-xs rounded-md px-2">Chưa đóng</Badge>}
                    {r.status === 'overdue' && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none shadow-none text-xs rounded-md px-2">Quá hạn</Badge>}
                    {r.status === 'partial' && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none shadow-none text-xs rounded-md px-2">Đóng thiếu</Badge>}
                  </td>
                  <td className="px-6 py-4 flex items-center justify-end gap-2">
                    {r.status !== 'paid' && (
                      <Button size="sm" onClick={() => handleQuickPay(r.id)} className="bg-green-600 hover:bg-green-700 text-white shadow-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" /> Thu đủ
                      </Button>
                    )}
                    {r.status === 'overdue' && (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRemind(r.parentEmail)}>
                        <Send className="w-3 h-3 mr-2" /> Nhắc nợ
                      </Button>
                    )}
                    {r.status === 'partial' && (
                      <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50" onClick={() => handleRemind(r.parentEmail)}>
                        <Send className="w-3 h-3 mr-2" /> Nhắc nợ
                      </Button>
                    )}
                    {r.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleRemind(r.parentEmail)} className="text-slate-600 border-slate-200">
                        Nhắc Đóng
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(r)} title="Cập nhật / Thu tiền">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteRecord(r.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onEnter={confirmModal.onConfirm}
        title={confirmModal.title}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="border-slate-200 text-slate-600">Huỷ</Button>
            <Button onClick={confirmModal.onConfirm} variant="destructive">Xác nhận Xoá</Button>
          </>
        }
      >
        <p className="text-slate-600">{confirmModal.message}</p>
      </Modal>

      {/* Create / Edit Tuition Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={isEditing ? "Cập nhật Công Nợ / Thu Tiền" : "Thêm Công Nợ Mới"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="border-slate-200">Huỷ</Button>
            <Button onClick={handleCreateSubmit} className="bg-blue-600 text-white hover:bg-blue-700">{isEditing ? "Lưu Cập Nhật" : "Lưu Công Nợ"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Nhập Mã hoặc Tên Học Sinh <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ví dụ: DT0001 hoặc Nguyễn Văn A..."
                value={createFormData.studentId}
                onChange={e => setCreateFormData({...createFormData, studentId: e.target.value, name: e.target.value})}
              />
              <p className="text-xs text-slate-500">Hệ thống sẽ tự khớp với danh sách học sinh. Nếu không khớp, sẽ tạo mới riêng rẽ bên công nợ.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Tháng nợ</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={createFormData.month} onChange={e => setCreateFormData({...createFormData, month: Number(e.target.value)})}>
                {[...Array(12)].map((_, i) => <option key={i} value={i+1}>Tháng {i+1}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Năm</Label>
              <Input
                type="number"
                value={createFormData.year}
                onChange={e => setCreateFormData({...createFormData, year: Number(e.target.value)})}
              />
            </div>

            {createFormFeeDetails.length > 0 ? (
              <div className="col-span-2 space-y-3 mt-2 border-t pt-4">
                <Label>Chi tiết các khoản phí (Tháng {createFormData.month}/{createFormData.year})</Label>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                  {createFormFeeDetails.map((fd, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-slate-300"
                          checked={fd.checked}
                          onChange={(e) => {
                            const newDetails = [...createFormFeeDetails];
                            newDetails[idx].checked = e.target.checked;
                            setCreateFormFeeDetails(newDetails);
                          }}
                        />
                        <div className="flex-1 w-full max-w-[200px]">
                          <p className="font-medium text-sm text-slate-800">{fd.name}</p>
                          {fd.expected > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500 whitespace-nowrap">Yêu cầu:</span>
                              <Input
                                type="number"
                                className="h-6 text-xs px-2 py-0"
                                value={fd.expected}
                                disabled={!fd.checked}
                                onChange={(e) => {
                                  const newDetails = [...createFormFeeDetails];
                                  newDetails[idx].expected = Number(e.target.value);
                                  // Optionally auto-update paid if it matches the old expected
                                  setCreateFormFeeDetails(newDetails);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      {fd.expected > 0 ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-slate-500 whitespace-nowrap">Thực đóng:</Label>
                            <Input
                              type="number"
                              className="w-28 h-8 text-right font-medium"
                              value={fd.paid || ''}
                              disabled={!fd.checked}
                              onChange={(e) => {
                                const newDetails = [...createFormFeeDetails];
                                newDetails[idx].paid = Number(e.target.value);
                                setCreateFormFeeDetails(newDetails);
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-slate-500 whitespace-nowrap">Giảm trừ:</Label>
                            <Input
                              type="number"
                              className="w-28 h-8 text-right font-medium text-emerald-600"
                              value={Math.abs(fd.expected) || ''}
                              disabled={!fd.checked}
                              onChange={(e) => {
                                const newDetails = [...createFormFeeDetails];
                                const val = -Math.abs(Number(e.target.value));
                                newDetails[idx].expected = val;
                                newDetails[idx].paid = val;
                                setCreateFormFeeDetails(newDetails);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                  <span className="font-semibold text-blue-900">Tổng cộng (Thực đóng):</span>
                  <span className="font-bold text-blue-700 text-lg">{createFormData.total.toLocaleString()} ₫</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Tổng số tiền đóng (VNĐ)</Label>
                <Input
                  type="number"
                  value={createFormData.total}
                  onChange={e => setCreateFormData({...createFormData, total: Number(e.target.value)})}
                />
              </div>
            )}
            
            <div className="space-y-1.5 col-span-2">
              <Label>Trạng thái</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={createFormData.status} onChange={e => setCreateFormData({...createFormData, status: e.target.value})}>
                <option value="pending">Chưa đóng</option>
                <option value="paid">Đã đóng toàn bộ</option>
                <option value="partial">Thiếu một phần</option>
                <option value="overdue">Quá hạn</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Import Tuition Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title={importRawData.length === 0 ? "Nhập Công Nợ Từ Excel" : "Ghép Cột Dữ Liệu Công Nợ"}
        size="lg"
        footer={
          importRawData.length === 0 ? undefined : (
            <>
              <Button variant="outline" onClick={() => { setIsImportModalOpen(false); setImportRawData([]); }} className="border-slate-200">Huỷ bỏ</Button>
              <Button onClick={handleImportSubmit} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                <Upload className="w-4 h-4" /> Xác nhận Import
              </Button>
            </>
          )
        }
      >
        {importRawData.length === 0 ? (
          <div className="text-center py-6">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="import-csv"
              onChange={handleImportFile}
            />
            <label
              htmlFor="import-csv"
              className="cursor-pointer inline-flex items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-8 py-10 transition-colors hover:border-slate-400 hover:bg-slate-100"
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-slate-400" />
                <span className="font-medium text-slate-600">Bấm để chọn file CSV</span>
                <span className="text-xs text-slate-500">Vui lòng lưu file Excel (xlsx) sang định dạng CSV (Comma delimited)</span>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg">
              <p>Hệ thống tìm thấy <strong>{importRawData.length}</strong> dòng công nợ trong file chức năng. Vui lòng nối các cột trong file CSV với các cột dữ liệu hệ thống yêu cầu dưới đây:</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <Label className="text-blue-900 font-semibold text-sm drop-shadow-sm">Cột Nhận Diện (Bắt buộc) <span className="text-red-500">*</span></Label>
                <select className="w-full border-blue-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
                  value={mapColStudentId} onChange={e => setMapColStudentId(e.target.value)}>
                  <option value="">-- Cột Mã HS hoặc Tên HS --</option>
                  {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-[11px] text-slate-500 italic mt-1">Cột này để tìm xem học sinh đã có sẵn trong ứng dụng hay chưa.</p>
              </div>

              <div className="space-y-1.5">
               <Label className="text-slate-700">Cột "Tháng" nợ</Label>
                <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                  value={mapColMonth} onChange={e => setMapColMonth(e.target.value)}>
                  <option value="">-- Mặc định lấy tháng hiện tại --</option>
                  {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
               <Label className="text-slate-700">Cột "Số Tiền"</Label>
                <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                  value={mapColAmount} onChange={e => setMapColAmount(e.target.value)}>
                  <option value="">-- Nếu học sinh không phát sinh phí cứ để trống --</option>
                  {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div className="space-y-1.5">
               <Label className="text-slate-700">Cột "Tình trạng" (Đã đóng/Chưa)</Label>
                <select className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                  value={mapColStatus} onChange={e => setMapColStatus(e.target.value)}>
                  <option value="">-- Hệ thống tự xem xét số tiền để phán đoán --</option>
                  {importColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Tuition Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setDetailModalRecord(null); }}
        title="Chi Tiết Đóng Tiền"
        size="md"
        footer={
          <Button onClick={() => setIsDetailModalOpen(false)} className="bg-slate-800 text-white hover:bg-slate-900">Đóng</Button>
        }
      >
        {detailModalRecord && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">{detailModalRecord.name}</p>
                <p className="text-sm text-slate-500">Kỳ thu: Tháng {detailModalRecord.month}/{detailModalRecord.year}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Đã đóng tổng</p>
                <p className="font-bold text-green-600 text-lg">{detailModalRecord.total?.toLocaleString() || 0} ₫</p>
              </div>
            </div>

            <h4 className="font-semibold text-slate-700 border-b pb-2">Phân bổ khoản thu</h4>
            {detailModalRecord.feeDetails && detailModalRecord.feeDetails.length > 0 ? (
              <div className="space-y-2">
                {detailModalRecord.feeDetails.map((fd: any, idx: number) => {
                  const debt = fd.expected > 0 ? fd.expected - (fd.paid || 0) : 0;
                  return (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-dashed border-slate-100 last:border-0">
                      <div className="flex-1">
                        <span className="font-medium text-slate-700">{fd.name}</span>
                        {fd.expected < 0 && <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-none px-1 py-0 shadow-none text-[10px]">Giảm trừ</Badge>}
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="text-sm">
                          <span className="text-slate-500">Yêu cầu: </span>
                          <span className="font-medium">{fd.expected.toLocaleString()} ₫</span>
                        </div>
                        {fd.expected > 0 && (
                          <div className="text-xs mt-1">
                            {fd.paid >= fd.expected ? (
                              <span className="text-green-600 bg-green-50 px-1 rounded">Đã đóng đủ ({fd.paid?.toLocaleString()} ₫)</span>
                            ) : (
                              <span className="text-red-600 bg-red-50 px-1 rounded">
                                Đã đóng {fd.paid?.toLocaleString() || 0} ₫ - Nợ: {debt.toLocaleString()} ₫
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic py-4">Không có thông tin chi tiết từng khoản thu.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
