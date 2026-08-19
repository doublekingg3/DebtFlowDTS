import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Download, Upload, Trash2, Edit2, Layers, BookOpen, FileSpreadsheet, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { getAcademicYears, saveAcademicYears, getClasses, saveClasses } from '../lib/schoolData';


// Define the educational levels and programs
const INITIAL_LEVELS = [
  { id: '1', name: 'Cấp 1' },
  { id: '2', name: 'Cấp 2' },
  { id: '3', name: 'Cấp 3' },
];

const INITIAL_PROGRAMS = [
  { id: 'p_qt', name: 'Hệ Quốc Tế', levelId: '3' },
  { id: 'p_ie', name: 'Hệ IE', levelId: '3' },
  { id: 'p_pe', name: 'Hệ PE', levelId: '3' },
  { id: 'p_standard', name: 'Hệ Chuẩn', levelId: '1' },
  { id: 'p_standard2', name: 'Hệ Chuẩn', levelId: '2' },
];

export default function Classes() {
  const [eduLevels, setEduLevels] = useState(INITIAL_LEVELS);
  const [programs, setPrograms] = useState(INITIAL_PROGRAMS);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  
  useEffect(() => {
    setClasses(getClasses());
    setAcademicYears(getAcademicYears());
  }, []);

  const updateClasses = (newClasses: any[]) => {
    setClasses(newClasses);
    saveClasses(newClasses);
  };

  const updateAcademicYears = (newYears: string[]) => {
    setAcademicYears(newYears);
    saveAcademicYears(newYears);
  };

  const [newClassName, setNewClassName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('3');
  const [selectedProgram, setSelectedProgram] = useState('p_qt');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

  // Fallback to latest year
  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      setSelectedAcademicYear(academicYears[academicYears.length - 1]);
    }
  }, [academicYears, selectedAcademicYear]);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'prompt';
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: (value?: string) => void;
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [promptValue, setPromptValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
    setModalConfig({ isOpen: true, type: 'confirm', title, message, onConfirm, isDestructive });
  };

  const openPrompt = (title: string, message: string, initialValue: string, onConfirm: (val: string) => void) => {
    setPromptValue(initialValue);
    setModalConfig({ isOpen: true, type: 'prompt', title, message, onConfirm });
  };

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const handleModalConfirm = () => {
    if (modalConfig.type === 'prompt') {
      if (!promptValue.trim()) {
        toast.error('Vui lòng nhập nội dung hợp lệ');
        return;
      }
      modalConfig.onConfirm(promptValue);
    } else {
      modalConfig.onConfirm();
    }
    closeModal();
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      toast.error('Vui lòng nhập tên lớp');
      return;
    }
    const newId = Date.now().toString();
    updateClasses([...classes, {
      id: newId,
      name: newClassName,
      levelId: selectedLevel,
      programId: selectedProgram,
      academicYear: selectedAcademicYear,
      studentCount: 0
    }]);
    setNewClassName('');
    toast.success('Đã thêm lớp học mới');
  };

  const handleDeleteClass = (id: string) => {
    openConfirm(
      'Xoá lớp học',
      'Bạn có chắc chắn muốn xoá lớp này không? (Sẽ được đưa vào thùng rác 25 ngày)',
      () => {
        updateClasses(classes.filter(c => c.id !== id));
        toast.success('Đã đưa lớp học vào thùng rác');
      },
      true
    );
  };

  const handleDeleteAllClasses = () => {
    openConfirm(
      'Xoá toàn bộ lớp học',
      'Bạn có chắc chắn muốn xoá toàn bộ lớp học không? Hành động này sẽ xoá sạch danh sách các lớp hiện tại.',
      () => {
        updateClasses([]);
        toast.success('Đã xoá toàn bộ dữ liệu lớp học');
      },
      true
    );
  };

  const handleDownloadTemplate = () => {
    // Generate a simple CSV content
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
      "Tên Lớp,Mã Cấp Học (1,2,3),Mã Hệ (p_qt, p_ie, p_pe)\n" +
      "10A3,3,p_qt\n" +
      "11B1,3,p_ie";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Mau_Nhap_Lop_Hoc.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải mẫu nhập dữ liệu');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`Đã xử lý file: ${file.name}. Đã thêm thành công các lớp học mới!`);
      // Simulating file import
      setTimeout(() => {
        updateClasses([
          ...classes, 
          { id: Date.now().toString() + '1', name: '10A3', levelId: '3', programId: 'p_qt', academicYear: selectedAcademicYear, studentCount: 0 },
          { id: Date.now().toString() + '2', name: '11B1', levelId: '3', programId: 'p_ie', academicYear: selectedAcademicYear, studentCount: 0 }
        ]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 500);
    }
  };

  const handleAddProgram = (levelId: string) => {
    openPrompt(
      'Thêm hệ đào tạo',
      'Nhập tên hệ đào tạo mới:',
      '',
      (name) => {
        setPrograms([...programs, { id: 'p_' + Date.now(), name: name.trim(), levelId }]);
        toast.success('Đã thêm hệ đào tạo mới');
      }
    );
  };

  const handleEditProgram = (program: any) => {
    openPrompt(
      'Sửa hệ đào tạo',
      'Cập nhật tên hệ đào tạo:',
      program.name,
      (newName) => {
        setPrograms(programs.map(p => p.id === program.id ? { ...p, name: newName.trim() } : p));
        toast.success('Đã cập nhật hệ đào tạo');
      }
    );
  };

  const handleDeleteProgram = (id: string) => {
    openConfirm(
      'Xoá hệ đào tạo',
      'Bạn có chắc chắn muốn xoá hệ đào tạo này? Các lớp thuộc hệ này sẽ không còn hệ liên kết.',
      () => {
        setPrograms(programs.filter(p => p.id !== id));
        toast.success('Đã xoá hệ đào tạo');
      },
      true
    );
  };

  const handleEditLevel = (level: any) => {
    openPrompt(
      'Sửa cấp học',
      'Cập nhật tên cấp học:',
      level.name,
      (newName) => {
        setEduLevels(eduLevels.map(l => l.id === level.id ? { ...l, name: newName.trim() } : l));
        toast.success('Đã cập nhật cấp học');
      }
    );
  };

  const handleAddLevel = () => {
    openPrompt(
      'Thêm cấp học',
      'Nhập tên cấp học mới:',
      '',
      (name) => {
        setEduLevels([...eduLevels, { id: Date.now().toString(), name: name.trim() }]);
        toast.success('Đã thêm cấp học mới');
      }
    );
  };

  const handleAddYear = () => {
    openPrompt(
      'Thêm năm học',
      'Nhập năm học mới (VD: 2025-2026):',
      '',
      (name) => {
        if (!academicYears.includes(name.trim())) {
          updateAcademicYears([...academicYears, name.trim()]);
          toast.success('Đã thêm năm học mới');
        } else {
          toast.error('Năm học này đã tồn tại');
        }
      }
    );
  };

  const handleDeleteYear = (year: string) => {
    openConfirm(
      'Xóa năm học',
      'Bạn có chắc chắn muốn xóa năm học này không?',
      () => {
        updateAcademicYears(academicYears.filter(y => y !== year));
        toast.success('Đã xóa năm học');
      },
      true
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Lớp học & Cấp học</h2>
      </div>

      <Tabs defaultValue="classes" className="w-full">
        <TabsList className="mb-4 bg-white border border-slate-200">
          <TabsTrigger value="classes" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><BookOpen className="w-4 h-4 mr-2"/> Danh sách Lớp</TabsTrigger>
          <TabsTrigger value="levels" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><Layers className="w-4 h-4 mr-2"/> Cấu hình Cấp học & Hệ</TabsTrigger>
          <TabsTrigger value="years" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><Calendar className="w-4 h-4 mr-2"/> Năm học</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 rounded-2xl border border-slate-100 shadow-sm p-5 h-fit">
              <CardTitle className="text-lg font-bold text-slate-800 mb-4">Thêm lớp mới</CardTitle>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="className" className="text-slate-600">Tên lớp</Label>
                  <Input 
                    id="className" 
                    placeholder="VD: 10A1" 
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Cấp học</Label>
                  <select 
                    className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    value={selectedLevel}
                    onChange={(e) => {
                      const newLevelId = e.target.value;
                      setSelectedLevel(newLevelId);
                      const availablePrograms = programs.filter(p => p.levelId === newLevelId);
                      if (availablePrograms.length > 0) {
                        setSelectedProgram(availablePrograms[0].id);
                      } else {
                        setSelectedProgram('');
                      }
                    }}
                  >
                    {eduLevels.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Hệ đào tạo</Label>
                  <select 
                    className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                  >
                    {programs.filter(p => p.levelId === selectedLevel).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Năm học</Label>
                  <select 
                    className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  >
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg pt-2 pb-2 h-auto text-base">
                  <Plus className="w-4 h-4 mr-2" /> Thêm lớp
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Label className="text-slate-600 block mb-3">Nhập liệu hàng loạt (Import)</Label>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={handleDownloadTemplate} className="w-full text-slate-600 border-slate-200 bg-white justify-start">
                    <Download className="w-4 h-4 mr-2" /> Tải file mẫu (.csv)
                  </Button>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".csv, .xlsx" 
                      onChange={handleImportFile}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      ref={fileInputRef}
                    />
                    <Button variant="outline" className="w-full text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 justify-start">
                      <Upload className="w-4 h-4 mr-2" /> Upload file dữ liệu
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="md:col-span-2 rounded-2xl border border-slate-100 shadow-sm p-0 overflow-hidden">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between m-0 w-full rounded-none">
                <h3 className="font-bold text-slate-700">Danh sách các lớp</h3>
                <div className="flex gap-2 items-center mt-2 sm:mt-0">
                  <Button variant="outline" size="sm" onClick={handleDeleteAllClasses} className="border-red-200 text-red-600 hover:bg-red-50">
                    Xoá Toàn bộ Lớp
                  </Button>
                  <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-normal">
                    Tổng số: {classes.length} lớp
                  </Badge>
                </div>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-50 bg-white">
                      <th className="px-6 py-4 font-semibold">Tên lớp</th>
                      <th className="px-6 py-4 font-semibold">Cấp học</th>
                      <th className="px-6 py-4 font-semibold">Hệ đào tạo</th>
                      <th className="px-6 py-4 font-semibold text-center">Năm học</th>
                      <th className="px-6 py-4 font-semibold text-center">Sĩ số</th>
                      <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {classes.map(c => {
                      const levelName = eduLevels.find(l => l.id === c.levelId)?.name;
                      const programName = programs.find(p => p.id === c.programId)?.name;
                      
                      return (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                          <td className="px-6 py-4 text-slate-600">{levelName}</td>
                          <td className="px-6 py-4">
                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none shadow-none font-medium text-xs px-2 py-0.5 rounded-md">
                              {programName}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600">
                            {c.academicYear}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600 font-medium">
                            {c.studentCount} HS
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => toast.info('Chức năng sửa đang được cập nhật')}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteClass(c.id)}>
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
          </div>
        </TabsContent>

        <TabsContent value="levels">
          <Card className="rounded-2xl border border-slate-100 shadow-sm p-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <CardTitle className="text-xl font-bold text-slate-800">Cấu trúc Hệ thống Giáo dục</CardTitle>
              <Button size="sm" className="bg-slate-800 text-white hover:bg-slate-700" onClick={handleAddLevel}>
                <Plus className="w-4 h-4 mr-1" /> Thêm cấp học
              </Button>
            </div>
            <div className="space-y-6">
              {eduLevels.map(level => (
                <div key={level.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-base text-slate-800 flex items-center gap-2">
                      {level.name}
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => handleEditLevel(level)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {programs.filter(p => p.levelId === level.id).map(prog => (
                      <div key={prog.id} className="bg-white border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm group">
                        <span className="text-sm font-medium text-slate-700">{prog.name}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-1">
                          <button onClick={() => handleEditProgram(prog)} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleDeleteProgram(prog.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="h-[38px] border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleAddProgram(level.id)}>
                      <Plus className="w-4 h-4 mr-1" /> Thêm hệ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="years">
          <Card className="rounded-2xl border border-slate-100 shadow-sm p-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <CardTitle className="text-xl font-bold text-slate-800">Quản lý Năm học</CardTitle>
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleAddYear}>
                <Plus className="w-4 h-4 mr-1" /> Thêm năm học
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              {academicYears.map(year => (
                <div key={year} className="bg-white border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm group">
                  <span className="text-sm font-medium text-slate-700">{year}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-1">
                    <button onClick={() => handleDeleteYear(year)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
              {academicYears.length === 0 && (
                <div className="text-slate-500 text-sm">Chưa có năm học nào.</div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onEnter={handleModalConfirm}
        title={modalConfig.title}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} className="border-slate-200 text-slate-600">
              Huỷ
            </Button>
            <Button 
              onClick={handleModalConfirm}
              variant={modalConfig.isDestructive ? 'destructive' : 'default'}
              className={modalConfig.isDestructive ? '' : 'bg-blue-600 hover:bg-blue-700 text-white'}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{modalConfig.message}</p>
          {modalConfig.type === 'prompt' && (
            <Input
              autoFocus
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              className="border-slate-200"
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

