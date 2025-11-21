import { X, Users } from 'lucide-react';

interface SkillInfo {
  skill: string;
  totalCount: number;
}

interface SkillsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionColor: string;
  sectionIcon: React.ComponentType<{ size?: number; className?: string }>;
  skills: SkillInfo[];
  onSkillClick: (skillName: string) => void;
}

export default function SkillsListModal({
  isOpen,
  onClose,
  sectionTitle,
  sectionColor,
  sectionIcon: Icon,
  skills,
  onSkillClick
}: SkillsListModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 md:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] md:max-h-[85vh] overflow-hidden transform scale-100 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${sectionColor} p-4 md:p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute top-3 md:top-4 right-3 md:right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X size={20} className="text-white md:w-6 md:h-6" />
          </button>
          <div className="flex items-center gap-2 md:gap-3 pr-10 md:pr-12">
            <div className="p-2 md:p-3 rounded-lg bg-white/30">
              <Icon size={24} className="text-white md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-bold text-white">{sectionTitle}</h2>
              <p className="text-xs md:text-sm text-white/90 mt-1 font-medium">
                {skills.length} {skills.length === 1 ? 'skill' : 'skills'} available
              </p>
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="p-3 md:p-6 overflow-y-auto max-h-[calc(95vh-120px)] md:max-h-[calc(85vh-140px)]">
          {skills.length === 0 ? (
            <div className="text-center py-8 md:py-12 text-gray-500">
              <p className="text-base md:text-lg">No skills found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {skills.map((skillInfo) => (
                <button
                  key={skillInfo.skill}
                  onClick={() => {
                    onSkillClick(skillInfo.skill);
                  }}
                  className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-2 border-gray-200 rounded-xl p-4 md:p-5 hover:shadow-xl hover:border-indigo-400 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start md:items-center justify-between gap-2">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors flex-1">
                      {skillInfo.skill}
                    </h3>
                    <div className="flex items-center gap-1.5 md:gap-2 bg-indigo-100 px-2 md:px-3 py-1 rounded-full flex-shrink-0">
                      <Users size={14} className="text-indigo-600 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm font-bold text-indigo-700">{skillInfo.totalCount}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Click to view top employees</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
