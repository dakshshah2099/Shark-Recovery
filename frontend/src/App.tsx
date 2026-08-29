import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { MetricCards } from './components/MetricCards';
import { TransactionTable } from './components/TransactionTable';
import { WhatsAppMock } from './components/WhatsAppMock';
import { AuditLogTimeline } from './components/AuditLogTimeline';
import type {
  AuditLogItem,
  DashboardMetrics,
  TransactionItem,
  WhatsAppMessage,
} from './types';

export const App: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [whatsappFeed, setWhatsappFeed] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchData = useCallback(async (isManualSync = false) => {
    if (isManualSync) setRefreshing(true);
    try {
      const [metricsRes, txnsRes, auditRes, waRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/transactions?limit=50'),
        fetch('/api/audit-logs?limit=50'),
        fetch('/api/whatsapp-feed?limit=20'),
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (txnsRes.ok) setTransactions(await txnsRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (waRes.ok) setWhatsappFeed(await waRes.json());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      if (isManualSync) setRefreshing(false);
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
        showNotification('Synthetic payment failure batch ingested & processed autonomously.');
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to simulate batch:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleRetry = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/retry`, {
        method: 'POST',
      });
      if (res.ok) {
        showNotification(`Re-executed AI recovery loop for transaction ${transactionId}`);
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
        showNotification(`Payment verified. Revenue recovered for transaction ${transactionId}`);
        await fetchData();
      }
    } catch (err) {
      console.error('Mark recovered error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
      <Navbar
        onSimulateBatch={handleSimulateBatch}
        onRefresh={() => fetchData(true)}
        simulating={simulating}
        refreshing={refreshing}
      />

      {/* Flat Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-blue-600 text-white font-medium text-xs py-2.5 px-4 rounded shadow-lg border border-blue-500 flex items-center gap-2">
          <span>{notification}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Metric Cards */}
        <MetricCards metrics={metrics} loading={loading} />

        {/* Main Grid: Transaction Table & WhatsApp Live Replica */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TransactionTable
              transactions={transactions}
              loading={loading}
              onRetry={handleRetry}
              onSimulatePay={handleSimulatePay}
            />
          </div>

          <div className="lg:col-span-1">
            <WhatsAppMock
              messages={whatsappFeed}
              onSimulatePay={handleSimulatePay}
            />
          </div>
        </div>

        {/* Real-time Agent Audit Ledger */}
        <div className="w-full">
          <AuditLogTimeline logs={auditLogs} />
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-4 bg-[#09090b] text-center text-xs text-zinc-500 font-mono">
        AI Shark Revenue Recovery Agent • Razorpay Buildathon 2026 • Pydantic-AI & FastAPI
      </footer>
    </div>
  );
};

export default App;
