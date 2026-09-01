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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-5 sm:p-6 shadow-xs transition-colors">
        <div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>Transactions & Recovery Ledger</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
            Real-time feed of intercepted payment dropouts, root causes, and dynamic payment recovery links.
          </p>
        </div>

        <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272a] self-start sm:self-auto">
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
