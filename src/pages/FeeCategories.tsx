import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { FeeCategory } from '../types';
import { getFees, saveFees } from '../lib/fees';

const FEE_TYPES = {
  'monthly': 'Theo tháng',
  'weekly': 'Theo tuần',
  'yearly': 'Theo năm',
  'once': 'Một lần',
};

export default function FeeCategories() {
  const [fees, setFees] = useState<FeeCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setFees(getFees());
  }, []);

  const updateFees = (newFees: FeeCategory[]) => {
    setFees(newFees);
    saveFees(newFees);
  };


  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'monthly' as FeeCategory['type'],
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
    setFormData({ id: '', name: '', type: 'monthly', defaultAmount: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fee: FeeCategory) => {
    setModalMode('edit');
    setEditingId(fee.id);
    setFormData({
      id: fee.id,
      name: fee.name,
      type: fee.type,
      defaultAmount: fee.defaultAmount.toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá khoản thu',
      message: 'Bạn có chắc chắn muốn xoá mục thu này không? Hành động này có thể ảnh hưởng đến các báo cáo công nợ cũ.',
      onConfirm: () => {
        updateFees(fees.filter(f => f.id !== id));
        toast.success('Đã xoá khoản thu');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá TOÀN BỘ khoản thu',
      message: 'Bạn có chắc chắn muốn xoá toàn bộ danh mục khoản thu? Hệ thống sẽ mất thông tin phí để tạo bill.',
      onConfirm: () => {
        updateFees([]);
        toast.success('Đã xoá toàn bộ khoản thu');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSave = () => {
    if (!formData.id.trim() || !formData.name.trim() || !formData.defaultAmount.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin (Mã, Tên, Mức thu)');
      return;
    }

    const amount = parseInt(formData.defaultAmount.replace(/\D/g, ''), 10);
    if (isNaN(amount)) {
      toast.error('Mức thu không hợp lệ');
      return;
    }

    if (modalMode === 'create') {
      if (fees.some(f => f.id === formData.id.trim())) {
        toast.error('Mã khoản thu đã tồn tại!');
        return;
      }
      const newFee: FeeCategory = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        type: formData.type,
        defaultAmount: amount,
      };
      updateFees([...fees, newFee]);
      toast.success('Đã tạo mới khoản thu');
    } else {
      updateFees(fees.map(f => f.id === editingId ? {
        ...f,
        name: formData.name.trim(),
        type: formData.type,
        defaultAmount: amount,
      } : f));
      toast.success('Đã cập nhật khoản thu');
    }

    setIsModalOpen(false);
  };

  const filteredFees = fees.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Danh mục Khoản thu</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDeleteAll} className="border-red-200 text-red-600 hover:bg-red-50">
            Xoá Toàn bộ
          </Button>
          <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Thêm khoản thu
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input 
            placeholder="Tìm kiếm theo mã hoặc tên khoản thu..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md border-slate-200"
          />
          <Badge variant="outline" className="text-slate-500 font-normal border-slate-200 bg-slate-50">
            Tổng cộng: {filteredFees.length} danh mục
          </Badge>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 font-semibold">Mã khoản thu</th>
                <th className="px-6 py-4 font-semibold">Tên khoản thu</th>
                <th className="px-6 py-4 font-semibold">Mức mặc định</th>
                <th className="px-6 py-4 font-semibold">Chu kỳ</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy khoản thu nào
                  </td>
                </tr>
              ) : (
                filteredFees.map(fee => (
                  <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">{fee.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{fee.name}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">
                      {fee.defaultAmount.toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none shadow-none font-medium px-2 py-0.5 rounded-md">
                        {FEE_TYPES[fee.type]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(fee)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(fee.id)}>
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

      {/* Main Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEnter={handleSave}
        title={modalMode === 'create' ? 'Thêm khoản thu mới' : 'Cập nhật khoản thu'}
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
            <Label htmlFor="fee-id" className="text-slate-600">Mã khoản thu</Label>
            <Input
              id="fee-id"
              placeholder="VD: KHAM_SUC_KHOE"
              value={formData.id}
              onChange={(e) => setFormData({...formData, id: e.target.value.toUpperCase()})}
              disabled={modalMode === 'edit'}
              className="border-slate-200 uppercase"
            />
            {modalMode === 'create' && <p className="text-[10px] text-slate-400">Mã khoản thu không được trùng lặp và không thể sửa lại sau này.</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fee-name" className="text-slate-600">Tên khoản thu</Label>
            <Input
              id="fee-name"
              placeholder="VD: Phí khám sức khoẻ đầu năm"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-600">Chu kỳ thu</Label>
              <select 
                className="w-full border-slate-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as FeeCategory['type']})}
              >
                {Object.entries(FEE_TYPES).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee-amount" className="text-slate-600">Mức thu mặc định (VNĐ)</Label>
              <Input
                id="fee-amount"
                type="text"
                placeholder="VD: 500000"
                value={formData.defaultAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({...formData, defaultAmount: val ? Number(val).toLocaleString('en-US') : ''})
                }}
                className="border-slate-200"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
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
              Xoá khoản thu
            </Button>
          </>
        }
      >
        <p className="text-slate-600">{confirmModal.message}</p>
      </Modal>
    </div>
  );
}
