import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Settings } from '../lib/types';

function getNextRunDescription(dailyTime: string): string {
  const [hour, minute] = dailyTime.split(':').map(Number);
  const now = new Date();
  const todayRun = new Date(now);
  todayRun.setHours(hour, minute, 0, 0);

  if (now < todayRun) {
    return `今天 ${dailyTime}`;
  }
  return `明天 ${dailyTime}`;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save settings failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">加载中...</div>;
  if (!settings) return <div className="text-center py-16 text-gray-500">设置数据不存在</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">设置</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block font-semibold text-gray-800 mb-2">每日提醒时间</label>
          <input
            type="time"
            value={settings.dailyTime}
            onChange={(e) => setSettings({ ...settings, dailyTime: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">时区：{settings.timezone}</p>
          <p className="text-xs text-indigo-500 mt-1">下次自动生成：{getNextRunDescription(settings.dailyTime)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">学习方向权重</h3>
          <div className="space-y-3">
            <div>
              <label className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">AI Agent</span>
                <span className="text-gray-500">{(settings.topicWeights.agent * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0" max="100" step="5"
                value={settings.topicWeights.agent * 100}
                onChange={(e) => setSettings({
                  ...settings,
                  topicWeights: { ...settings.topicWeights, agent: Number(e.target.value) / 100 }
                })}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">软件架构</span>
                <span className="text-gray-500">{(settings.topicWeights.engineering * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0" max="100" step="5"
                value={settings.topicWeights.engineering * 100}
                onChange={(e) => setSettings({
                  ...settings,
                  topicWeights: { ...settings.topicWeights, engineering: Number(e.target.value) / 100 }
                })}
                className="w-full accent-green-600"
              />
            </div>
            <div>
              <label className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">产品能力</span>
                <span className="text-gray-500">{(settings.topicWeights.product * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0" max="100" step="5"
                value={settings.topicWeights.product * 100}
                onChange={(e) => setSettings({
                  ...settings,
                  topicWeights: { ...settings.topicWeights, product: Number(e.target.value) / 100 }
                })}
                className="w-full accent-purple-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">AI 服务</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Provider</label>
              <select
                value={settings.aiProvider}
                onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value as 'mock' | 'openai' })}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full"
              >
                <option value="mock">Mock（开发模式）</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            {settings.aiProvider === 'openai' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">模型</label>
                <input
                  type="text"
                  value={settings.model || ''}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full"
                  placeholder="gpt-4.1"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.allowFreshSearch}
              onChange={(e) => setSettings({ ...settings, allowFreshSearch: e.target.checked })}
              className="accent-indigo-600"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">允许联网获取新近资料</span>
              <p className="text-xs text-gray-400">开启后系统会尝试获取最新行业动态</p>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
          {saved && <span className="text-green-600 text-sm">已保存</span>}
        </div>
      </div>
    </div>
  );
}
