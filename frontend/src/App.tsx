import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewView } from './views/OverviewView';
import { TransactionsView } from './views/TransactionsView';
import { IngestionView } from './views/IngestionView';
import { AuditView } from './views/AuditView';
import { SettingsView } from './views/SettingsView';
import type {
  AuditLogItem,
  DashboardMetrics,
  TransactionItem,
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Dark / Light Theme State with LocalStorage persistence
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Default dark
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, txnsRes, auditRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/transactions?limit=100'),
        fetch('/api/audit-logs?limit=100'),
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (txnsRes.ok) setTransactions(await txnsRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSimulateBatch = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/simulate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 }),
      });
      if (res.ok) {
        showNotification('⚡ Synthetic payment failures ingested and processed autonomously!');
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to simulate batch:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleSeedDB = async () => {
    try {
      const res = await fetch('/api/db/seed', { method: 'POST' });
      if (res.ok) {
        showNotification('🌱 Database seeded with realistic customer & payment records.');
        await fetchData();
      }
    } catch (err) {
      console.error('Seed DB error:', err);
    }
  };

  const handleClearDB = async () => {
    try {
      const res = await fetch('/api/db/clear', { method: 'POST' });
      if (res.ok) {
        showNotification('🗑️ Database and audit logs cleared completely.');
        await fetchData();
      }
    } catch (err) {
      console.error('Clear DB error:', err);
    }
  };

  const handleRetry = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/retry`, {
        method: 'POST',
      });
      if (res.ok) {
        showNotification(`🔄 Re-executed AI recovery loop for txn ${transactionId}`);
        await fetchData();
      }
    } catch (err) {
      console.error('Retry error:', err);
    }
  };

  const handleSimulatePay = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/mark-recovered`, {
        method: 'POST',
      });
      if (res.ok) {
        showNotification(`🎉 Customer completed payment! Revenue recovered for txn ${transactionId}`);
        await fetchData();
      }
    } catch (err) {
      console.error('Mark recovered error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Enterprise Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSimulateBatch={handleSimulateBatch}
        simulating={simulating}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Layout with Sidebar Offset */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          onOpenMobile={() => setMobileOpen(true)}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
        />

        {/* Floating Flat Notification Toast */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-blue-600 dark:bg-blue-600 text-white font-medium text-xs py-3 px-5 rounded-xl shadow-lg border border-blue-500 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <span>{notification}</span>
          </div>
        )}

        {/* View Workspace Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-10">
          {activeTab === 'overview' && (
            <OverviewView
              metrics={metrics}
              transactions={transactions}
              onNavigateTab={setActiveTab}
              onSimulateBatch={handleSimulateBatch}
              onSeedDB={handleSeedDB}
              onClearDB={handleClearDB}
              simulating={simulating}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              loading={loading}
              onRetry={handleRetry}
              onSimulatePay={handleSimulatePay}
            />
          )}

          {activeTab === 'ingest' && (
            <IngestionView
              onSuccess={() => fetchData()}
              showNotification={showNotification}
            />
          )}

          {activeTab === 'audit' && (
            <AuditView logs={auditLogs} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onClearDB={handleClearDB}
              onSeedDB={handleSeedDB}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
