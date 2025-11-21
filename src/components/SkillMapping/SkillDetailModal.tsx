import { X, Star, Mail, User, Hash, Trophy, ArrowLeft } from 'lucide-react';

interface EmployeeSkillData {
  name: string;
  employee_id: string;
  email: string;
  rating: number;
  categoryAvgRating?: number;
}

interface SkillDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  employees: EmployeeSkillData[];
  sectionTitle: string;
  sectionColor: string;
  showTop5Only?: boolean;
  onShowMore?: () => void;
  onBack?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'No Knowledge',
  2: 'Novice',
  3: 'Proficient',
  4: 'Expert',
  5: 'Advanced'
};

export default function SkillDetailModal({
  isOpen,
  onClose,
  skillName,
  employees,
  sectionTitle,
  sectionColor,
  showTop5Only = true,
  onShowMore,
  onBack
}: SkillDetailModalProps) {
  if (!isOpen) return null;

  const sortedEmployees = [...employees].sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return (b.categoryAvgRating || 0) - (a.categoryAvgRating || 0);
  });

  const displayEmployees = showTop5Only ? sortedEmployees.slice(0, 5) : sortedEmployees;
  const hasMore = sortedEmployees.length > 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 md:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] overflow-hidden transform scale-100 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-r ${sectionColor} p-4 md:p-6 relative`}>
          <div className="flex items-center gap-2 md:gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Back to skills"
              >
                <ArrowLeft size={20} className="text-white md:w-6 md:h-6" />
              </button>
            )}
            <div className="flex-1 pr-10 md:pr-12">
              <p className="text-xs md:text-sm font-semibold text-white/90 mb-1">{sectionTitle}</p>
              <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{skillName}</h2>
              <p className="text-xs md:text-sm text-white/80 font-medium">
                {sortedEmployees.length} {sortedEmployees.length === 1 ? 'employee' : 'employees'} • Sorted by highest rating
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 md:top-4 right-3 md:right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Close"
            >
              <X size={20} className="text-white md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        <div className="p-3 md:p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {displayEmployees.length === 0 ? (
            <div className="text-center py-8 md:py-12 text-gray-500">
              <p className="text-base md:text-lg">No employees found for this skill</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {displayEmployees.map((emp, index) => (
                <div
                  key={`${emp.employee_id}-${index}`}
                  className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 border-2 border-gray-200 rounded-xl p-3 md:p-5 hover:shadow-xl hover:border-indigo-400 transition-all duration-200 relative"
                >
                  {index < 3 && (
                    <div className="absolute -top-2 -left-2 md:-top-3 md:-left-3 bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-xs px-2 md:px-3 py-1 rounded-full shadow-lg">
                      #{index + 1}
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                    <div className="flex-1 space-y-1.5 md:space-y-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-indigo-600 md:w-[18px] md:h-[18px]" />
                        <span className="font-bold text-base md:text-lg text-gray-800">{emp.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                        <Hash size={14} className="text-gray-400 md:w-4 md:h-4" />
                        <span className="font-medium">{emp.employee_id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                        <Mail size={14} className="text-gray-400 md:w-4 md:h-4" />
                        <a
                          href={`mailto:${emp.email}`}
                          className="hover:text-indigo-600 transition-colors hover:underline break-all"
                        >
                          {emp.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2 md:min-w-[200px]">
                      <div className="flex gap-0.5 md:gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={18}
                            className="md:w-[22px] md:h-[22px]"
                            fill={star <= emp.rating ? '#FBBF24' : 'none'}
                            stroke={star <= emp.rating ? '#FBBF24' : '#D1D5DB'}
                          />
                        ))}
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-1">
                        <span className="text-xs md:text-sm font-bold text-indigo-700 bg-indigo-100 px-2 md:px-3 py-1 rounded-full">
                          {RATING_LABELS[emp.rating] || 'Not Rated'}
                        </span>
                        {emp.categoryAvgRating && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Trophy size={12} />
                            Category Avg: {emp.categoryAvgRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showTop5Only && hasMore && onShowMore && (
            <div className="mt-4 md:mt-6 text-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowMore();
                }}
                className="w-full md:w-auto px-6 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm md:text-base font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Show All {sortedEmployees.length} Employees
              </button>
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
