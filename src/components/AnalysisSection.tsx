import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase, type Appliance, type Household, type Prediction } from '../lib/supabase';
import { TrendingUp, Zap, DollarSign, Users } from 'lucide-react';

const COLORS = ['#00FF7F', '#FF8C00', '#8B5CF6', '#EC4899', '#3B82F6', '#F59E0B'];

export default function AnalysisSection() {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalConsumption: 0,
    totalCost: 0,
    avgDailyUsage: 0,
    applianceCount: 0,
  });

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: householdData } = await supabase
      .from('households')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (householdData) {
      setHousehold(householdData);

      const { data: appliancesData } = await supabase
        .from('appliances')
        .select('*')
        .eq('household_id', householdData.id);

      if (appliancesData) {
        setAppliances(appliancesData);

        const chartDataTemp = appliancesData.map((app) => {
          const monthlyKwh = (app.power_watts * app.usage_hours_per_day * app.quantity * app.usage_days_monthly) / 1000;
          return {
            name: app.name,
            kwh: parseFloat(monthlyKwh.toFixed(2)),
          };
        });
        setChartData(chartDataTemp);

        const pieDataTemp = appliancesData.map((app) => {
          const monthlyKwh = (app.power_watts * app.usage_hours_per_day * app.quantity * app.usage_days_monthly) / 1000;
          return {
            name: app.name,
            value: parseFloat(monthlyKwh.toFixed(2)),
          };
        });
        setPieData(pieDataTemp);

        const totalKwh = chartDataTemp.reduce((sum, item) => sum + item.kwh, 0);
        const avgDaily = totalKwh / 30;

        setStats({
          totalConsumption: totalKwh,
          totalCost: 0,
          avgDailyUsage: avgDaily,
          applianceCount: appliancesData.length,
        });
      }

      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('*')
        .eq('household_id', householdData.id)
        .order('created_at', { ascending: false });

      if (predictionsData && predictionsData.length > 0) {
        setPredictions(predictionsData);
        setStats((prev) => ({
          ...prev,
          totalCost: predictionsData[0].estimated_bill_rwf,
        }));
      }
    }
  };

  const getRecommendations = () => {
    const recommendations = [];

    appliances.forEach((app) => {
      const monthlyKwh = (app.power_watts * app.usage_hours_per_day * app.quantity * app.usage_days_monthly) / 1000;

      if (monthlyKwh > 50) {
        recommendations.push({
          type: 'warning',
          message: `${app.name} consumes ${monthlyKwh.toFixed(1)} kWh/month. Consider reducing usage by 1 hour/day to save ${((app.power_watts * 30) / 1000).toFixed(1)} kWh.`,
        });
      }

      if (app.name.toLowerCase().includes('bulb') || app.name.toLowerCase().includes('light')) {
        recommendations.push({
          type: 'tip',
          message: `Switch to LED ${app.name} to reduce energy consumption by up to 75%.`,
        });
      }

      if (app.name.toLowerCase().includes('ac') || app.name.toLowerCase().includes('air')) {
        recommendations.push({
          type: 'tip',
          message: `Set ${app.name} to 24°C instead of 18°C to save up to 30% energy.`,
        });
      }
    });

    if (stats.totalConsumption > 100) {
      recommendations.push({
        type: 'warning',
        message: `Your total consumption is ${stats.totalConsumption.toFixed(1)} kWh/month. Consider using energy during off-peak hours to reduce costs.`,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'Great job! Your energy usage is efficient. Keep monitoring your consumption.',
      });
    }

    return recommendations;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#00FF7F]/20 to-gray-900 rounded-2xl p-6 border border-[#00FF7F]">
          <div className="flex items-center justify-between mb-2">
            <Zap className="text-[#00FF7F]" size={24} />
          </div>
          <h3 className="text-sm text-gray-400">Total Consumption</h3>
          <p className="text-2xl font-bold text-[#00FF7F] mt-1">{stats.totalConsumption.toFixed(2)} kWh</p>
        </div>

        <div className="bg-gradient-to-br from-[#FF8C00]/20 to-gray-900 rounded-2xl p-6 border border-[#FF8C00]">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-[#FF8C00]" size={24} />
          </div>
          <h3 className="text-sm text-gray-400">Estimated Cost</h3>
          <p className="text-2xl font-bold text-[#FF8C00] mt-1">{stats.totalCost.toLocaleString()} RWF</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-gray-900 rounded-2xl p-6 border border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-purple-400" size={24} />
          </div>
          <h3 className="text-sm text-gray-400">Avg Daily Usage</h3>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.avgDailyUsage.toFixed(2)} kWh</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-gray-900 rounded-2xl p-6 border border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-blue-400" size={24} />
          </div>
          <h3 className="text-sm text-gray-400">Appliances</h3>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.applianceCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-[#FF8C00] mb-6">Energy Consumption by Appliance</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="kwh" fill="#00FF7F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No appliance data available
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-[#FF8C00] mb-6">Consumption Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No appliance data available
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-[#FF8C00] mb-6">Smart Recommendations</h3>
        <div className="space-y-3">
          {getRecommendations().map((rec, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 border ${
                rec.type === 'warning'
                  ? 'bg-[#FF8C00]/20 border-[#FF8C00]'
                  : rec.type === 'tip'
                  ? 'bg-[#00FF7F]/20 border-[#00FF7F]'
                  : 'bg-blue-500/20 border-blue-500'
              }`}
            >
              <p className="text-white">{rec.message}</p>
            </div>
          ))}
        </div>
      </div>

      {household && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-[#FF8C00] mb-6">Household Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Region</p>
              <p className="text-lg font-semibold text-white mt-1">{household.region}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Income Level</p>
              <p className="text-lg font-semibold text-white mt-1">{household.income_level}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Household Size</p>
              <p className="text-lg font-semibold text-white mt-1">{household.household_size} people</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
