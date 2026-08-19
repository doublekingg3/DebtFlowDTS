import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserProfile } from '../types';
import { Badge } from '@/components/ui/badge';
import { CreditCard, History, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentPortal({ user }: { user: UserProfile }) {
  const [fees, setFees] = useState<any[]>([]);

  useEffect(() => {
    // Mock fees for the logged in student
    setFees([
      { 
        id: '1', month: 5, year: 2026, status: 'overdue', dueDate: '15/05/2026', total: 4500000,
        details: [
          { name: 'Học phí chính khoá', amount: 3000000 },
          { name: 'Tiền ăn bán trú', amount: 1200000 },
          { name: 'Phí KTX', amount: 300000 }
        ]
      },
      { 
        id: '2', month: 4, year: 2026, status: 'paid', dueDate: '15/04/2026', total: 4500000,
        details: [
          { name: 'Học phí chính khoá', amount: 3000000 },
          { name: 'Tiền ăn bán trú', amount: 1200000 },
          { name: 'Phí KTX', amount: 300000 }
        ]
      }
    ]);
  }, [user]);

  const handleMomoPayment = () => {
    toast.success('Đang chuyển hướng sang cổng thanh toán MoMo...');
    // Real implementation would redirect to e-wallet payment getaway
  };

  const handleVNPMomoPayment = () => {
    toast.success('Đang chuyển hướng sang cổng thanh toán VNPAY...');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Thông tin Học phí</h2>
        <p className="text-slate-500">Học sinh: <span className="font-medium text-slate-800">{user.name}</span> | Mã số: <span className="font-medium text-slate-800">{user.studentId}</span></p>
      </div>

      <div className="grid gap-6">
        {fees.map(fee => (
          <Card key={fee.id} className={`overflow-hidden p-0 border flex flex-col ${fee.status === 'overdue' ? 'border-red-200' : 'border-green-100'}`}>
            <CardHeader className={`${fee.status === 'overdue' ? 'bg-red-50/50' : 'bg-green-50/50'} p-5 border-b ${fee.status === 'overdue' ? 'border-red-100' : 'border-green-100'} w-full rounded-none m-0 pb-5`}>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-slate-800">Học phí Tháng {fee.month}/{fee.year}</CardTitle>
                  <CardDescription className="mt-1 text-slate-600">
                    Hạn đóng: {fee.dueDate}
                  </CardDescription>
                </div>
                {fee.status === 'paid' ? (
                  <Badge className="bg-green-100 text-green-700 flex items-center gap-1 hover:bg-green-200 text-sm py-1 px-3 border-none shadow-none rounded-lg">
                    <CheckCircle2 className="w-4 h-4" /> Đã hoàn tất
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 flex items-center gap-1 hover:bg-red-200 text-sm py-1 px-3 border-none shadow-none rounded-lg">
                    <AlertCircle className="w-4 h-4" /> Quá hạn thanh toán
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 w-full">
              <div className="space-y-4">
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Chi tiết các khoản thu</div>
                {fee.details.map((d: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0 border-dashed border-slate-100">
                    <span className="text-slate-600">{d.name}</span>
                    <span className="font-medium text-slate-800">{d.amount.toLocaleString()} ₫</span>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100">
                  <span className="text-lg font-bold text-slate-800">Tổng cộng</span>
                  <span className="text-2xl font-bold text-slate-800">{fee.total.toLocaleString()} ₫</span>
                </div>

                {fee.status !== 'paid' && (
                  <div className="pt-6 flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleMomoPayment} className="flex-1 bg-[#A50064] hover:bg-[#82004f] text-white h-12 shadow-sm rounded-xl">
                      <CreditCard className="w-5 h-5 mr-2" /> Thanh toán qua MoMo
                    </Button>
                    <Button onClick={handleVNPMomoPayment} className="flex-1 bg-[#005BAA] hover:bg-[#004785] text-white h-12 shadow-sm rounded-xl">
                      <CreditCard className="w-5 h-5 mr-2" /> Thanh toán qua VNPAY
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
