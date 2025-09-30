import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Household = {
  id: string;
  user_id: string;
  region: string;
  income_level: string;
  household_size: number;
  monthly_budget: number;
  created_at: string;
  updated_at: string;
};

export type Appliance = {
  id: string;
  household_id: string;
  name: string;
  power_watts: number;
  usage_hours_per_day: number;
  quantity: number;
  usage_days_monthly: number;
  created_at: string;
};

export type Prediction = {
  id: string;
  household_id: string;
  monthly_consumption_kwh: number;
  estimated_bill_rwf: number;
  tariff_bracket: string;
  budget_status: string;
  created_at: string;
};

export type Report = {
  id: string;
  household_id: string;
  prediction_id: string;
  report_type: string;
  data: any;
  created_at: string;
};

export type HouseholdCluster = {
  id: string;
  household_id: string;
  cluster_id: number;
  cluster_method: string;
  is_anomaly: boolean;
  created_at: string;
};
