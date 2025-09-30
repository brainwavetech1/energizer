import { useState, useEffect } from 'react';
import { User, Save, LogOut, Settings as SettingsIcon, Bell, Shield, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SettingsSection() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'personal'>('general');
  const [saved, setSaved] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  const [generalSettings, setGeneralSettings] = useState({
    emailNotifications: true,
    monthlyReports: true,
    budgetAlerts: true,
    language: 'English',
    timezone: 'Africa/Kigali',
    currency: 'RWF',
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setPersonalInfo((prev) => ({
        ...prev,
        email: user.email || '',
      }));
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'general'
                ? 'bg-[#00FF7F] text-black'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <SettingsIcon size={20} />
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'personal'
                ? 'bg-[#00FF7F] text-black'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <User size={20} />
            Personal Information
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'general' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#FF8C00] mb-6">General Settings</h2>

                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Bell className="text-[#00FF7F]" size={24} />
                      <h3 className="text-lg font-semibold text-white">Notifications</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-400">Receive alerts about high consumption</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={generalSettings.emailNotifications}
                            onChange={(e) =>
                              setGeneralSettings({ ...generalSettings, emailNotifications: e.target.checked })
                            }
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00FF7F]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Monthly Reports</p>
                          <p className="text-sm text-gray-400">Get monthly energy usage summary</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={generalSettings.monthlyReports}
                            onChange={(e) =>
                              setGeneralSettings({ ...generalSettings, monthlyReports: e.target.checked })
                            }
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00FF7F]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Budget Alerts</p>
                          <p className="text-sm text-gray-400">Alert when nearing budget limit</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={generalSettings.budgetAlerts}
                            onChange={(e) =>
                              setGeneralSettings({ ...generalSettings, budgetAlerts: e.target.checked })
                            }
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00FF7F]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe className="text-[#00FF7F]" size={24} />
                      <h3 className="text-lg font-semibold text-white">Regional Settings</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                        <select
                          value={generalSettings.language}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                        >
                          <option>English</option>
                          <option>Kinyarwanda</option>
                          <option>French</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                        <select
                          value={generalSettings.timezone}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                        >
                          <option>Africa/Kigali</option>
                          <option>Africa/Nairobi</option>
                          <option>UTC</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                        <select
                          value={generalSettings.currency}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                        >
                          <option>RWF</option>
                          <option>USD</option>
                          <option>EUR</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    className="bg-[#00FF7F] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#00DD6F] transition-all flex items-center gap-2"
                  >
                    <Save size={20} />
                    {saved ? 'Saved!' : 'Save General Settings'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#FF8C00] mb-6">Personal Information</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                      <input
                        type="text"
                        value={personalInfo.firstName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                        placeholder="John"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={personalInfo.lastName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                      placeholder="078XXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                    <input
                      type="text"
                      value={personalInfo.address}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                    <input
                      type="text"
                      value={personalInfo.city}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                      placeholder="Kigali"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
                    <input
                      type="text"
                      value={user?.id || 'Not signed in'}
                      disabled
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500"
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    className="bg-[#00FF7F] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#00DD6F] transition-all flex items-center gap-2"
                  >
                    <Save size={20} />
                    {saved ? 'Saved!' : 'Save Personal Information'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-[#FF8C00] mb-4">About</h3>
        <div className="space-y-3 text-gray-300">
          <p>Rwanda Household Energy Predictor Dashboard v1.0</p>
          <p className="text-sm text-gray-400">
            This application helps Rwandan households predict and manage their energy consumption
            efficiently. Features include:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-gray-400">
            <li>Energy consumption prediction based on appliances</li>
            <li>Budget analysis and recommendations</li>
            <li>Advanced analytics with charts and statistics</li>
            <li>Machine learning clustering for pattern detection</li>
            <li>Automated report generation</li>
          </ul>
        </div>
      </div>

      {user && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-red-500 mb-4">Danger Zone</h3>
          <button
            onClick={handleSignOut}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
