import { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, User, Mail, Hash, FileText, Star, TrendingUp, TrendingDown, Minus,
  Code2, BarChart3, Brain, Database, Cpu, Layout, Server, Settings, Car,
  ChevronDown, ChevronUp, CheckCircle, Eye, Edit, Printer
} from 'lucide-react';
import { skillMappingApi } from '../../lib/api/skillMappingApi';
import SkillRadar from './SkillRadar';
import { printReview } from './PrintReview';
import { captureCanvasAsImage } from '../../lib/captureCanvas';

interface EmployeeResponse {
  _id?: string;
  name: string;
  employee_id: string;
  email: string;
  selected_skills: string[];
  skill_ratings: Array<{ skill: string; rating: number }>;
  additional_skills: string;
  timestamp?: string;
  manager_ratings?: Array<{ skill: string; rating: number }>;
  company_expectations?: Array<{ skill: string; expectation: number }>;
  rating_gaps?: Array<{ skill: string; gap: number }>;
  overall_manager_review?: string;
  manager_review_timestamp?: string;
}

interface SkillReview {
  skill: string;
  section: string;
  expectation: number;
  selfRating: number;
  managerRating: number;
  gap: number;
}

interface EmployeeReviewProps {
  employeeId: string;
  onBack: () => void;
  onSaveSuccess?: (employeeId: string) => void;
}

const RATING_LABELS: Record<number, string> = {
  0: 'Not rated', 1: 'No Knowledge', 2: 'Novice', 3: 'Proficient', 4: 'Expert', 5: 'Advanced'
};

const SKILL_EXPECTATIONS: Record<string, number> = {
  Python: 4, 'C++': 5, Java: 5, Rust: 3, JavaScript: 3, C: 4, PySpark: 4, SQL: 2, NoSQL: 4,
  'Power BI / Tableau': 3, 'Visualization Libraries': 3, 'Data Modelling (ML Algorithms)': 4,
  'Statistics (Fundamental statistical concepts)': 3, 'Dashboards (Power BI, Grafana)': 3,
  AWS: 3, GCP: 3, Azure: 3, 'Apache Airflow': 3, Kubernetes: 3, Docker: 3, flyte: 2,
  TensorFlow: 4, PyTorch: 4, OpenCV: 3, 'Computer Vision Models': 4, 'Generative AI (GenAI)': 3,
  HTML: 3, CSS: 3, Bootstrap: 3, React: 4, Angular: 2, 'Tailwind CSS': 3, 'Vue.js': 2, TypeScript: 3,
  Django: 3, Flask: 3, FastAPI: 3, 'Spring Boot': 3, 'ASP.NET': 2, 'Express.js': 3,
  Jenkins: 3, 'CI/CD': 3, 'Camera calibration/processing': 4, 'LiDAR (3D)': 4, 'Sensor fusion': 4
};

const SKILL_SECTIONS = {
  programming: { title: 'Programming Skills', icon: Code2, color: 'from-sky-400 to-emerald-400',
    skills: ['Python', 'C++', 'Java', 'Rust', 'JavaScript', 'C', 'PySpark', 'SQL', 'NoSQL'] },
  dataAnalytics: { title: 'Data Analytics', icon: BarChart3, color: 'from-amber-400 to-pink-400',
    skills: ['Power BI / Tableau', 'Visualization Libraries'] },
  dataScience: { title: 'Data Science', icon: Brain, color: 'from-indigo-400 to-purple-400',
    skills: ['Data Modelling (ML Algorithms)', 'Statistics (Fundamental statistical concepts)', 'Dashboards (Power BI, Grafana)'] },
  dataEngineering: { title: 'Data Engineering', icon: Database, color: 'from-orange-400 to-yellow-400',
    skills: ['AWS', 'GCP', 'Azure', 'Apache Airflow', 'Kubernetes', 'Docker', 'flyte'] },
  aiDL: { title: 'AI / Deep Learning', icon: Cpu, color: 'from-fuchsia-400 to-rose-400',
    skills: ['TensorFlow', 'PyTorch', 'OpenCV', 'Computer Vision Models', 'Generative AI (GenAI)'] },
  frontend: { title: 'Frontend Development', icon: Layout, color: 'from-cyan-400 to-blue-400',
    skills: ['HTML', 'CSS', 'Bootstrap', 'React', 'Angular', 'Tailwind CSS', 'Vue.js', 'TypeScript'] },
  backend: { title: 'Backend Development', icon: Server, color: 'from-teal-400 to-green-400',
    skills: ['Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Express.js'] },
  devops: { title: 'DevOps', icon: Settings, color: 'from-slate-500 to-indigo-500', skills: ['Jenkins', 'CI/CD'] },
  ADAS: { title: 'ADAS', icon: Car, color: 'from-rose-500 to-orange-500',
    skills: ['Camera calibration/processing', 'LiDAR (3D)', 'Sensor fusion'] }
} as const;

