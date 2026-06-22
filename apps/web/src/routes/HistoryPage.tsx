import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Lesson, LessonCategory } from '../lib/types';
import { formatDate } from '../lib/date';

const categoryLabels: Record<string, string> = {
  agent: 'AI Agent',
  engineering: '软件架构',
  product: '产品能力',
  mixed: '综合',
};

const categoryColors: Record<string, string> = {
  agent: 'bg-blue-50 text-blue-700',
  engineering: 'bg-green-50 text-green-700',
  product: 'bg-purple-50 text-purple-700',
  mixed: 'bg-gray-50 text-gray-700',
};

export default function HistoryPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LessonCategory | ''>('');

  useEffect(() => {
    setLoading(true);
    api.getHistory(filter || undefined, 30).then((data) => {
      setLessons(data.items);
    }).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">历史记录</h1>

      <div className="flex gap-2 mb-4">
        {['', 'agent', 'engineering', 'product', 'mixed'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as LessonCategory | '')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat ? categoryLabels[cat] : '全部'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">加载中...</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-16 text-gray-500">暂无历史记录</div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[lesson.category]}`}>
                  {categoryLabels[lesson.category]}
                </span>
                <span className="text-xs text-gray-400">{formatDate(lesson.date)}</span>
              </div>
              <h3 className="font-medium text-gray-800">{lesson.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{lesson.reason}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{lesson.questions.length} 道题</span>
                <span>约 {lesson.estimatedMinutes} 分钟</span>
                <span className={`${
                  lesson.status === 'graded' ? 'text-green-600' :
                  lesson.status === 'submitted' ? 'text-yellow-600' :
                  lesson.status === 'draft' ? 'text-blue-600' :
                  'text-gray-400'
                }`}>
                  {lesson.status === 'graded' ? '已批改' :
                   lesson.status === 'submitted' ? '已提交' :
                   lesson.status === 'draft' ? '草稿' :
                   '未作答'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
