import { useEffect, useState } from 'react';
import { Users, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase, type Household, type HouseholdCluster, type Report } from '../lib/supabase';

type HouseholdWithData = Household & {
  total_consumption?: number;
  total_cost?: number;
  appliance_count?: number;
};

export default function AdminSection() {
  const [households, setHouseholds] = useState<HouseholdWithData[]>([]);
  const [clusters, setClusters] = useState<HouseholdCluster[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalHouseholds: 0,
    anomalies: 0,
    totalClusters: 0,
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: householdData } = await supabase
      .from('households')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (householdData) {
      const { data: allHouseholds } = await supabase
        .from('households')
        .select('*');

      if (allHouseholds) {
        const householdsWithData = await Promise.all(
          allHouseholds.map(async (h) => {
            const { data: predictions } = await supabase
              .from('predictions')
              .select('*')
              .eq('household_id', h.id)
              .order('created_at', { ascending: false })
              .limit(1);

            const { data: appliances } = await supabase
              .from('appliances')
              .select('*')
              .eq('household_id', h.id);

            return {
              ...h,
              total_consumption: predictions?.[0]?.monthly_consumption_kwh || 0,
              total_cost: predictions?.[0]?.estimated_bill_rwf || 0,
              appliance_count: appliances?.length || 0,
            };
          })
        );

        setHouseholds(householdsWithData);
        setStats((prev) => ({ ...prev, totalHouseholds: householdsWithData.length }));
      }

      const { data: clusterData } = await supabase
        .from('household_clusters')
        .select('*');

      if (clusterData) {
        setClusters(clusterData);
        const uniqueClusters = new Set(clusterData.map((c) => c.cluster_id));
        const anomalyCount = clusterData.filter((c) => c.is_anomaly).length;
        setStats((prev) => ({
          ...prev,
          totalClusters: uniqueClusters.size,
          anomalies: anomalyCount,
        }));
      }

      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsData) {
        setReports(reportsData);
      }
    }
  };

  const runKMeansClustering = async () => {
    setLoading(true);

    const validHouseholds = households.filter(
      (h) => h.total_consumption && h.total_consumption > 0
    );

    if (validHouseholds.length < 3) {
      alert('Need at least 3 households with predictions to run clustering');
      setLoading(false);
      return;
    }

    const k = Math.min(3, validHouseholds.length);
    const data = validHouseholds.map((h) => ({
      id: h.id,
      consumption: h.total_consumption || 0,
      cost: h.total_cost || 0,
      size: h.household_size,
    }));

    const centroids = data.slice(0, k).map((d) => ({
      consumption: d.consumption,
      cost: d.cost,
      size: d.size,
    }));

    for (let iter = 0; iter < 10; iter++) {
      const assignments = data.map((point) => {
        let minDist = Infinity;
        let cluster = 0;

        centroids.forEach((centroid, idx) => {
          const dist = Math.sqrt(
            Math.pow(point.consumption - centroid.consumption, 2) +
            Math.pow(point.cost - centroid.cost, 2) +
            Math.pow(point.size - centroid.size, 2)
          );

          if (dist < minDist) {
            minDist = dist;
            cluster = idx;
          }
        });

        return { ...point, cluster };
      });

      for (let i = 0; i < k; i++) {
        const clusterPoints = assignments.filter((a) => a.cluster === i);
        if (clusterPoints.length > 0) {
          centroids[i] = {
            consumption: clusterPoints.reduce((sum, p) => sum + p.consumption, 0) / clusterPoints.length,
            cost: clusterPoints.reduce((sum, p) => sum + p.cost, 0) / clusterPoints.length,
            size: clusterPoints.reduce((sum, p) => sum + p.size, 0) / clusterPoints.length,
          };
        }
      }

      if (iter === 9) {
        for (const assignment of assignments) {
          await supabase.from('household_clusters').upsert({
            household_id: assignment.id,
            cluster_id: assignment.cluster,
            cluster_method: 'kmeans',
            is_anomaly: false,
          });
        }
      }
    }

    await loadAdminData();
    setLoading(false);
  };

  const runIsolationForest = async () => {
    setLoading(true);

    const validHouseholds = households.filter(
      (h) => h.total_consumption && h.total_consumption > 0
    );

    if (validHouseholds.length < 3) {
      alert('Need at least 3 households with predictions to detect anomalies');
      setLoading(false);
      return;
    }

    const consumptions = validHouseholds.map((h) => h.total_consumption || 0);
    const mean = consumptions.reduce((sum, c) => sum + c, 0) / consumptions.length;
    const variance = consumptions.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / consumptions.length;
    const stdDev = Math.sqrt(variance);

    const threshold = mean + 2 * stdDev;

    for (const household of validHouseholds) {
      const isAnomaly = (household.total_consumption || 0) > threshold;

      await supabase.from('household_clusters').upsert({
        household_id: household.id,
        cluster_id: isAnomaly ? -1 : 0,
        cluster_method: 'isolation_forest',
        is_anomaly: isAnomaly,
      });
    }

    await loadAdminData();
    setLoading(false);
  };

  const getClusterColor = (clusterId: number) => {
    const colors = ['#00FF7F', '#FF8C00', '#8B5CF6', '#EC4899'];
    return colors[clusterId % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#00FF7F]/20 to-gray-900 rounded-2xl p-6 border border-[#00FF7F]">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-[#00FF7F]" size={24} />
          </div>
          <h3 className="text-sm text-gray-400">Total Households</h3>
          <p className="text-3xl font-bold text-[#00FF7F] mt-1">{stats.totalHouseholds}</p>
        </div>

        <div className="bg-gradient-to-br from-[#FF8C00]/20 to-gray-900 rounded-2xl p-6 border border-[#FF8C00]">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-[#FF8C00]" size={24} />
          </div>
          <h3 className="text-sm text-gray-400">Clusters Identified</h3>
          <p className="text-3xl font-bold text-[#FF8C00] mt-1">{stats.totalClusters}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-gray-900 rounded-2xl p-6 border border-red-500">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="text-red-400" size={24} />
          </div>
          <h3 className="text-sm text-gray-400">Anomalies Detected</h3>
          <p className="text-3xl font-bold text-red-400 mt-1">{stats.anomalies}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-[#FF8C00] mb-6">Unsupervised Learning Models</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#00FF7F]/20 p-3 rounded-lg">
                <TrendingUp className="text-[#00FF7F]" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">K-Means Clustering</h3>
                <p className="text-sm text-gray-400">Group similar households</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Groups households into clusters based on consumption patterns, cost, and household size.
              Like sorting fruits into baskets by type.
            </p>
            <button
              onClick={runKMeansClustering}
              disabled={loading}
              className="w-full bg-[#00FF7F] text-black px-4 py-3 rounded-lg font-semibold hover:bg-[#00DD6F] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Run K-Means
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500/20 p-3 rounded-lg">
                <AlertTriangle className="text-red-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Isolation Forest</h3>
                <p className="text-sm text-gray-400">Find unusual households</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Detects anomalous energy consumption patterns that deviate significantly from normal usage.
              Like finding the one rotten apple in the basket.
            </p>
            <button
              onClick={runIsolationForest}
              disabled={loading}
              className="w-full bg-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Run Isolation Forest
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-[#FF8C00] mb-6">Household Analysis</h3>

        {households.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No household data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Region</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Income</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Size</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Consumption</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Cost</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Cluster</th>
                  <th className="text-left py-3 px-4 text-[#00FF7F]">Status</th>
                </tr>
              </thead>
              <tbody>
                {households.map((household) => {
                  const cluster = clusters.find((c) => c.household_id === household.id);
                  return (
                    <tr key={household.id} className="border-b border-gray-800">
                      <td className="py-3 px-4 text-white">{household.region}</td>
                      <td className="py-3 px-4 text-white">{household.income_level}</td>
                      <td className="py-3 px-4 text-white">{household.household_size}</td>
                      <td className="py-3 px-4 text-white">
                        {household.total_consumption?.toFixed(2) || 'N/A'} kWh
                      </td>
                      <td className="py-3 px-4 text-white">
                        {household.total_cost?.toLocaleString() || 'N/A'} RWF
                      </td>
                      <td className="py-3 px-4">
                        {cluster ? (
                          <span
                            className="px-3 py-1 rounded-full text-sm font-semibold"
                            style={{
                              backgroundColor: `${getClusterColor(cluster.cluster_id)}20`,
                              color: getClusterColor(cluster.cluster_id),
                              border: `1px solid ${getClusterColor(cluster.cluster_id)}`,
                            }}
                          >
                            {cluster.cluster_method === 'kmeans'
                              ? `Cluster ${cluster.cluster_id}`
                              : cluster.is_anomaly
                              ? 'Anomaly'
                              : 'Normal'}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not Clustered</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {cluster?.is_anomaly ? (
                          <span className="text-red-400 font-semibold">Unusual</span>
                        ) : (
                          <span className="text-[#00FF7F]">Normal</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-[#FF8C00] mb-4">Reports from Predictions</h3>
        <p className="text-gray-300 mb-4">
          {reports.length} reports available for clustering analysis
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Reports</p>
            <p className="text-2xl font-bold text-white mt-1">{reports.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Prediction Reports</p>
            <p className="text-2xl font-bold text-white mt-1">
              {reports.filter((r) => r.report_type === 'prediction').length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Analysis Reports</p>
            <p className="text-2xl font-bold text-white mt-1">
              {reports.filter((r) => r.report_type === 'analysis').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
