import type { GradingResult } from '../lib/types';

export default function GradingPanel({ grading }: { grading: GradingResult }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">批改结果</h2>

      <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          {grading.score !== undefined && (
            <span className="text-2xl font-bold text-indigo-700">{grading.score}分</span>
          )}
          <span className="text-sm text-indigo-600">总体评价</span>
        </div>
        <p className="text-gray-700">{grading.overall}</p>
      </div>

      {grading.strengths.length > 0 && (
        <div className="mb-3">
          <h3 className="font-semibold text-green-700 mb-1">强项</h3>
          <ul className="list-disc list-inside text-gray-700 text-sm">
            {grading.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {grading.weaknesses.length > 0 && (
        <div className="mb-3">
          <h3 className="font-semibold text-red-700 mb-1">薄弱点</h3>
          <ul className="list-disc list-inside text-gray-700 text-sm">
            {grading.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {grading.interviewReadyNotes.length > 0 && (
        <div className="mb-3">
          <h3 className="font-semibold text-blue-700 mb-1">面试可用话术</h3>
          <ul className="list-disc list-inside text-gray-700 text-sm">
            {grading.interviewReadyNotes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {grading.improvedExpressions.length > 0 && (
        <div className="mb-3">
          <h3 className="font-semibold text-yellow-700 mb-1">改进建议</h3>
          <ul className="list-disc list-inside text-gray-700 text-sm">
            {grading.improvedExpressions.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {grading.followUpQuestions.length > 0 && (
        <div className="mb-3">
          <h3 className="font-semibold text-purple-700 mb-1">延伸思考</h3>
          <ul className="list-disc list-inside text-gray-700 text-sm">
            {grading.followUpQuestions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">明日推荐主题：</span>
        <span className="font-medium text-gray-800">{grading.nextRecommendedTopic}</span>
      </div>
    </div>
  );
}
