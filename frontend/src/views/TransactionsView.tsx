import React from 'react';
import { TransactionTable } from '../components/TransactionTable';
import { Table } from 'lucide-react';
import type { TransactionItem } from '../types';

interface TransactionsViewProps {
  transactions: TransactionItem[];
  loading: boolean;
  onRetry: (id: string) => Promise<void> | void;
  onSimulatePay: (id: string) => Promise<void> | void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  loading,
  onRetry,
  onSimulatePay,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-[#172a46] rounded-xl p-5 sm:p-6 shadow-xs transition-colors">
        <div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-[#0c83ff] dark:text-[#3395ff]" />
            <span>Transactions & Recovery Ledger</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#7a95b8] mt-0.5">
            Real-time feed of intercepted payment dropouts, root causes, and dynamic payment recovery links.
          </p>
        </div>

        <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#080d1a] text-slate-700 dark:text-[#cad8ec] border border-slate-200 dark:border-[#172a46] self-start sm:self-auto">
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
