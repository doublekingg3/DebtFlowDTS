import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Users, Database, Settings as SettingsIcon } from 'lucide-react';
import { UserProfile, TrashItem } from '../types';
import { getAcademicStartMonth, saveAcademicStartMonth } from '../lib/fees';
import { toast } from 'sonner';

export default function Settings() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [startMonth, setStartMonth] = useState<number>(8);

  const fetchSettingsData = async () => {
    try {
      const uSnap = await getDocs(collection(db, 'users'));
      setUsers(uSnap.docs.map(d => d.data() as UserProfile));

      const tSnap = await getDocs(collection(db, 'trash'));
      setTrash(tSnap.docs.map(d => d.data() as TrashItem));
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettingsData();
    setStartMonth(getAcademicStartMonth());
  }, []);

  const restoreItem = async (item: TrashItem) => {
    try {
      await setDoc(doc(db, item.originalCollection, item.originalId), item.data);
      await deleteDoc(doc(db, 'trash', item.id));
      fetchSettingsData();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, item.originalCollection);
    }
  };

  const hardDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'trash', id));
      fetchSettingsData();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'trash');
    }
  };

  const handleSaveStartMonth = () => {
    saveAcademicStartMonth(startMonth);
    toast.success('Đã lưu tháng bắt đầu năm học');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý hệ thống</h2>
      </div>

      <Tabs defaultValue="system">
        <TabsList>
          <TabsTrigger value="system" className="flex items-center gap-2"><SettingsIcon className="w-4 h-4"/> Cấu hình chung</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2"><Users className="w-4 h-4"/> Tài khoản</TabsTrigger>
          <TabsTrigger value="trash" className="flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4"/> Thùng rác ẩn</TabsTrigger>
          <TabsTrigger value="db" className="flex items-center gap-2"><Database className="w-4 h-4"/> Sao lưu</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình chung</CardTitle>
              <CardDescription>Thiết lập các thông số chung cho toàn trường.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Tháng bắt đầu năm học mới</label>
                  <p className="text-xs text-slate-500 mb-2">Quy định tháng nào là tháng đầu tiên của năm học (thường là Tháng 7 hoặc Tháng 8). Hệ thống sẽ tự động xếp lịch và áp dụng các khoản phí "Đóng 1 lần/Năm" vào tháng này.</p>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={startMonth}
                    onChange={(e) => setStartMonth(Number(e.target.value))}
                  >
                    <option value={7}>Tháng 7</option>
                    <option value={8}>Tháng 8</option>
                  </select>
                </div>
                <Button onClick={handleSaveStartMonth} className="bg-blue-600 hover:bg-blue-700 text-white">Lưu cấu hình</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tài khoản nhân sự</CardTitle>
              <CardDescription>Phân quyền và quản lý tài khoản nhân viên (giáo viên, tài vụ).</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">Mô phỏng tạo tài khoản (trong bản chính sẽ dùng Admin SDK):</p>
              <div className="rounded-md border border-slate-200">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email/Tên đăng nhập</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tên</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quyền</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.uid} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trash" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Thùng rác ẩn (Lưu giữ 25 ngày)</CardTitle>
              <CardDescription>Dữ liệu bị xoá bởi người dùng sẽ vào đây. Bạn có thể khôi phục hoặc xoá vĩnh viễn.</CardDescription>
            </CardHeader>
            <CardContent>
              {trash.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Thùng rác trống</div>
              ) : (
                <div className="space-y-4">
                  {trash.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-xl bg-slate-50">
                      <div>
                        <p className="font-medium text-sm text-slate-800">Bộ sưu tập: {t.originalCollection}</p>
                        <p className="text-xs text-slate-500 mt-1">Người xoá: {t.deletedBy}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => restoreItem(t)} className="text-slate-600 bg-white shadow-sm border-slate-200">Khôi phục</Button>
                        <Button variant="destructive" size="sm" onClick={() => hardDeleteItem(t.id)}>Xoá vĩnh viễn</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="db" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cập nhật & Sao lưu dữ liệu</CardTitle>
            </CardHeader>
            <CardContent>
              <Button>Xuất Database (JSON)</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
