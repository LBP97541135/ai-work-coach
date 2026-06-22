import type { Question, AnswerItem } from '../lib/types';

const typeLabels: Record<string, string> = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  judge: '判断题',
  short_answer: '简答题',
  scenario: '场景题',
  architecture: '架构题',
  product: '产品题',
  open: '发散题',
};

const difficultyColors: Record<string, string> = {
  basic: 'text-green-600 bg-green-50',
  intermediate: 'text-yellow-600 bg-yellow-50',
  advanced: 'text-red-600 bg-red-50',
};

const difficultyLabels: Record<string, string> = {
  basic: '基础',
  intermediate: '进阶',
  advanced: '高级',
};

interface QuestionCardProps {
  question: Question;
  answer?: AnswerItem;
  onChange: (questionId: string, value: string | string[] | boolean) => void;
  disabled?: boolean;
  feedback?: {
    verdict: string;
    feedback: string;
    improvedAnswer?: string;
  };
}

export default function QuestionCard({ question, answer, onChange, disabled, feedback }: QuestionCardProps) {
  const currentValue = answer?.value;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
          {typeLabels[question.type] || question.type}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColors[question.difficulty]}`}>
          {difficultyLabels[question.difficulty]}
        </span>
      </div>
      <p className="text-gray-800 font-medium mb-3">{question.prompt}</p>

      {question.type === 'single_choice' && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt.id}
                checked={currentValue === opt.id}
                onChange={() => onChange(question.id, opt.id)}
                disabled={disabled}
                className="accent-indigo-600"
              />
              <span className="text-gray-700">{opt.text}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const selected = Array.isArray(currentValue) && currentValue.includes(opt.id);
            return (
              <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.id}
                  checked={selected}
                  onChange={() => {
                    const current = Array.isArray(currentValue) ? [...currentValue] : [];
                    const idx = current.indexOf(opt.id);
                    if (idx >= 0) current.splice(idx, 1);
                    else current.push(opt.id);
                    onChange(question.id, current);
                  }}
                  disabled={disabled}
                  className="accent-indigo-600"
                />
                <span className="text-gray-700">{opt.text}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'judge' && (
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`q-${question.id}`}
              value="true"
              checked={currentValue === true || currentValue === 'true'}
              onChange={() => onChange(question.id, true)}
              disabled={disabled}
              className="accent-indigo-600"
            />
            <span className="text-gray-700">正确</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`q-${question.id}`}
              value="false"
              checked={currentValue === false || currentValue === 'false'}
              onChange={() => onChange(question.id, false)}
              disabled={disabled}
              className="accent-indigo-600"
            />
            <span className="text-gray-700">错误</span>
          </label>
        </div>
      )}

      {(question.type === 'short_answer' || question.type === 'scenario' || question.type === 'architecture' || question.type === 'product' || question.type === 'open') && (
        <div>
          <textarea
            className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[100px]"
            placeholder={question.expectedAnswerShape || '请输入你的答案...'}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      {feedback && (
        <div className={`mt-3 p-3 rounded-md text-sm ${
          feedback.verdict === 'correct' ? 'bg-green-50 border border-green-200' :
          feedback.verdict === 'partially_correct' ? 'bg-yellow-50 border border-yellow-200' :
          feedback.verdict === 'incorrect' ? 'bg-red-50 border border-red-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <p className="font-medium mb-1">
            {feedback.verdict === 'correct' ? '✓ 正确' :
             feedback.verdict === 'partially_correct' ? '△ 部分正确' :
             feedback.verdict === 'incorrect' ? '✗ 需要修正' :
             '○ 开放题'}
          </p>
          <p className="text-gray-700">{feedback.feedback}</p>
          {feedback.improvedAnswer && (
            <p className="mt-2 text-gray-600">
              <span className="font-medium">参考答案：</span>{feedback.improvedAnswer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
