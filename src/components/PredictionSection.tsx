import { useState, useEffect } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import { supabase, type Appliance, type Household, type Prediction } from '../lib/supabase';

type ApplianceInput = {
  name: string;
  power_watts: number;
  usage_hours_per_day: number;
  quantity: number;
  usage_days_monthly: number;
};

export default function PredictionSection() {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  const [formData, setFormData] = useState<ApplianceInput>({
    name: '',
    power_watts: 0,
    usage_hours_per_day: 0,
    quantity: 1,
    usage_days_monthly: 30,
  });

  const [householdData, setHouseholdData] = useState({
    region: 'Kigali',
    income_level: 'Medium',
    household_size: 1,
    monthly_budget: 0,
  });

  useEffect(() => {
    loadHouseholdData();
  }, []);

  const loadHouseholdData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: householdData } = await supabase
      .from('households')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (householdData) {
      setHousehold(householdData);
      setHouseholdData({
        region: householdData.region,
        income_level: householdData.income_level,
        household_size: householdData.household_size,
        monthly_budget: householdData.monthly_budget,
      });

      const { data: appliancesData } = await supabase
        .from('appliances')
        .select('*')
        .eq('household_id', householdData.id);

      if (appliancesData) {
        setAppliances(appliancesData);
      }

      const { data: predictionData } = await supabase
        .from('predictions')
        .select('*')
        .eq('household_id', householdData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (predictionData) {
        setPrediction(predictionData);
      }
    }
  };

  const handleAddAppliance = async () => {
    if (!formData.name || formData.power_watts <= 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let householdId = household?.id;

    if (!householdId) {
      const { data: newHousehold } = await supabase
        .from('households')
        .insert({
          user_id: user.id,
          ...householdData,
        })
        .select()
        .single();

      if (newHousehold) {
        householdId = newHousehold.id;
        setHousehold(newHousehold);
      }
    }

    if (householdId) {
      const { data: newAppliance } = await supabase
        .from('appliances')
        .insert({
          household_id: householdId,
          ...formData,
        })
        .select()
        .single();

      if (newAppliance) {
        setAppliances([...appliances, newAppliance]);
        setFormData({
          name: '',
          power_watts: 0,
          usage_hours_per_day: 0,
          quantity: 1,
          usage_days_monthly: 30,
        });
      }
    }
  };

  const handleDeleteAppliance = async (id: string) => {
    await supabase.from('appliances').delete().eq('id', id);
    setAppliances(appliances.filter((a) => a.id !== id));
  };

  const calculatePrediction = async () => {
    if (!household || appliances.length === 0) return;

    let totalKwh = 0;
    appliances.forEach((app) => {
      const dailyKwh = (app.power_watts * app.usage_hours_per_day * app.quantity) / 1000;
      const monthlyKwh = dailyKwh * app.usage_days_monthly;
      totalKwh += monthlyKwh;
    });

    let tariffRate = 0;
    let bracket = '';

    if (totalKwh <= 20) {
      tariffRate = 200;
      bracket = '0-20';
    } else if (totalKwh <= 50) {
      tariffRate = 300;
      bracket = '21-50';
    } else {
      tariffRate = 450;
      bracket = '50+';
    }

    const estimatedBill = totalKwh * tariffRate;
    const budgetStatus = estimatedBill <= household.monthly_budget ? 'within_budget' : 'over_budget';

    const { data: newPrediction } = await supabase
      .from('predictions')
      .insert({
        household_id: household.id,
        monthly_consumption_kwh: totalKwh,
        estimated_bill_rwf: estimatedBill,
        tariff_bracket: bracket,
        budget_status: budgetStatus,
      })
      .select()
      .single();

    if (newPrediction) {
      setPrediction(newPrediction);

      await supabase.from('reports').insert({
        household_id: household.id,
        prediction_id: newPrediction.id,
        report_type: 'prediction',
        data: {
          appliances: appliances.map((a) => ({
            name: a.name,
            monthly_kwh: (a.power_watts * a.usage_hours_per_day * a.quantity * a.usage_days_monthly) / 1000,
          })),
          prediction: newPrediction,
          household: household,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-[#FF8C00] mb-6">Household Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
            <select
              value={householdData.region}
              onChange={(e) => setHouseholdData({ ...householdData, region: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
            >
              <option>Kigali</option>
              <option>Eastern</option>
              <option>Western</option>
              <option>Northern</option>
              <option>Southern</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Income Level</label>
            <select
              value={householdData.income_level}
              onChange={(e) => setHouseholdData({ ...householdData, income_level: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Household Size</label>
            <input
              type="number"
              value={householdData.household_size}
              onChange={(e) => setHouseholdData({ ...householdData, household_size: parseInt(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Budget (RWF)</label>
            <input
              type="number"
              value={householdData.monthly_budget}
              onChange={(e) => setHouseholdData({ ...householdData, monthly_budget: parseFloat(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-[#FF8C00] mb-6">Add Appliance</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Appliance Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Refrigerator"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Power (Watts)</label>
            <input
              type="number"
              value={formData.power_watts}
              onChange={(e) => setFormData({ ...formData, power_watts: parseFloat(e.target.value) })}
              placeholder="e.g., 150"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Usage Hours/Day</label>
            <input
              type="number"
              value={formData.usage_hours_per_day}
              onChange={(e) => setFormData({ ...formData, usage_hours_per_day: parseFloat(e.target.value) })}
              placeholder="e.g., 24"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              placeholder="e.g., 1"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Usage Days/Month</label>
            <input
              type="number"
              value={formData.usage_days_monthly}
              onChange={(e) => setFormData({ ...formData, usage_days_monthly: parseInt(e.target.value) })}
              placeholder="e.g., 30"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
              min="1"
              max="31"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddAppliance}
              className="w-full bg-[#00FF7F] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#00DD6F] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add Appliance
            </button>
          </div>
        </div>

        {appliances.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Name</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Power (W)</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Hours/Day</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Quantity</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Days/Month</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Action</th>
                </tr>
              </thead>
              <tbody>
                {appliances.map((app) => (
                  <tr key={app.id} className="border-b border-gray-800">
                    <td className="py-3 px-4 text-white">{app.name}</td>
                    <td className="py-3 px-4 text-white">{app.power_watts}</td>
                    <td className="py-3 px-4 text-white">{app.usage_hours_per_day}</td>
                    <td className="py-3 px-4 text-white">{app.quantity}</td>
                    <td className="py-3 px-4 text-white">{app.usage_days_monthly}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteAppliance(app.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {appliances.length > 0 && (
        <button
          onClick={calculatePrediction}
          className="w-full bg-[#FF8C00] text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#FF7F00] transition-all flex items-center justify-center gap-3"
        >
          <Zap size={24} />
          Generate Prediction
        </button>
      )}

      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#00FF7F]/20 to-gray-900 rounded-2xl p-6 border border-[#00FF7F]">
            <h3 className="text-sm text-gray-400 mb-2">Monthly Consumption</h3>
            <p className="text-3xl font-bold text-[#00FF7F]">{prediction.monthly_consumption_kwh.toFixed(2)} kWh</p>
          </div>

          <div className="bg-gradient-to-br from-[#FF8C00]/20 to-gray-900 rounded-2xl p-6 border border-[#FF8C00]">
            <h3 className="text-sm text-gray-400 mb-2">Estimated Bill</h3>
            <p className="text-3xl font-bold text-[#FF8C00]">{prediction.estimated_bill_rwf.toLocaleString()} RWF</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-gray-900 rounded-2xl p-6 border border-purple-500">
            <h3 className="text-sm text-gray-400 mb-2">Tariff Bracket</h3>
            <p className="text-3xl font-bold text-purple-400">{prediction.tariff_bracket} kWh</p>
          </div>
        </div>
      )}

      {prediction && household && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-[#FF8C00] mb-4">Budget Analysis</h3>

          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-400">Estimated Bill</span>
            <span className="text-white font-semibold">{prediction.estimated_bill_rwf.toLocaleString()} RWF</span>
          </div>

          <div className="mb-4 flex justify-between text-sm">
            <span className="text-gray-400">Monthly Budget</span>
            <span className="text-white font-semibold">{household.monthly_budget.toLocaleString()} RWF</span>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-4 mb-4">
            <div
              className={`h-4 rounded-full transition-all ${
                prediction.budget_status === 'within_budget' ? 'bg-[#00FF7F]' : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min((prediction.estimated_bill_rwf / household.monthly_budget) * 100, 100)}%`,
              }}
            />
          </div>

          {prediction.budget_status === 'within_budget' ? (
            <div className="bg-[#00FF7F]/20 border border-[#00FF7F] rounded-lg p-4">
              <p className="text-[#00FF7F] font-semibold">Budget Status: Within Budget</p>
              <p className="text-gray-300 text-sm mt-1">
                You have {(household.monthly_budget - prediction.estimated_bill_rwf).toLocaleString()} RWF remaining
              </p>
            </div>
          ) : (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 font-semibold">Budget Status: Over Budget</p>
              <p className="text-gray-300 text-sm mt-1">
                You are {(prediction.estimated_bill_rwf - household.monthly_budget).toLocaleString()} RWF over budget
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
