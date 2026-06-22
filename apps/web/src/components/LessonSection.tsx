import type { LessonSection as LessonSectionType } from '../lib/types';

const kindLabels: Record<string, string> = {
  core: '核心知识',
  scenario: '真实场景',
  pitfall: '常见误区',
  workflow: '工作流程',
  summary: '总结',
};

const kindColors: Record<string, string> = {
  core: 'bg-blue-50 border-blue-200',
  scenario: 'bg-green-50 border-green-200',
  pitfall: 'bg-red-50 border-red-200',
  workflow: 'bg-purple-50 border-purple-200',
  summary: 'bg-gray-50 border-gray-200',
};

export default function LessonSection({ section }: { section: LessonSectionType }) {
  return (
    <div className={`rounded-lg border p-4 mb-4 ${kindColors[section.kind] || 'bg-gray-50 border-gray-200'}`}>
      <h3 className="font-semibold text-gray-800 mb-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border mr-2">
          {kindLabels[section.kind] || section.kind}
        </span>
        {section.title}
      </h3>
      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
        {section.markdown}
      </div>
    </div>
  );
}
