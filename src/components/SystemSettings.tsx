'use client';

import React, { useState, useEffect } from 'react';

interface SystemSetting {
  id?: number;
  setting_name: string;
  setting_value: string;
  description?: string;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);

  // Fetch system settings
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/system-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError('Failed to load system settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update system setting
  const updateSetting = async (setting: SystemSetting) => {
    try {
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting)
      });

      if (!response.ok) throw new Error('Failed to update setting');

      setEditingSetting(null);
      await fetchSettings(); // Refresh settings
      
    } catch (err) {
      setError('Failed to update setting');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <div>Loading system settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">System Configuration</h3>
        
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.setting_name} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {setting.setting_name.replace(/_/g, ' ')}
                  </h4>
                  {setting.description && (
                    <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                  )}
                </div>
                
                {editingSetting?.setting_name === setting.setting_name ? (
                  <div className="flex items-center gap-2">
                    {setting.setting_name === 'timezone' ? (
                      <select
                        value={editingSetting.setting_value}
                        onChange={(e) => setEditingSetting({
                          ...editingSetting,
                          setting_value: e.target.value
                        })}
                        className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900"
                      >
                        <option value="IST">IST (Indian Standard Time)</option>
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="EST">EST (Eastern Standard Time)</option>
                        <option value="PST">PST (Pacific Standard Time)</option>
                        <option value="CET">CET (Central European Time)</option>
                      </select>
                    ) : setting.setting_name === 'currency' ? (
                      <select
                        value={editingSetting.setting_value}
                        onChange={(e) => setEditingSetting({
                          ...editingSetting,
                          setting_value: e.target.value
                        })}
                        className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900"
                      >
                        <option value="INR">INR (Indian Rupee)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="GBP">GBP (British Pound)</option>
                        <option value="JPY">JPY (Japanese Yen)</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={editingSetting.setting_value}
                        onChange={(e) => setEditingSetting({
                          ...editingSetting,
                          setting_value: e.target.value
                        })}
                        className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900"
                      />
                    )}
                    <button
                      onClick={() => updateSetting(editingSetting)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSetting(null)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                      {setting.setting_value}
                    </span>
                    <button
                      onClick={() => setEditingSetting(setting)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {settings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">No system settings found</div>
            <div className="text-sm">System settings will be available after the database is initialized</div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">System Settings Information</h4>
        <p className="text-sm text-yellow-700">
          These settings control various aspects of the cafe management system. 
          Changes made here will affect the entire application.
        </p>
      </div>
    </div>
  );
};

export default SystemSettings;
