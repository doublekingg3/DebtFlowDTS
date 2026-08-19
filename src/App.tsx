import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Classes from './pages/Classes';
import FeeCategories from './pages/FeeCategories';
import DeductionCategories from './pages/DeductionCategories';
import Tuition from './pages/Tuition';
import StudentPortal from './pages/StudentPortal';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoMode = localStorage.getItem('demoUser');
    if (demoMode === 'admin') {
      setUser({ uid: 'demo1', email: 'admin@duytan.edu.vn', role: 'admin', name: 'Admin Demo' });
      setLoading(false);
      return;
    } else if (demoMode === 'student') {
      setUser({ uid: 'demo2', email: 'student@duytan.edu.vn', role: 'student', studentId: '0001', name: 'Nguyễn Văn A' });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else {
            // Unregistered user, treat as normal student without profile
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'student', // default
              name: firebaseUser.email?.split('@')[0] || 'Unknown',
              studentId: firebaseUser.email?.split('@')[0]
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Đang tải biểu mẫu...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        
        {user ? (
          <Route element={<Layout user={user} />}>
            {user.role === 'student' ? (
              <>
                <Route path="/" element={<StudentPortal user={user} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/classes" element={<Classes />} />
                <Route path="/fees" element={<FeeCategories />} />
                <Route path="/deductions" element={<DeductionCategories />} />
                <Route path="/tuition" element={<Tuition />} />
                {user.role === 'admin' && <Route path="/settings" element={<Settings />} />}
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
