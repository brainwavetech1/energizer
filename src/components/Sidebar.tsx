import { LayoutDashboard, TrendingUp, BarChart3, FileText, Settings } from 'lucide-react';

type SidebarProps = {
  activeSection: string;
  setActiveSection: (section: string) => void;
};

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const menuItems = [
    { id: 'admin', label: 'Admin', icon: LayoutDashboard },
    { id: 'prediction', label: 'Prediction', icon: TrendingUp },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-black border-r border-gray-800 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-[#00FF7F]">Energy Predictor</h1>
        <p className="text-xs text-gray-400 mt-1">Rwanda Household</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                activeSection === item.id
                  ? 'bg-[#00FF7F] text-black font-semibold'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-[#00FF7F]'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">Rwanda Energy v1.0</p>
      </div>
    </div>
  );
}
