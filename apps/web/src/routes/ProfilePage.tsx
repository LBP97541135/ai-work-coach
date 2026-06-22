import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { UserProfile } from '../lib/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProfile().then(setProfile).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-500">加载中...</div>;
  if (!profile) return <div className="text-center py-16 text-gray-500">画像数据不存在</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">学习画像</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="font-semibold text-gray-800 mb-2">基本信息</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">角色：</span>{profile.role}</div>
          <div><span className="text-gray-500">风格：</span>{profile.preferredStyle}</div>
          <div><span className="text-gray-500">难度：</span>{profile.preferredDifficulty}</div>
          <div><span className="text-gray-500">连续学习：</span>{profile.behavior.streakDays} 天</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="font-semibold text-gray-800 mb-2">学习目标</h2>
        <div className="flex flex-wrap gap-2">
          {profile.goals.map((g, i) => (
            <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm">{g}</span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="font-semibold text-green-700 mb-2">已掌握</h2>
        {profile.knownTopics.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无数据，完成训练后将更新</p>
        ) : (
          <ul className="space-y-1">
            {profile.knownTopics.map((t, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-green-600">●</span>
                <span>{t.topic}</span>
                <span className="text-gray-400">({(t.confidence * 100).toFixed(0)}%)</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="font-semibold text-red-700 mb-2">薄弱点</h2>
        {profile.weakTopics.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无数据</p>
        ) : (
          <ul className="space-y-1">
            {profile.weakTopics.map((t, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-red-600">●</span>
                <span>{t.topic}</span>
                <span className="text-gray-400">({(t.confidence * 100).toFixed(0)}%)</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="font-semibold text-gray-800 mb-2">主题掌握度</h2>
        {Object.keys(profile.topicScores).length === 0 ? (
          <p className="text-gray-400 text-sm">暂无数据，完成训练后将更新</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(profile.topicScores).map(([topic, score]) => (
              <div key={topic} className="flex items-center gap-2">
                <span className="text-sm text-gray-700 w-40 truncate">{topic}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-10 text-right">{score}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {profile.nextRecommendedTopic && (
        <div className="bg-indigo-50 rounded-lg p-4">
          <h2 className="font-semibold text-indigo-700 mb-1">推荐下一步</h2>
          <p className="text-gray-700">{profile.nextRecommendedTopic}</p>
        </div>
      )}
    </div>
  );
}
