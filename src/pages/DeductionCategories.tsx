import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { DeductionCategory } from '../types';
import { getDeductions, saveDeductions } from '../lib/fees';

const DEDUCTION_TYPES = {
  'percentage': 'Theo phần trăm (%)',
  'monthly': 'Cố định theo tháng',
  'once': 'Một lần',
};

export default function DeductionCategories() {
  const [deductions, setDeductions] = useState<DeductionCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setDeductions(getDeductions());
  }, []);

  const updateDeductions = (newDeductions: DeductionCategory[]) => {
    setDeductions(newDeductions);
    saveDeductions(newDeductions);
  };


  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'percentage' as DeductionCategory['type'],
    defaultAmount: ''
  });

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ id: '', name: '', type: 'percentage', defaultAmount: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (deduction: DeductionCategory) => {
    setModalMode('edit');
    setEditingId(deduction.id);
    setFormData({
      id: deduction.id,
      name: deduction.name,
      type: deduction.type,
      defaultAmount: deduction.defaultAmount.toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá khoản khấu trừ',
      message: 'Bạn có chắc chắn muốn xoá khoản khấu trừ này không?',
      onConfirm: () => {
        updateDeductions(deductions.filter(d => d.id !== id));
        toast.success('Đã xoá khoản khấu trừ');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá TOÀN BỘ khoản khấu trừ',
      message: 'Bạn có chắc chắn muốn xoá toàn bộ danh mục khoản khấu trừ/miễn giảm? Những hồ sơ trước đó có thể mất thông tin chi tiết.',
      onConfirm: () => {
        updateDeductions([]);
        toast.success('Đã xoá toàn bộ khoản khấu trừ');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSave = () => {
    if (!formData.id.trim() || !formData.name.trim() || !formData.defaultAmount.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin (Mã, Tên, Mức khấu trừ)');
      return;
    }

    const amount = Number(formData.defaultAmount.replace(/,/g, ''));
    if (isNaN(amount)) {
      toast.error('Mức khấu trừ không hợp lệ');
      return;
    }
    
    if (formData.type === 'percentage' && (amount <= 0 || amount > 100)) {
      toast.error('Mức phần trăm phải nằm trong khoảng 0 - 100');
      return;
    }

    if (modalMode === 'create') {
      if (deductions.some(d => d.id === formData.id.trim())) {
        toast.error('Mã khoản khấu trừ đã tồn tại!');
        return;
      }
      const newDeduction: DeductionCategory = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        type: formData.type,
        defaultAmount: amount,
      };
      updateDeductions([...deductions, newDeduction]);
      toast.success('Đã tạo mới khoản khấu trừ');
    } else {
      updateDeductions(deductions.map(d => d.id === editingId ? {
        ...d,
        name: formData.name.trim(),
        type: formData.type,
        defaultAmount: amount,
      } : d));
      toast.success('Đã cập nhật khoản khấu trừ');
    }

    setIsModalOpen(false);
  };

  const filteredDeductions = deductions.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 flex-1 flex flex-col min-w-0 pr-4 pb-4 md:pr-8 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 md:pt-8 pl-4 md:pl-8">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Khoản Khấu Trừ & Miễn Giảm</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDeleteAll} className="border-red-200 text-red-600 hover:bg-red-50 shrink-0">
            Xoá Toàn bộ
          </Button>
          <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Thêm khoản khấu trừ
          </Button>
        </div>
      </div>

      <div className="pl-4 md:pl-8 flex-1 flex flex-col">
        <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <Input 
              placeholder="Tìm kiếm theo mã hoặc tên..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md border-slate-200"
            />
            <Badge variant="outline" className="text-slate-500 font-normal border-slate-200 bg-slate-50 shrink-0">
              Tổng cộng: {filteredDeductions.length} danh mục
            </Badge>
          </div>
          
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Mã khấu trừ</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Tên khoản khấu trừ</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Mức mặc định</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Loại</th>
                  <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filteredDeductions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Không tìm thấy khoản khấu trừ nào
                    </td>
                  </tr>
                ) : (
                  filteredDeductions.map(deduction => (
                    <tr key={deduction.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">{deduction.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{deduction.name}</td>
                      <td className="px-6 py-4 font-semibold text-blue-600">
                        {deduction.type === 'percentage' ? `${deduction.defaultAmount}%` : `${deduction.defaultAmount.toLocaleString()} đ`}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none shadow-none font-medium px-2 py-0.5 rounded-md whitespace-nowrap">
                          {DEDUCTION_TYPES[deduction.type]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(deduction)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(deduction.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEnter={handleSave}
        title={modalMode === 'create' ? 'Thêm khoản khấu trừ mới' : 'Cập nhật khoản khấu trừ'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-200 text-slate-600">
              Huỷ
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              Lưu thay đổi
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ded-id" className="text-slate-600">Mã khoản khấu trừ</Label>
            <Input
              id="ded-id"
              placeholder="VD: MG_CON_GV"
              value={formData.id}
              onChange={(e) => setFormData({...formData, id: e.target.value.toUpperCase()})}
              disabled={modalMode === 'edit'}
              className="border-slate-200 uppercase"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ded-name" className="text-slate-600">Tên khoản khấu trừ</Label>
            <Input
              id="ded-name"
              placeholder="VD: Miễn giảm con giáo viên"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-600">Loại khấu trừ</Label>
              <select 
                className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as DeductionCategory['type']})}
              >
                {Object.entries(DEDUCTION_TYPES).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ded-amount" className="text-slate-600">
                {formData.type === 'percentage' ? 'Mức phần trăm (%)' : 'Số tiền (VNĐ)'}
              </Label>
              <Input
                id="ded-amount"
                type="text"
                placeholder={formData.type === 'percentage' ? "VD: 20" : "VD: 500000"}
                value={formData.defaultAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d.]/g, '');
                  if (formData.type === 'percentage') {
                    setFormData({...formData, defaultAmount: val});
                  } else {
                    setFormData({...formData, defaultAmount: val ? Number(val).toLocaleString('en-US') : ''});
                  }
                }}
                className="border-slate-200"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onEnter={confirmModal.onConfirm}
        title={confirmModal.title}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="border-slate-200 text-slate-600">
              Huỷ
            </Button>
            <Button onClick={confirmModal.onConfirm} variant="destructive">
              Xoá khoản khấu trừ
            </Button>
          </>
        }
      >
        <p className="text-slate-600">{confirmModal.message}</p>
      </Modal>
    </div>
  );
}
