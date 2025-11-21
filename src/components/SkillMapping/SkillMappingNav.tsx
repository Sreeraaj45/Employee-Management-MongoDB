import { Users, BarChart3 } from 'lucide-react';

interface SkillMappingNavProps {
  activeTab: 'responses' | 'analytics';
  onTabChange: (tab: 'responses' | 'analytics') => void;
}

export default function SkillMappingNav({ activeTab, onTabChange }: SkillMappingNavProps) {
  return (
    <div className="sticky top-0 z-30 backdrop-blur-md bg-transparent">
      <div className="flex items-center gap-1 p-2">
        <button
          onClick={() => onTabChange('responses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'responses'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-200/40'
          }`}
        >
          <Users size={18} />
          <span>Responses</span>
        </button>

        <button
          onClick={() => onTabChange('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-200/40'
          }`}
        >
          <BarChart3 size={18} />
          <span>Analytics</span>
        </button>
      </div>
    </div>
  );
}
