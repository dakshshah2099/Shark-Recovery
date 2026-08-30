import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
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
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSimulateBatch={handleSimulateBatch}
        simulating={simulating}
      />

      {/* Floating Flat Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-blue-600 text-white font-medium text-xs py-2.5 px-4 rounded shadow-lg border border-blue-500 flex items-center gap-2">
          <span>{notification}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
  );
};

export default App;
