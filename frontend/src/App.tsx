import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { TransactionsView } from './views/TransactionsView';
import { IngestionView } from './views/IngestionView';
import { AuditView } from './views/AuditView';
import { SettingsView } from './views/SettingsView';
import { AgentStepFlow } from './components/AgentStepFlow';
import { SentinelTelemetryCard } from './components/SentinelTelemetryCard';
import { Menu, Cpu, CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react';
import type {
  AuditLogItem,
  DashboardMetrics,
  TransactionItem,
} from './types';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  message: string;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [maxRetries, setMaxRetries] = useState<number>(2);
  const [debugMode, setDebugMode] = useState<boolean>(true);

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

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const showNotification = useCallback(
    (msg: string, type: 'success' | 'error' | 'info' | 'loading' = 'success', duration = 4000) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      const id = `${Date.now()}-${Math.random()}`;
      setToast({ id, type, message: msg });
      if (duration > 0 && type !== 'loading') {
        toastTimerRef.current = setTimeout(() => {
          setToast((curr) => (curr?.id === id ? null : curr));
        }, duration);
      }
    },
    []
  );

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
        if (typeof envData.debug_mode === 'boolean') {
          setDebugMode(envData.debug_mode);
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

  useEffect(() => {
    if (!debugMode && activeTab === 'agent-flow') {
      setActiveTab('overview');
    }
  }, [debugMode, activeTab]);

  const handleSeedDB = async () => {
    setSeeding(true);
    showNotification('🌱 Seeding database with realistic transactions & recovery traces...', 'loading', 0);
    try {
      const res = await fetch('/api/db/seed', { method: 'POST' });
      if (res.ok) {
        showNotification('🌱 Database seeded with realistic customer & payment records!', 'success', 4000);
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification(`❌ Seed DB failed: ${err.detail || 'Could not seed database'}`, 'error', 5000);
      }
    } catch (err) {
      console.error('Seed DB error:', err);
      showNotification('❌ Network error while seeding database.', 'error', 5000);
    } finally {
      setSeeding(false);
    }
  };

  const handleClearDB = async () => {
    setClearing(true);
    showNotification('🗑️ Purging database records and audit ledger...', 'loading', 0);
    try {
      const res = await fetch('/api/db/clear', { method: 'POST' });
      if (res.ok) {
        showNotification('🗑️ Database and audit logs cleared completely.', 'success', 4000);
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification(`❌ Clear DB failed: ${err.detail || 'Could not clear database'}`, 'error', 5000);
      }
    } catch (err) {
      console.error('Clear DB error:', err);
      showNotification('❌ Network error while clearing database.', 'error', 5000);
    } finally {
      setClearing(false);
    }
  };

  const handleRetry = async (transactionId: string) => {
    showNotification(`⚡ Triaging AI recovery loop for txn ${transactionId.slice(0, 8)}...`, 'loading', 0);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/retry`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          showNotification(`⚡ AI recovery executed for txn ${transactionId.slice(0, 8)}! (Link generated & outreach dispatched)`, 'success', 4500);
        } else if (data.status === 'blocked') {
          showNotification(`⚠️ Guardrail: ${data.reason}`, 'info', 5000);
        } else {
          showNotification(`🔄 Re-executed AI recovery loop for txn ${transactionId.slice(0, 8)}`, 'info', 4000);
        }
        await fetchData();
      } else {
        showNotification(`❌ Retry request failed (${res.status})`, 'error', 5000);
      }
    } catch (err) {
      console.error('Retry error:', err);
      showNotification('❌ Failed to execute recovery retry.', 'error', 5000);
    }
  };

  const handleSimulatePay = async (transactionId: string) => {
    showNotification(`Verifying payment settlement for txn ${transactionId.slice(0, 8)}...`, 'loading', 0);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/mark-recovered`, {
        method: 'POST',
      });
      if (res.ok) {
        showNotification(`🎉 Customer completed payment! Revenue recovered for txn ${transactionId.slice(0, 8)}`, 'success', 4500);
        await fetchData();
      } else {
        showNotification(`❌ Failed to mark as paid (${res.status})`, 'error', 5000);
      }
    } catch (err) {
      console.error('Mark recovered error:', err);
      showNotification('❌ Error updating payment status.', 'error', 5000);
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
        debugMode={debugMode}
      />

      {/* Main Content Layout with Dynamic Sidebar Offset */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-out ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        {/* Floating Toast with Semantic Feedback */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 right-6 z-50 max-w-md w-auto py-3 px-4 rounded-lg shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 text-emerald-50 border-emerald-500 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-rose-900/95 text-rose-50 border-rose-500 shadow-rose-950/40'
                : toast.type === 'loading'
                ? 'bg-zinc-900/95 text-zinc-100 border-blue-500 shadow-blue-950/30'
                : 'bg-blue-900/95 text-blue-50 border-blue-500 shadow-blue-950/40'
            }`}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300" aria-hidden="true" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300" aria-hidden="true" />}
              {toast.type === 'loading' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" aria-hidden="true" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-300" aria-hidden="true" />}
            </div>
            <p className="text-xs font-subheading font-medium leading-snug flex-1 pr-2">
              {toast.message}
            </p>
            {toast.type !== 'loading' && (
              <button
                type="button"
                onClick={() => setToast(null)}
                className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer transition-colors focus-rzp"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* View Workspace Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'overview' && (
            <OverviewView
              metrics={metrics}
              transactions={transactions}
              maxRetries={maxRetries}
              onNavigateTab={setActiveTab}
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

          {activeTab === 'agent-flow' && debugMode && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-zinc-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Autonomous Multi-Agent Telemetry Flow</span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
                  Deterministic step-by-step reasoning pipeline from checkout dropout to revenue capture.
                </p>
              </div>
              <SentinelTelemetryCard />
              <AgentStepFlow maxRetries={maxRetries} />
            </div>
          )}

          {activeTab === 'audit' && (
            <AuditView logs={auditLogs} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onClearDB={handleClearDB}
              onSeedDB={handleSeedDB}
              showNotification={showNotification}
              seeding={seeding}
              clearing={clearing}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
