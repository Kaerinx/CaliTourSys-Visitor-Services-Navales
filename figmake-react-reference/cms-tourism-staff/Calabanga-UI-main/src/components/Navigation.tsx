import { Home, ShoppingBag, Award, Calendar, HelpCircle, BarChart3, Menu, X, FileText } from 'lucide-react';
import { ModuleType } from '../App';
import { useState } from 'react';

interface NavigationProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
}

export function Navigation({ activeModule, setActiveModule }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation order: CMS first (public content), then operational modules
  const navItems = [
    { id: 'home' as ModuleType, label: 'Dashboard', icon: Home },
    { id: 'cms' as ModuleType, label: 'Content Management', icon: FileText },
    { id: 'otop' as ModuleType, label: 'OTOP Support', icon: ShoppingBag },
    { id: 'development' as ModuleType, label: 'Product Development', icon: Calendar },
    { id: 'business' as ModuleType, label: 'Business Accreditation', icon: Award },
    { id: 'visitor' as ModuleType, label: 'Visitor Services', icon: HelpCircle },
    { id: 'reporting' as ModuleType, label: 'Reports', icon: BarChart3 },
  ];

  return (
    <>
      {/* Top Header - Mobile Only */}
      <header className="md:hidden bg-gradient-to-r from-sky-500 to-sky-600 text-white sticky top-0 z-50 shadow-md">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-2xl">🏛️</span>
              </div>
              <div>
                <h1 className="leading-tight">Calabanga Tourism</h1>
                <p className="text-xs text-sky-100">Management System</p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-sky-600 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar - Sky Blue Theme */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 shadow-sm z-40">
        {/* Logo Header */}
        <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white p-6 border-b border-sky-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
              <span className="text-3xl">🏛️</span>
            </div>
            <div className="flex-1">
              <h1 className="text-lg leading-tight">Calabanga Tourism</h1>
              <p className="text-xs text-sky-100">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-sky-100 text-sky-700 shadow-sm border-l-4 border-sky-500' 
                        : 'text-slate-700 hover:bg-sky-50 hover:text-sky-600'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-sky-600' : 'text-slate-500'} />
                    <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-sky-50 border-t border-sky-100">
          <div className="text-xs text-slate-600 text-center">
            <p className="mb-1">Calabanga Tourism Office</p>
            <p className="text-sky-600">v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <nav 
            className="absolute top-0 left-0 bottom-0 w-64 bg-white shadow-2xl overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sidebar Header */}
            <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white p-6 border-b border-sky-600">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-2xl">🏛️</span>
                  </div>
                  <div>
                    <h1 className="leading-tight">Calabanga Tourism</h1>
                    <p className="text-xs text-sky-100">Management System</p>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 hover:bg-sky-600 rounded transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Mobile Menu Items */}
            <ul className="py-4 space-y-1 px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveModule(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-sky-100 text-sky-700 shadow-sm border-l-4 border-sky-500' 
                          : 'text-slate-700 hover:bg-sky-50 hover:text-sky-600'
                      }`}
                    >
                      <Icon size={20} className={isActive ? 'text-sky-600' : 'text-slate-500'} />
                      <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Mobile Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-sky-50 border-t border-sky-100">
              <div className="text-xs text-slate-600 text-center">
                <p className="mb-1">Calabanga Tourism Office</p>
                <p className="text-sky-600">v1.0.0</p>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Mobile Bottom Navigation - Quick Access */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-lg">
        <ul className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <li key={item.id} className="flex-1">
                <button
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex flex-col items-center gap-1 py-2 px-1 transition-colors ${
                    isActive ? 'text-sky-600' : 'text-slate-500'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs leading-tight">{item.label.split(' ')[0]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}