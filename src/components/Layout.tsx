import { ReactNode, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  BarChart, Users, GraduationCap, DollarSign, 
  CreditCard, Settings, LogOut, Menu, X, Globe 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const translations = {
  vi: { title: 'Quản lý Học Phí', portal: 'Cổng học sinh', dash: 'Dashboard', classes: 'Lớp học', students: 'Học sinh', fees: 'Khoản thu', deductions: 'Khoản khấu trừ', tuition: 'Công nợ', settings: 'Quản lý', logout: 'Đăng xuất' },
  en: { title: 'Tuition Management', portal: 'Student Portal', dash: 'Dashboard', classes: 'Classes', students: 'Students', fees: 'Fees', deductions: 'Deductions', tuition: 'Tuition', settings: 'Settings', logout: 'Logout' }
};

export default function Layout({ user }: { user: UserProfile }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  const handleLogout = async () => {
    if (localStorage.getItem('demoUser')) {
      localStorage.removeItem('demoUser');
      window.location.reload();
      return;
    }
    await signOut(auth);
  };

  const t = translations[lang];

  const navItems = user.role === 'student' ? [
    { name: t.portal, path: '/', icon: GraduationCap },
  ] : [
    { name: t.dash, path: '/', icon: BarChart },
    { name: t.classes, path: '/classes', icon: Users },
    { name: t.students, path: '/students', icon: GraduationCap },
    { name: t.fees, path: '/fees', icon: DollarSign },
    { name: t.deductions, path: '/deductions', icon: DollarSign },
    { name: t.tuition, path: '/tuition', icon: CreditCard },
  ];

  if (user.role === 'admin') {
    navItems.push({ name: t.settings, path: '/settings', icon: Settings });
  }

  // Calculate if sidebar is expanded
  const isExpanded = mobileOpen || desktopExpanded;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Spacer for desktop layout to prevent content shifting if we use absolute or if we use relative push */}
      <aside 
        onMouseEnter={() => setDesktopExpanded(true)}
        onMouseLeave={() => setDesktopExpanded(false)}
        className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out md:static md:translate-x-0
        ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${!mobileOpen ? (desktopExpanded ? 'w-64' : 'w-[68px]') : ''}
        overflow-hidden
      `}>
        <div className="flex flex-col h-full w-64">
          <div className="p-4 h-16 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className={`font-bold text-slate-800 text-lg tracking-tight whitespace-nowrap transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>DuyTan Edu</span>
            </div>
            <button className="md:hidden shrink-0" onClick={() => setMobileOpen(false)}>
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                  ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}
                `}
                title={!isExpanded ? item.name : undefined}
              >
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                  {item.name}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-100 space-y-2">
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} className="w-full justify-start text-slate-500 px-3">
              <Globe className="w-5 h-5 shrink-0" />
              <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                {lang === 'vi' ? 'English' : 'Tiếng Việt'}
              </span>
            </Button>
            <div className="flex items-center border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 shrink-0 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} overflow-hidden`}>
                  <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{user.role}</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-500 hover:bg-red-50 px-3" onClick={handleLogout} title={!isExpanded ? t.logout : undefined}>
              <LogOut className="w-5 h-5 shrink-0" />
              <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                {t.logout}
              </span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center px-4 md:px-8 shrink-0 justify-between">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-4 p-2 text-slate-600 hover:bg-slate-100 rounded-md"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center bg-slate-100 px-4 py-2 rounded-full w-96">
              <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Tra cứu..." className="bg-transparent border-none text-sm outline-none w-full" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border rounded text-xs font-semibold text-slate-600 cursor-pointer" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
              <span>🌐 {lang === 'vi' ? 'VI' : 'EN'}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
