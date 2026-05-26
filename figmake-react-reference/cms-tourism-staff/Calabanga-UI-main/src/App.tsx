import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { OTOPModule } from './components/OTOPModule';
import { BusinessAccreditationModule } from './components/BusinessAccreditationModule';
import { ProductDevelopmentModule } from './components/ProductDevelopmentModule';
import { VisitorServicesModule } from './components/VisitorServicesModule';
import { ReportingModule } from './components/ReportingModule';
import { CMSModule } from './components/CMSModule';
import { DashboardHome } from './components/DashboardHome';

export type ModuleType = 'home' | 'otop' | 'business' | 'development' | 'visitor' | 'reporting' | 'cms';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('home');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation activeModule={activeModule} setActiveModule={setActiveModule} />
      
      {/* Main content with left padding for desktop sidebar */}
      <main className="pb-20 md:pb-8 md:pl-64">
        {activeModule === 'home' && <DashboardHome setActiveModule={setActiveModule} />}
        {activeModule === 'cms' && <CMSModule />}
        {activeModule === 'otop' && <OTOPModule />}
        {activeModule === 'business' && <BusinessAccreditationModule />}
        {activeModule === 'development' && <ProductDevelopmentModule />}
        {activeModule === 'visitor' && <VisitorServicesModule />}
        {activeModule === 'reporting' && <ReportingModule />}
      </main>
    </div>
  );
}