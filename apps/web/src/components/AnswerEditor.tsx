import { useState, useCallback } from 'react';
import type { Question, AnswerItem } from '../lib/types';
import QuestionCard from './QuestionCard';

interface AnswerEditorProps {
  questions: Question[];
  initialAnswers?: AnswerItem[];
  onSaveDraft: (answers: AnswerItem[]) => void;
  onSubmit: (answers: AnswerItem[]) => void;
  grading?: {
    questionFeedback: any[];
  } | null;
  disabled?: boolean;
}

export default function AnswerEditor({ questions, initialAnswers, onSaveDraft, onSubmit, grading, disabled }: AnswerEditorProps) {
  const [answers, setAnswers] = useState<AnswerItem[]>(initialAnswers || []);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = useCallback((questionId: string, value: string | string[] | boolean) => {
    setAnswers((prev) => {
      const idx = prev.findIndex((a) => a.questionId === questionId);
      const newAnswers = [...prev];
      if (idx >= 0) {
        newAnswers[idx] = { ...newAnswers[idx], value };
      } else {
        newAnswers.push({ questionId, value });
      }
      return newAnswers;
    });
  }, []);

  const handleSaveDraft = useCallback(() => {
    onSaveDraft(answers);
  }, [answers, onSaveDraft]);

  const handleSubmit = useCallback(() => {
    setShowConfirm(false);
    onSubmit(answers);
  }, [answers, onSubmit]);

  const getFeedback = (questionId: string) => {
    if (!grading) return undefined;
    return grading.questionFeedback.find((f: any) => f.questionId === questionId);
  };

  return (
    <div>
      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          answer={answers.find((a) => a.questionId === q.id)}
          onChange={handleChange}
          disabled={disabled}
          feedback={getFeedback(q.id)}
        />
      ))}

      {!disabled && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            保存草稿
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            提交答案
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="font-semibold text-lg mb-2">确认提交？</h3>
            <p className="text-gray-600 mb-4">提交后将无法修改答案，系统将进行批改。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
