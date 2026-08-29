import React from 'react';
import { TransactionTable } from '../components/TransactionTable';
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-lg text-white">
            Transactions & Recovery Ledger
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time feed of all failed, retrying, recovered, and gated transactions.
          </p>
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
