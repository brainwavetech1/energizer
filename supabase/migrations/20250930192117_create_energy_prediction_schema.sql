/*
  # Rwanda Household Energy Predictor Database Schema

  1. New Tables
    - `households`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `region` (text) - Kigali, Eastern, Western, Northern, Southern
      - `income_level` (text) - Low, Medium, High
      - `household_size` (integer)
      - `monthly_budget` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `appliances`
      - `id` (uuid, primary key)
      - `household_id` (uuid, foreign key to households)
      - `name` (text)
      - `power_watts` (numeric)
      - `usage_hours_per_day` (numeric)
      - `quantity` (integer)
      - `usage_days_monthly` (integer)
      - `created_at` (timestamptz)
    
    - `predictions`
      - `id` (uuid, primary key)
      - `household_id` (uuid, foreign key to households)
      - `monthly_consumption_kwh` (numeric)
      - `estimated_bill_rwf` (numeric)
      - `tariff_bracket` (text) - 0-20, 21-50, 50+
      - `budget_status` (text) - within_budget, over_budget
      - `created_at` (timestamptz)
    
    - `reports`
      - `id` (uuid, primary key)
      - `household_id` (uuid, foreign key to households)
      - `prediction_id` (uuid, foreign key to predictions)
      - `report_type` (text) - prediction, analysis
      - `data` (jsonb)
      - `created_at` (timestamptz)
    
    - `household_clusters`
      - `id` (uuid, primary key)
      - `household_id` (uuid, foreign key to households)
      - `cluster_id` (integer)
      - `cluster_method` (text) - kmeans, isolation_forest
      - `is_anomaly` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for admin access to all data
*/

-- Create households table
CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  region text NOT NULL,
  income_level text NOT NULL,
  household_size integer NOT NULL DEFAULT 1,
  monthly_budget numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create appliances table
CREATE TABLE IF NOT EXISTS appliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  power_watts numeric NOT NULL,
  usage_hours_per_day numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  usage_days_monthly integer NOT NULL DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  monthly_consumption_kwh numeric NOT NULL,
  estimated_bill_rwf numeric NOT NULL,
  tariff_bracket text NOT NULL,
  budget_status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  prediction_id uuid REFERENCES predictions(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create household_clusters table
CREATE TABLE IF NOT EXISTS household_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  cluster_id integer NOT NULL,
  cluster_method text NOT NULL,
  is_anomaly boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_clusters ENABLE ROW LEVEL SECURITY;

-- Policies for households
CREATE POLICY "Users can view own household data"
  ON households FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own household data"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own household data"
  ON households FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own household data"
  ON households FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for appliances
CREATE POLICY "Users can view own appliances"
  ON appliances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = appliances.household_id
      AND households.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own appliances"
  ON appliances FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = appliances.household_id
      AND households.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own appliances"
  ON appliances FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = appliances.household_id
      AND households.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = appliances.household_id
      AND households.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own appliances"
  ON appliances FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = appliances.household_id
      AND households.user_id = auth.uid()
    )
  );

-- Policies for predictions
CREATE POLICY "Users can view own predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = predictions.household_id
      AND households.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = predictions.household_id
      AND households.user_id = auth.uid()
    )
  );

-- Policies for reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = reports.household_id
      AND households.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = reports.household_id
      AND households.user_id = auth.uid()
    )
  );

-- Policies for household_clusters
CREATE POLICY "Users can view own cluster data"
  ON household_clusters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = household_clusters.household_id
      AND households.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own cluster data"
  ON household_clusters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = household_clusters.household_id
      AND households.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_households_user_id ON households(user_id);
CREATE INDEX IF NOT EXISTS idx_appliances_household_id ON appliances(household_id);
CREATE INDEX IF NOT EXISTS idx_predictions_household_id ON predictions(household_id);
CREATE INDEX IF NOT EXISTS idx_reports_household_id ON reports(household_id);
CREATE INDEX IF NOT EXISTS idx_household_clusters_household_id ON household_clusters(household_id);