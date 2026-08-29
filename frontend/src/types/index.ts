export type TransactionStatus = 'pending' | 'failed' | 'processing' | 'recovered' | 'abandoned';

export type FailureCategory =
  | 'insufficient_funds'
  | 'authentication_failed'
  | 'bank_server_error'
  | 'expired_card'
  | 'user_dropout'
  | 'network_timeout'
  | 'payment_declined'
  | 'unknown';

export interface DashboardMetrics {
  total_failed_revenue: number;
  total_recovered_revenue: number;
  recovery_rate_percent: number;
  total_transactions_count: number;
  active_recovery_count: number;
  email_dispatched_count: number;
  whatsapp_dispatched_count: number;
}

export interface TransactionItem {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string | null;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  failure_code?: string | null;
  failure_reason?: string | null;
  failure_category: FailureCategory;
  retry_count: number;
  max_retries: number;
  recovery_link?: string | null;
  recovery_channel?: string | null;
  discount_applied_percent: number;
  recovered_amount: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLogItem {
  id: string;
  transaction_id?: string | null;
  customer_id?: string | null;
  agent_name: string;
  action_type: string;
  status: 'success' | 'failure' | 'skipped';
  input_payload?: string | null;
  output_payload?: string | null;
  metadata_json?: string | null;
  execution_duration_ms?: number | null;
  created_at: string;
}

export interface WhatsAppMessage {
  message_id: string;
  transaction_id: string;
  recipient_phone: string;
  recipient_name: string;
  message: string;
  payment_link: string;
  template_name?: string | null;
  status: string;
  read_receipt: boolean;
  timestamp: string;
}
