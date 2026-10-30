import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ExpenseModal } from './components/ExpenseModal';
import { SalaryModal } from './components/SalaryModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Income } from './pages/Income';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/income" element={<Income />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
          </div>

          {/* Global Modals */}
          <ExpenseModal />
          <SalaryModal />
        </div>
      </BrowserRouter>
    </FinanceProvider>
  );
}

export default App;
