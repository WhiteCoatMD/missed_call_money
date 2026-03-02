export interface User {
  id: string;
  email: string;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  phone_number: string | null;
  twilio_number: string | null;
  average_job_value: number;
  close_rate: number;
  auto_reply_template: string;
  white_label_enabled: boolean;
  white_label_name: string | null;
  white_label_logo_url: string | null;
  badge_enabled: boolean;
  ai_prompt: string;
  created_at: string;
}

export interface Call {
  id: string;
  business_id: string;
  caller_number: string;
  call_status: 'answered' | 'missed';
  call_sid: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  business_id: string;
  caller_number: string;
  name: string | null;
  message_thread: MessageEntry[];
  converted: boolean;
  revenue_value: number;
  created_at: string;
}

export interface MessageEntry {
  from: 'caller' | 'system';
  body: string;
  timestamp: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'pending' | 'converted' | 'paid';
  reward_amount: number;
  created_at: string;
}

export interface AiMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

export interface AiConversation {
  id: string;
  business_id: string;
  caller_number: string;
  call_sid: string | null;
  messages: AiMessage[];
  extracted_name: string | null;
  extracted_reason: string | null;
  turn_count: number;
  status: 'active' | 'completed' | 'error';
  created_at: string;
}

export interface BusinessStats {
  missed_calls_30d: number;
  total_leads: number;
  revenue_recovered: number;
  revenue_recovered_this_month: number;
}
