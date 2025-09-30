import { useEffect, useState } from 'react';
import { FileText, Download, Calendar, CreditCard as Edit, Trash2, X, Save } from 'lucide-react';
import { supabase, type Report } from '../lib/supabase';

export default function ReportsSection() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: householdData } = await supabase
      .from('households')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (householdData) {
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .eq('household_id', householdData.id)
        .order('created_at', { ascending: false });

      if (reportsData) {
        setReports(reportsData);
      }
    }

    setLoading(false);
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setEditData(report.data);
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;

    const { error } = await supabase
      .from('reports')
      .update({ data: editData })
      .eq('id', editingReport.id);

    if (!error) {
      await loadReports();
      setEditingReport(null);
      setEditData({});
    }
  };

  const handleDelete = async (reportId: string) => {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (!error) {
      await loadReports();
      setDeleteConfirm(null);
    }
  };

  const downloadReport = (report: Report) => {
    const dataStr = JSON.stringify(report.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${report.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#FF8C00]">Generated Reports</h2>
            <p className="text-sm text-gray-400 mt-1">Manage your energy prediction reports</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <FileText size={20} className="text-[#00FF7F]" />
            <span className="text-white font-semibold">{reports.length} Reports</span>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
            <FileText size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Reports Yet</h3>
            <p className="text-gray-500">Generate predictions to create reports</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-gray-800 rounded-xl border border-gray-700 hover:border-[#00FF7F] transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-[#00FF7F]/20 to-transparent p-3 rounded-lg border border-[#00FF7F]/50">
                        <FileText className="text-[#00FF7F]" size={28} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white capitalize">
                          {report.report_type} Report
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <Calendar size={14} />
                          <span>{formatDate(report.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadReport(report)}
                        className="bg-blue-500/20 text-blue-400 p-2.5 rounded-lg hover:bg-blue-500/30 transition-all border border-blue-500/50"
                        title="Download Report"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(report)}
                        className="bg-[#FF8C00]/20 text-[#FF8C00] p-2.5 rounded-lg hover:bg-[#FF8C00]/30 transition-all border border-[#FF8C00]/50"
                        title="Edit Report"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(report.id)}
                        className="bg-red-500/20 text-red-400 p-2.5 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/50"
                        title="Delete Report"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {report.data?.prediction && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">Monthly Consumption</p>
                        <p className="text-xl font-bold text-[#00FF7F]">
                          {report.data.prediction.monthly_consumption_kwh?.toFixed(2)} kWh
                        </p>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">Estimated Bill</p>
                        <p className="text-xl font-bold text-[#FF8C00]">
                          {report.data.prediction.estimated_bill_rwf?.toLocaleString()} RWF
                        </p>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">Tariff Bracket</p>
                        <p className="text-xl font-bold text-purple-400">
                          {report.data.prediction.tariff_bracket} kWh
                        </p>
                      </div>
                    </div>
                  )}

                  {report.data?.household && (
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">Household Information</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Region</p>
                          <p className="text-white font-medium">{report.data.household.region}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Income</p>
                          <p className="text-white font-medium">{report.data.household.income_level}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Size</p>
                          <p className="text-white font-medium">{report.data.household.household_size} people</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Budget</p>
                          <p className="text-white font-medium">{report.data.household.monthly_budget?.toLocaleString()} RWF</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {report.data?.appliances && report.data.appliances.length > 0 && (
                    <div className="mt-4 bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-3">Appliances ({report.data.appliances.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {report.data.appliances.map((app: any, index: number) => (
                          <span
                            key={index}
                            className="bg-[#00FF7F]/10 border border-[#00FF7F]/30 px-3 py-1.5 rounded-full text-sm text-[#00FF7F] font-medium"
                          >
                            {app.name}: {app.monthly_kwh?.toFixed(1)} kWh
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {deleteConfirm === report.id && (
                  <div className="bg-red-500/10 border-t border-red-500/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trash2 className="text-red-400" size={20} />
                        <p className="text-white font-medium">Are you sure you want to delete this report?</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editingReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[#FF8C00]">Edit Report</h3>
              <button
                onClick={() => setEditingReport(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Report Type</label>
                <input
                  type="text"
                  value={editingReport.report_type}
                  disabled
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500"
                />
              </div>

              {editData?.prediction && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-semibold text-white mb-3">Prediction Data</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Monthly Consumption (kWh)
                      </label>
                      <input
                        type="number"
                        value={editData.prediction.monthly_consumption_kwh}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            prediction: {
                              ...editData.prediction,
                              monthly_consumption_kwh: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Estimated Bill (RWF)
                      </label>
                      <input
                        type="number"
                        value={editData.prediction.estimated_bill_rwf}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            prediction: {
                              ...editData.prediction,
                              estimated_bill_rwf: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tariff Bracket</label>
                      <select
                        value={editData.prediction.tariff_bracket}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            prediction: {
                              ...editData.prediction,
                              tariff_bracket: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                      >
                        <option>0-20</option>
                        <option>21-50</option>
                        <option>50+</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[#00FF7F] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#00DD6F] transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingReport(null)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-[#FF8C00] mb-4">Report Management Guide</h3>
        <div className="space-y-3 text-gray-300">
          <p className="text-sm">
            Reports are automatically generated when you create predictions. You can manage your reports using the following actions:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <Download size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                <strong className="text-white">Download:</strong> Export report data as JSON for external analysis
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Edit size={18} className="text-[#FF8C00] mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                <strong className="text-white">Edit:</strong> Modify prediction values and tariff brackets
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Trash2 size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                <strong className="text-white">Delete:</strong> Remove reports you no longer need
              </span>
            </li>
          </ul>
          <p className="text-sm text-gray-400 pt-2">
            All reports contain detailed energy consumption breakdown, household information, and are available for admin clustering analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
