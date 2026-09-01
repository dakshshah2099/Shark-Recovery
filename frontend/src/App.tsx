import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { TransactionsView } from './views/TransactionsView';
import { IngestionView } from './views/IngestionView';
import { AuditView } from './views/AuditView';
import { SettingsView } from './views/SettingsView';
import { Menu } from 'lucide-react';
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
  const [maxRetries, setMaxRetries] = useState<number>(2);

  // Collapsible Sidebar State with LocalStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  // Dark / Light Theme State with LocalStorage persistence
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Default dark
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleUpdateMaxRetries = async (newVal: number) => {
    setMaxRetries(newVal);
    try {
      const res = await fetch('/api/env-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_retry_attempts: newVal }),
      });
      if (res.ok) {
        showNotification(`✓ MAX_RETRY_ATTEMPTS updated to ${newVal} in .env`);
      } else {
        showNotification('❌ Failed to update MAX_RETRY_ATTEMPTS');
      }
    } catch (err) {
      console.error('Failed to update MAX_RETRY_ATTEMPTS:', err);
      showNotification('❌ Failed to update MAX_RETRY_ATTEMPTS');
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, txnsRes, auditRes, envRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/transactions?limit=100'),
        fetch('/api/audit-logs?limit=100'),
        fetch('/api/env-config'),
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (txnsRes.ok) setTransactions(await txnsRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (envRes.ok) {
        const envData = await envRes.json();
        if (typeof envData.max_retry_attempts === 'number') {
          setMaxRetries(envData.max_retry_attempts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Smart Polling: Pause when tab is hidden; poll every 15s idle, or faster only when active
    const interval = setInterval(() => {
      if (document.hidden) return; // Skip background calls when tab is inactive/idle
      fetchData();
    }, 15000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData(); // Fetch immediately when user returns to tab
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
        const data = await res.json();
        if (data.status === 'success') {
          showNotification(`⚡ AI recovery executed for txn ${transactionId.slice(0, 8)}! (Link generated & outreach dispatched)`);
        } else if (data.status === 'blocked') {
          showNotification(`⚠️ Gating guardrail: ${data.reason}`);
        } else {
          showNotification(`🔄 Re-executed AI recovery loop for txn ${transactionId.slice(0, 8)}`);
        }
        await fetchData();
      } else {
        showNotification(`❌ Retry request failed (${res.status})`);
      }
    } catch (err) {
      console.error('Retry error:', err);
      showNotification('❌ Failed to execute recovery retry.');
    }
  };

  const handleSimulatePay = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/mark-recovered`, {
        method: 'POST',
      });
      if (res.ok) {
        showNotification(`🎉 Customer completed payment! Revenue recovered for txn ${transactionId.slice(0, 8)}`);
        await fetchData();
      } else {
        showNotification(`❌ Failed to mark as paid (${res.status})`);
      }
    } catch (err) {
      console.error('Mark recovered error:', err);
      showNotification('❌ Error updating payment status.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col font-body">
      {/* Floating Mobile Trigger on Small Screens */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-200 shadow-xs cursor-pointer inline-flex items-center justify-center transition-transform active:scale-95 focus-rzp"
        title="Open menu"
      >
        <Menu className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
      </button>

      {/* Enterprise Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Layout with Dynamic Sidebar Offset */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-out ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        {/* Floating Flat Notification Toast */}
        {notification && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white font-subheading font-medium text-xs py-2.5 px-4 rounded-md shadow-lg border border-blue-500 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <span>{notification}</span>
          </div>
        )}

        {/* View Workspace Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'overview' && (
            <OverviewView
              metrics={metrics}
              transactions={transactions}
              maxRetries={maxRetries}
              onUpdateMaxRetries={handleUpdateMaxRetries}
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