const SECTION_SHORT_LABELS: Record<string, string> = {
  programming: 'Programming', dataAnalytics: 'Analytics', dataScience: 'Science',
  dataEngineering: 'Engineering', aiDL: 'AI', frontend: 'Frontend', backend: 'Backend',
  devops: 'DevOps', ADAS: 'ADAS', other: 'Other'
};

export default function EmployeeReview({ employeeId, onBack, onSaveSuccess }: EmployeeReviewProps) {
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [skillReviews, setSkillReviews] = useState<SkillReview[]>([]);
  const [overallManagerReview, setOverallManagerReview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [sectionKeys, setSectionKeys] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showNavigator, setShowNavigator] = useState(false);
  const [selectedRadarSection, setSelectedRadarSection] = useState<string | null>(null);

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      const data = await skillMappingApi.getResponses();
      const employeeData = data.find((r: EmployeeResponse) => r._id === employeeId);
      if (employeeData) {
        setEmployee(employeeData);
        const hasManagerReview = !!(employeeData.manager_ratings && employeeData.manager_ratings.length > 0);
        setReviewCompleted(hasManagerReview);
        const selectedSet = new Set<string>(employeeData.selected_skills || []);
        (employeeData.skill_ratings || []).forEach((sr: { skill: string; rating: number }) => selectedSet.add(sr.skill));
        const reviews: SkillReview[] = [];
        for (const [key, section] of Object.entries(SKILL_SECTIONS)) {
          for (const skill of section.skills) {
            if (selectedSet.has(skill)) {
              const rated = (employeeData.skill_ratings || []).find((s: { skill: string; rating: number }) => s.skill === skill);
              const selfRating = rated ? rated.rating : 0;
              let expectation = SKILL_EXPECTATIONS[skill] ?? (selfRating || 0);
              if (employeeData.company_expectations) {
                const dbExpectation = employeeData.company_expectations.find((e: { skill: string; expectation: number }) => e.skill === skill);
                if (dbExpectation) expectation = dbExpectation.expectation;
              }
              let managerRating = 0;
              if (hasManagerReview) {
                const managerRated = employeeData.manager_ratings!.find((m: { skill: string; rating: number }) => m.skill === skill);
                if (managerRated) managerRating = managerRated.rating;
              }
              const gap = managerRating > 0 ? managerRating - selfRating : 0;
              reviews.push({ skill, section: key, expectation, selfRating, managerRating, gap });
            }
          }
        }
        for (const s of selectedSet) {
          const inSections = Object.values(SKILL_SECTIONS).some(sec => (sec.skills as readonly string[]).includes(s));
          if (!inSections) {
            const rated = (employeeData.skill_ratings || []).find((r: { skill: string; rating: number }) => r.skill === s);
            const selfRating = rated ? rated.rating : 0;
            let expectation = SKILL_EXPECTATIONS[s] ?? (selfRating || 0);
            if (employeeData.company_expectations) {
              const dbExpectation = employeeData.company_expectations.find((e: { skill: string; expectation: number }) => e.skill === s);
              if (dbExpectation) expectation = dbExpectation.expectation;
            }
            let managerRating = 0;
            if (hasManagerReview) {
              const managerRated = employeeData.manager_ratings!.find((m: { skill: string; rating: number }) => m.skill === s);
              if (managerRated) managerRating = managerRated.rating;
            }
            const gap = managerRating > 0 ? managerRating - selfRating : 0;
            reviews.push({ skill: s, section: 'other', expectation, selfRating, managerRating, gap });
          }
        }
        setSkillReviews(reviews);
        if (employeeData.overall_manager_review) setOverallManagerReview(employeeData.overall_manager_review);
        const keysWithSkills = Object.entries(SKILL_SECTIONS).filter(([k]) => reviews.some(r => r.section === k)).map(([k]) => k);
        if (reviews.some(r => r.section === 'other')) keysWithSkills.push('other');
        setSectionKeys(keysWithSkills);
        setCurrentStep(hasManagerReview ? keysWithSkills.length : 0);
      }
    } catch (err) {
      console.error('Error loading employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManagerRatingChange = (globalIndex: number, rating: number) => {
    setSkillReviews(prev => {
      const updated = [...prev];
      if (globalIndex < 0 || globalIndex >= updated.length) return prev;
      updated[globalIndex] = { ...updated[globalIndex], managerRating: rating, gap: rating - updated[globalIndex].selfRating };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const managerRatings = skillReviews.filter(sr => sr.managerRating > 0).map(sr => ({ skill: sr.skill, rating: sr.managerRating }));
      const companyExpectations = skillReviews.map(sr => ({ skill: sr.skill, expectation: sr.expectation }));
      const ratingGaps = skillReviews.filter(sr => sr.managerRating > 0).map(sr => ({ skill: sr.skill, gap: sr.gap }));
      await skillMappingApi.saveManagerReview(employeeId, { managerRatings, companyExpectations, ratingGaps, overallManagerReview });
      setReviewCompleted(true);
      setSaveMessage({ type: 'success', text: 'Manager review saved successfully!' });
      if (onSaveSuccess) onSaveSuccess(employeeId);
    } catch (err) {
      console.error('Error saving reviews:', err);
      let errorMessage = 'Failed to save manager review. Please try again.';
      if (err instanceof Error) {
        const errMsg = err.message.toLowerCase();
        if (errMsg.includes('rating') && errMsg.includes('between')) errorMessage = 'Invalid rating value. Ratings must be between 1 and 5.';
        else if (errMsg.includes('gap')) errorMessage = 'Invalid gap value detected. Please check your ratings.';
        else if (errMsg.includes('expectation')) errorMessage = 'Invalid expectation value. Expectations must be between 1 and 5.';
        else if (errMsg.includes('not found') || errMsg.includes('404')) errorMessage = 'Employee response not found. Please refresh and try again.';
        else if (errMsg.includes('network') || errMsg.includes('fetch')) errorMessage = 'Unable to save review. Please check your connection.';
        else if (err.message) errorMessage = err.message;
      }
      setSaveMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const getGapColor = (gap: number) => {
    if (gap > 0) return 'text-green-700 bg-green-50';
    if (gap < 0) return 'text-red-700 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getGapIcon = (gap: number) => {
    if (gap > 0) return <TrendingUp size={16} />;
    if (gap < 0) return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };

  const skillsBySection = [
    ...Object.entries(SKILL_SECTIONS).map(([key, section]) => ({
      key, title: section.title, icon: section.icon, color: section.color,
      skills: skillReviews.filter(sr => sr.section === key)
    })).filter(s => s.skills.length > 0),
    ...(skillReviews.some(sr => sr.section === 'other') ? [{
      key: 'other', title: 'Other / Misc', icon: FileText, color: 'from-slate-300 to-slate-500',
      skills: skillReviews.filter(sr => sr.section === 'other')
    }] : [])
  ];

  const totalSteps = sectionKeys.length + 1;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Employee not found</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Go Back</button>
        </div>
      </div>
    );
  }

  const isReviewStep = currentStep === sectionKeys.length;
  const activeSectionKey = sectionKeys[currentStep];
  const activeSection = skillsBySection.find(s => s.key === activeSectionKey);
  const progressGradient = !isReviewStep && activeSection ? activeSection.color : 'from-indigo-500 to-purple-500';
  const nextBtnGradient = !isReviewStep && activeSection ? activeSection.color : 'from-indigo-600 to-purple-600';
  const totalAssessed = skillReviews.length;
  const managerCompleted = skillReviews.filter(r => r.managerRating > 0).length;
  const overallStatus = overallManagerReview.trim() !== '' ? 'Complete' : 'Pending';

  if (reviewCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
            <div className="mb-3">
              <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft size={18} /><span className="font-medium">Back to Responses</span>
              </button>
            </div>
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-green-800">Review Completed</h3>
                    <p className="text-green-700">Manager review has been submitted for {employee.name}.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={async () => {
                    const radarImage = await captureCanvasAsImage('canvas');
                    await printReview({ employee: { name: employee.name, employee_id: employee.employee_id, email: employee.email, additional_skills: employee.additional_skills },
                      skillReviews, overallManagerReview, radarChartImage: radarImage || undefined });
                  }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">
                    <Printer size={16} />Print
                  </button>
                  <button onClick={() => setReviewCompleted(false)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                    <Edit size={16} />Edit Review
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-2">
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
                <Eye className="text-indigo-600" />Review - {employee.name}
              </h2>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Skill</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Expectation from Company</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Self</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Manager</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Gap (Mgr - Self)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {skillReviews.map((r) => (
                      <tr key={r.skill} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-800">{r.skill}</div>
                          <div className="text-xs text-gray-500">{r.section}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={16} fill={star <= r.expectation ? '#10B981' : 'none'} stroke={star <= r.expectation ? '#10B981' : '#D1D5DB'} />
                              ))}
                            </div>
                            <span className="text-xs font-medium text-emerald-700">{RATING_LABELS[r.expectation]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={16} fill={star <= r.selfRating ? '#FBBF24' : 'none'} stroke={star <= r.selfRating ? '#FBBF24' : '#D1D5DB'} />
                              ))}
                            </div>
                            <span className="text-xs font-medium text-gray-700">{RATING_LABELS[r.selfRating]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={16} fill={star <= r.managerRating ? '#3B82F6' : 'none'} stroke={star <= r.managerRating ? '#3B82F6' : '#D1D5DB'} />
                              ))}
                            </div>
                            <span className="text-xs font-medium text-blue-700">{RATING_LABELS[r.managerRating]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center">
                            {r.managerRating > 0 ? (
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm ${getGapColor(r.gap)}`}>
                                {getGapIcon(r.gap)}<span>{r.gap}</span>
                              </div>
                            ) : (<span className="text-xs text-gray-400 italic">Not rated</span>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {overallManagerReview && (
                <div className="bg-white rounded-xl p-2 mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Overall Manager Review</h3>
                  <div className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm bg-gray-50 whitespace-pre-line">{overallManagerReview}</div>
                </div>
              )}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                <div className="mb-6 flex flex-wrap gap-2 justify-center">
                  <button onClick={() => setSelectedRadarSection(null)} className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedRadarSection === null ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}>
                    All Skills
                  </button>
                  {skillsBySection.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button key={section.key} onClick={() => setSelectedRadarSection(section.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedRadarSection === section.key ? `bg-gradient-to-r ${section.color} text-white shadow-md` : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}>
                        <Icon size={16} />{section.title}
                      </button>
                    );
                  })}
                </div>
                <SkillRadar skills={selectedRadarSection === null ? skillReviews.map(s => ({ skill: s.skill, expectation: s.expectation, selfRating: s.selfRating, managerRating: s.managerRating })) : skillReviews.filter(s => s.section === selectedRadarSection).map(s => ({ skill: s.skill, expectation: s.expectation, selfRating: s.selfRating, managerRating: s.managerRating }))}
                  title={selectedRadarSection === null ? 'Complete Skills Overview' : `${skillsBySection.find(s => s.key === selectedRadarSection)?.title} - Skill Radar`} width={800} height={800} />
              </div>
              <div className="flex justify-end items-center">
                <button onClick={onBack} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">Back to Responses</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
          <div className="mb-3">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft size={18} /><span className="font-medium">Back to Responses</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="p-3 bg-blue-100 rounded-full"><User size={22} className="text-blue-600" /></div>
              <div><p className="text-xs text-gray-500 font-medium">Name</p><p className="text-lg font-bold text-gray-800">{employee.name}</p></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="p-3 bg-purple-100 rounded-full"><Hash size={22} className="text-purple-600" /></div>
              <div><p className="text-xs text-gray-500 font-medium">Employee ID</p><p className="text-lg font-bold text-gray-800">{employee.employee_id}</p></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="p-3 bg-green-100 rounded-full"><Mail size={22} className="text-green-600" /></div>
              <div><p className="text-xs text-gray-500 font-medium">Email</p><p className="text-sm md:text-base font-bold text-gray-800 truncate">{employee.email}</p></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white border border-slate-100 shadow-sm">
              <div className="p-3 rounded-lg bg-amber-50"><BarChart3 size={20} className="text-amber-600" /></div>
              <div><p className="text-xs text-gray-600">Total Skills Assessed</p><p className="text-lg font-bold text-amber-700">{totalAssessed}</p></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white border border-slate-100 shadow-sm">
              <div className="p-3 rounded-lg bg-blue-50"><TrendingUp size={20} className="text-blue-600" /></div>
              <div><p className="text-xs text-gray-600">Manager Ratings Completed</p><p className="text-lg font-bold text-blue-700">{managerCompleted}</p></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white border border-slate-100 shadow-sm">
              <div className="p-3 rounded-lg bg-lime-50"><CheckCircle size={20} className="text-lime-600" /></div>
              <div><p className="text-xs text-gray-600">Overall Review Status</p><p className="text-lg font-bold text-lime-700">{overallStatus}</p></div>
            </div>
          </div>
          {employee.additional_skills && (
            <div className="mt-2 p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-amber-600" />
                <p className="text-sm font-bold text-gray-700">Additional Skills / Domain Expertise</p>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{employee.additional_skills}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 md:gap-4 mb-3">
          <button onClick={() => setShowNavigator(v => !v)} aria-expanded={showNavigator} className="p-2 rounded-md hover:bg-slate-100 transition flex items-center gap-2" title="Easy Navigation" aria-label="Toggle easy navigation">
            {showNavigator ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <span className="text-xs md:text-sm font-semibold text-slate-700 min-w-[100px] md:min-w-[120px] text-left">Step {currentStep + 1} / {totalSteps}</span>
          <div className="flex-1 h-2.5 md:h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${progressGradient} transition-[width] duration-500`} style={{ width: `${progress}%` }} />
          </div>
        </div>
        {showNavigator && (
          <div className="mb-4 overflow-x-auto">
            <div className="flex gap-2 items-center flex-wrap">
              {sectionKeys.map((key, i) => {
                const sec = skillsBySection.find(s => s.key === key);
                const isActive = currentStep === i;
                const color = sec?.color ?? 'from-indigo-500 to-purple-500';
                const shortLabel = SECTION_SHORT_LABELS[key] ?? (sec?.title ?? key).split(' ')[0];
                return (
                  <button key={key} onClick={() => setCurrentStep(i)} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all border ${isActive ? `bg-gradient-to-r ${color} text-white border-transparent` : 'bg-white text-gray-700 hover:shadow-sm'}`} aria-current={isActive ? 'step' : undefined} title={`${i + 1}. ${sec?.title ?? key}`}>
                    <span className="font-bold">{i + 1}</span><span className="text-sm">{shortLabel}</span>
                  </button>
                );
              })}
              <button onClick={() => setCurrentStep(sectionKeys.length)} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all border ${isReviewStep ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent' : 'bg-white text-gray-700 hover:shadow-sm'}`} title="Review">
                <span className="font-bold">{sectionKeys.length + 1}</span><span className="text-sm">Review</span>
              </button>
            </div>
          </div>
        )}
        {!isReviewStep && activeSection ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`p-4 md:p-6 bg-gradient-to-r ${activeSection.color}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {(() => { const Icon = activeSection.icon as any; return <Icon className="w-6 h-6 text-white" />; })()}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">{activeSection.title}</h2>
                  <p className="text-sm text-white/90 mt-1">{activeSection.skills.length} {activeSection.skills.length === 1 ? 'skill' : 'skills'} assessed</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/5">Skill Name</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-1/5">Expectation from Company</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-1/5">Self Rating</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-1/5">Manager Rating</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-1/5">Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeSection.skills.map((review) => {
                    const globalIndex = skillReviews.findIndex(sr => sr.skill === review.skill && sr.section === review.section);
                    return (
                      <tr key={review.skill} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4"><span className="font-semibold text-gray-800">{review.skill}</span></td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={16} fill={star <= review.expectation ? '#10B981' : 'none'} stroke={star <= review.expectation ? '#10B981' : '#D1D5DB'} />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-emerald-700">{RATING_LABELS[review.expectation] || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={16} fill={star <= review.selfRating ? '#FBBF24' : 'none'} stroke={star <= review.selfRating ? '#FBBF24' : '#D1D5DB'} />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-gray-700">{RATING_LABELS[review.selfRating]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => handleManagerRatingChange(globalIndex, star)} className="transition-transform hover:scale-110">
                                  <Star size={18} fill={star <= review.managerRating ? '#3B82F6' : 'none'} stroke={star <= review.managerRating ? '#3B82F6' : '#D1D5DB'} className="cursor-pointer" />
                                </button>
                              ))}
                            </div>
                            <span className="text-xs font-bold text-blue-700">{RATING_LABELS[review.managerRating]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            {review.managerRating > 0 ? (
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm ${getGapColor(review.gap)}`}>
                                {getGapIcon(review.gap)}<span>{Math.abs(review.gap)}</span>
                              </div>
                            ) : (<span className="text-xs text-gray-400 italic">Not rated</span>)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-200">
              <SkillRadar skills={activeSection.skills.map(s => ({ skill: s.skill, expectation: s.expectation, selfRating: s.selfRating, managerRating: s.managerRating }))}
                title={`${activeSection.title} - Skill Radar`} width={500} height={500} />
            </div>
            <div className="p-4 md:p-6 flex justify-between items-center">
              <button type="button" onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0} className={`px-5 py-2 rounded-xl font-semibold shadow-md ${currentStep === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-slate-400 to-slate-600 text-white'}`}>
                Previous
              </button>
              <button type="button" onClick={() => setCurrentStep(s => Math.min(totalSteps - 1, s + 1))} className={`px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r ${nextBtnGradient}`}>
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 md:p-8 shadow-lg border border-slate-100">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-slate-800">Review Your Ratings</h2>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Skill</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Expectation from Company</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Self</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Manager</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Gap (Mgr - Self)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {skillReviews.map((r) => (
                    <tr key={r.skill} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-800">{r.skill}</div>
                        <div className="text-xs text-gray-500">{r.section}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={16} fill={star <= r.expectation ? '#10B981' : 'none'} stroke={star <= r.expectation ? '#10B981' : '#D1D5DB'} />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-emerald-700">{RATING_LABELS[r.expectation]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={16} fill={star <= r.selfRating ? '#FBBF24' : 'none'} stroke={star <= r.selfRating ? '#FBBF24' : '#D1D5DB'} />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-gray-700">{RATING_LABELS[r.selfRating]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={16} fill={star <= r.managerRating ? '#3B82F6' : 'none'} stroke={star <= r.managerRating ? '#3B82F6' : '#D1D5DB'} />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-blue-700">{RATING_LABELS[r.managerRating]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          {r.managerRating > 0 ? (
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm ${getGapColor(r.gap)}`}>
                              {getGapIcon(r.gap)}<span>{r.gap}</span>
                            </div>
                          ) : (<span className="text-xs text-gray-400 italic">Not rated</span>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Overall Manager Review</h3>
              <textarea value={overallManagerReview} onChange={(e) => setOverallManagerReview(e.target.value)} placeholder="Provide your overall assessment, feedback, and recommendations for this employee..." className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none" rows={5} />
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
              <div className="mb-6 flex flex-wrap gap-2 justify-center">
                <button onClick={() => setSelectedRadarSection(null)} className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedRadarSection === null ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}>
                  All Skills
                </button>
                {skillsBySection.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button key={section.key} onClick={() => setSelectedRadarSection(section.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedRadarSection === section.key ? `bg-gradient-to-r ${section.color} text-white shadow-md` : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}>
                      <Icon size={16} />{section.title}
                    </button>
                  );
                })}
              </div>
              <SkillRadar skills={selectedRadarSection === null ? skillReviews.map(s => ({ skill: s.skill, expectation: s.expectation, selfRating: s.selfRating, managerRating: s.managerRating })) : skillReviews.filter(s => s.section === selectedRadarSection).map(s => ({ skill: s.skill, expectation: s.expectation, selfRating: s.selfRating, managerRating: s.managerRating }))}
                title={selectedRadarSection === null ? 'Complete Skills Overview' : `${skillsBySection.find(s => s.key === selectedRadarSection)?.title} - Skill Radar`} width={800} height={800} />
            </div>
            {saveMessage && (
              <div className={`mb-4 p-4 rounded-lg ${saveMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{saveMessage.text}</p>
              </div>
            )}
            <div className="flex justify-between items-center gap-4">
              <button type="button" onClick={() => setCurrentStep(s => Math.max(0, s - 1))} className="px-5 py-2 rounded-xl font-semibold shadow-md bg-gradient-to-r from-slate-400 to-slate-600 text-white">
                Previous
              </button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setCurrentStep(0)} className="px-4 py-2 rounded-lg border">Start Over</button>
                <button type="button" onClick={async () => {
                  const radarImage = await captureCanvasAsImage('canvas');
                  await printReview({ employee: { name: employee.name, employee_id: employee.employee_id, email: employee.email, additional_skills: employee.additional_skills },
                    skillReviews, overallManagerReview, radarChartImage: radarImage || undefined });
                }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">
                  <Printer size={16} />Print Preview
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save size={18} /> {saving ? 'Saving...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
