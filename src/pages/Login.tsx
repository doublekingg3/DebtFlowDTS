import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const email = username.includes('@') ? username : `${username.toLowerCase()}@duytan.edu.vn`;
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // Simple mock for admin creation if "admin" is used and fails
        if (username.toLowerCase() === 'admin') {
          try {
            const email = 'admin@duytan.edu.vn';
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', userCred.user.uid), {
              uid: userCred.user.uid,
              email: email,
              role: 'admin',
              name: 'System Admin'
            });
            window.location.reload();
            return;
          } catch(e) {
            console.error("Admin creation failed", e);
          }
        }
      }
      if (err.code === 'auth/operation-not-allowed') {
        setError('Tính năng đăng nhập bằng Email/Password chưa được bật trên Firebase Console. Vui lòng bật "Email/Password" trong mục Authentication > Sign-in method.');
      } else {
        setError('Tài khoản hoặc mật khẩu không chính xác.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-600/20">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">DuyTan Edu</h1>
        <p className="text-slate-500 mt-2">Hệ thống Quản lý Học phí Toàn diện</p>
      </div>

      <Card className="w-full max-w-sm rounded-2xl p-8 border border-slate-100 shadow-sm bg-white">
        <CardHeader className="space-y-1 pb-6 p-0">
          <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
          <CardDescription className="text-center text-slate-500 pb-2">
            Sử dụng mã học sinh hoặc tên đăng nhập
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-600">Tên đăng nhập / Mã HS</Label>
              <Input
                id="username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: 0001"
                className="rounded-lg border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-600">Mật khẩu</Label>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border-slate-200"
              />
            </div>
            
            {error && (
              <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 text-white shadow-sm h-11 text-base font-medium mt-4" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Button>
          </form>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6">
            <p className="text-xs text-center text-slate-500 uppercase tracking-widest font-medium">Trải nghiệm Nhanh (Chế độ Xem trước)</p>
            <Button 
              variant="outline" 
              type="button"
              onClick={() => { localStorage.setItem('demoUser', 'admin'); window.location.reload(); }}
              className="w-full rounded-lg text-slate-700 border-slate-200"
            >
              Vào giao diện: Admin Tài Vụ
            </Button>
            <Button 
              variant="outline" 
              type="button"
              onClick={() => { localStorage.setItem('demoUser', 'student'); window.location.reload(); }}
              className="w-full rounded-lg text-slate-700 border-slate-200"
            >
              Vào giao diện: Cổng Học sinh
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-sm text-slate-400">
        Liên hệ bộ phận Tài Vụ nếu bạn quên mật khẩu.
      </p>
    </div>
  );
}
