import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Lesson, UserAnswer, GradingResult, AnswerItem } from '../lib/types';
import { formatDate } from '../lib/date';
import LessonSectionComponent from '../components/LessonSection';
import AnswerEditor from '../components/AnswerEditor';
import GradingPanel from '../components/GradingPanel';
import EmptyState from '../components/EmptyState';

type PageState = 'loading' | 'empty' | 'generating' | 'ready' | 'submitting' | 'graded' | 'error';

export default function TodayPage() {
  const [state, setState] = useState<PageState>('loading');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [answer, setAnswer] = useState<UserAnswer | null>(null);
  const [grading, setGrading] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string>('');

  const loadToday = useCallback(async () => {
    try {
      setState('loading');
      const data = await api.getToday();
      setLesson(data.lesson);
      setAnswer(data.answer);
      setGrading(data.grading);
      if (!data.lesson) {
        setState('empty');
      } else if (data.grading) {
        setState('graded');
      } else {
        setState('ready');
      }
    } catch (err: any) {
      setError(err.message);
      setState('error');
    }
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);

  const handleGenerate = useCallback(async () => {
    try {
      setState('generating');
      const data = await api.generateLesson();
      setLesson(data.lesson);
      setAnswer(data.answer);
      setGrading(data.grading);
      setState('ready');
    } catch (err: any) {
      setError(err.message);
      setState('error');
    }
  }, []);

  const handleSaveDraft = useCallback(async (answers: AnswerItem[]) => {
    if (!lesson) return;
    try {
      const saved = await api.saveDraft(lesson.id, answers, 'draft');
      setAnswer(saved);
    } catch (err: any) {
      console.error('Save draft failed:', err);
    }
  }, [lesson]);

  const handleSubmit = useCallback(async (answers: AnswerItem[]) => {
    if (!lesson) return;
    try {
      setState('submitting');
      const result = await api.submitAnswers(lesson.id, answers);
      setAnswer(result.answer);
      setGrading(result.grading);
      setState('graded');
    } catch (err: any) {
      setError(err.message);
      setState('error');
    }
  }, [lesson]);

  if (state === 'loading') {
    return <div className="text-center py-16 text-gray-500">加载中...</div>;
  }

  if (state === 'error') {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadToday} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">重试</button>
      </div>
    );
  }

  if (state === 'empty') {
    return <EmptyState message="今日训练尚未生成" action={{ label: '生成今日训练', onClick: handleGenerate }} />;
  }

  if (state === 'generating') {
    return <div className="text-center py-16 text-gray-500">正在生成今日训练...</div>;
  }

  if (!lesson) return null;

  const categoryLabels: Record<string, string> = {
    agent: 'AI Agent',
    engineering: '软件架构',
    product: '产品能力',
    mixed: '综合',
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {categoryLabels[lesson.category] || lesson.category}
          </span>
          <span className="text-sm text-gray-500">{formatDate(lesson.date)}</span>
          {state === 'submitting' && (
            <span className="text-xs text-yellow-600 animate-pulse">批改中...</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
        <p className="text-gray-600 mt-1">{lesson.reason}</p>
        {lesson.estimatedMinutes && (
          <p className="text-sm text-gray-400 mt-1">预计 {lesson.estimatedMinutes} 分钟</p>
        )}
      </div>

      {lesson.objectives.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">学习目标</h3>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {lesson.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
          </ul>
        </div>
      )}

      {lesson.sections.map((sec) => (
        <LessonSectionComponent key={sec.id} section={sec} />
      ))}

      <div className="mt-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">练习题</h2>
        <p className="text-sm text-gray-500 mb-4">请先独立作答，提交后系统将进行批改。</p>
        <AnswerEditor
          questions={lesson.questions}
          initialAnswers={answer?.answers}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          grading={grading}
          disabled={state === 'graded' || state === 'submitting'}
        />
      </div>

      {grading && <GradingPanel grading={grading} />}
    </div>
  );
}
