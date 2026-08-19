import { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Tháng 1', value: 400 },
  { name: 'Tháng 2', value: 300 },
  { name: 'Tháng 3', value: 500 },
  { name: 'Tháng 4', value: 200 },
  { name: 'Tháng 5', value: 600 },
  { name: 'Tháng 6', value: 700 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ students: 0, classes: 0, overdue: 0 });

  useEffect(() => {
    // Simulated fetching for now
    setStats({
      students: 1250,
      classes: 32,
      overdue: 45
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 mb-1">
            <CardTitle className="text-slate-500 text-xs font-medium uppercase min-h-0">Tổng Học Sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.students}</div>
            <p className="text-xs text-green-500 flex items-center mt-2">
              <TrendingUp className="w-3 h-3 mr-1" /> +20 tháng này
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 mb-1">
            <CardTitle className="text-slate-500 text-xs font-medium uppercase min-h-0">Lớp Học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.classes}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 mb-1">
            <CardTitle className="text-slate-500 text-xs font-medium uppercase min-h-0">Thu Thuế Trong Tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">450.000k</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 mb-1">
            <CardTitle className="text-slate-500 text-xs font-medium uppercase min-h-0">Quá Hạn Thanh Toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue} HS</div>
            <p className="text-xs text-slate-400 mt-2">Cần nhắc nhở</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 p-0 overflow-hidden border-slate-100 flex flex-col items-stretch">
          <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between w-full m-0 rounded-none gap-2">
            <h3 className="font-bold text-slate-700">Tiến độ thu học phí theo tháng (Triệu VNĐ)</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-800" /> Thực thu</span>
            </div>
          </div>
          <CardContent className="h-80 p-5 w-full m-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 p-0 overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between m-0 w-full rounded-none">
            <h3 className="font-bold text-slate-700">Thông báo gần đây</h3>
          </div>
          <CardContent className="p-5 w-full m-0 flex-1">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3 text-sm">
                  <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-medium">Chậm đóng học phí T5</p>
                    <p className="text-gray-500">Hệ thống đã gửi 15 email nhắc nhở tự động cho học sinh lớp 10A1.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
