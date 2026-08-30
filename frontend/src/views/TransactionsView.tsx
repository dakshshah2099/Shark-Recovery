import React from 'react';
import { TransactionTable } from '../components/TransactionTable';
import { Table } from 'lucide-react';
import type { TransactionItem } from '../types';

interface TransactionsViewProps {
  transactions: TransactionItem[];
  loading: boolean;
  onRetry: (id: string) => void;
  onSimulatePay: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  loading,
  onRetry,
  onSimulatePay,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111217] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-xs transition-colors">
        <div>
          <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2.5">
            <Table className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span>Transactions & Recovery Ledger</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Real-time feed of all intercepted checkout dropouts, diagnostic categories, and recovery statuses.
          </p>
        </div>

        <div className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/40 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.06] self-start sm:self-auto">
          {transactions.length} Total Records
        </div>
      </div>

      <TransactionTable
        transactions={transactions}
        loading={loading}
        onRetry={onRetry}
        onSimulatePay={onSimulatePay}
      />
    </div>
  );
};
