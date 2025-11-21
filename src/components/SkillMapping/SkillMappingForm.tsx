import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Code2,
  BarChart3,
  Brain,
  Database,
  Cpu,
  Layout,
  Server,
  Settings,
  Sparkles,
  Eye,
  Car
} from 'lucide-react';
import { skillMappingApi } from '../../lib/api/skillMappingApi';
import confetti from 'canvas-confetti';
import logo from '../../assets/logo.png';

const SKILL_SECTIONS = {
  programming: {
    title: 'Programming Skills',
    icon: <Code2 className="w-6 h-6" />,
    color: 'from-sky-400 to-emerald-400',
    skills: ['Python', 'C++', 'Java', 'Rust', 'JavaScript', 'C', 'PySpark', 'SQL', 'NoSQL']
  },
  dataAnalytics: {
    title: 'Data Analytics',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-amber-400 to-pink-400',
    skills: ['Power BI / Tableau', 'Visualization Libraries']
  },
  dataScience: {
    title: 'Data Science',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-indigo-400 to-purple-400',
    skills: [
      'Data Modelling (ML Algorithms)',
      'Statistics (Fundamental statistical concepts)',
      'Dashboards (Power BI, Grafana)'
    ]
  },
  dataEngineering: {
    title: 'Data Engineering',
    icon: <Database className="w-6 h-6" />,
    color: 'from-orange-400 to-yellow-400',
    skills: ['AWS', 'GCP', 'Azure', 'Apache Airflow', 'Kubernetes', 'Docker', 'flyte']
  },
  aiDL: {
    title: 'AI / Deep Learning',
    icon: <Cpu className="w-6 h-6" />,
    color: 'from-fuchsia-400 to-rose-400',
    skills: [
      'TensorFlow',
      'PyTorch',
      'OpenCV',
      'Computer Vision Models',
      'Generative AI (GenAI)'
    ]
  },
  frontend: {
    title: 'Frontend Development',
    icon: <Layout className="w-6 h-6" />,
    color: 'from-cyan-400 to-blue-400',
    skills: [
      'HTML',
      'CSS',
      'Bootstrap',
      'React',
      'Angular',
      'Tailwind CSS',
      'Vue.js',
      'TypeScript'
    ]
  },
  backend: {
    title: 'Backend Development',
    icon: <Server className="w-6 h-6" />,
    color: 'from-teal-400 to-green-400',
    skills: ['Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Express.js']
  },
  devops: {
    title: 'DevOps',
    icon: <Settings className="w-6 h-6" />,
    color: 'from-slate-500 to-indigo-500',
    skills: ['Jenkins', 'CI/CD']
  },
  ADAS: {
    title: 'ADAS',
    icon: <Car className="w-6 h-6" />,
    color: 'from-rose-500 to-orange-500',
    skills: ['Camera calibration/processing', 'LiDAR (3D)', 'Sensor fusion']
  }
};

const RATING_LABELS = {
  1: 'No Knowledge',
  2: 'Novice',
  3: 'Proficient',
  4: 'Expert',
  5: 'Advanced'
};

export default function SkillMappingForm() {
  const sectionKeys = Object.keys(SKILL_SECTIONS);
  const totalSteps = sectionKeys.length + 2; // +1 for Additional Skills, +1 for Review
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    skillRatings: [] as { skill: string; rating: number; section: string }[],
    additionalSkills: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchingEmployee, setFetchingEmployee] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Auto-fetch employee data when employee ID is entered
  useEffect(() => {
    const fetchEmployeeData = async () => {
      const empId = formData.employeeId.trim();
      
      // Only fetch if employee ID has content after "IET"
      if (empId && empId.length >= 7) {
        // Remove spaces and dashes to get the actual ID (e.g., "IET - 1234" -> "IET1234")
        const cleanedId = empId.replace(/\s+/g, '').replace(/-/g, '');
        
        // Check if it starts with IET and has numbers
        if (cleanedId.startsWith('IET') && cleanedId.length > 3) {
          setFetchingEmployee(true);
          try {
            // Try to fetch with the cleaned ID (without spaces/dashes)
            const employeeData = await skillMappingApi.getEmployeeByEmployeeId(cleanedId);
            setFormData(prev => ({
              ...prev,
              name: employeeData.name,
              email: employeeData.email
            }));
          } catch (error: any) {
            // Silently fail - employee might not exist yet
            console.log('Employee not found:', error.message);
          } finally {
            setFetchingEmployee(false);
          }
        }
      }
    };

    const debounceTimer = setTimeout(fetchEmployeeData, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.employeeId]);

  const handleRatingChange = (skill: string, section: string, rating: number) => {
    setFormData(prev => {
      const existing = prev.skillRatings.find(
        sr => sr.skill === skill && sr.section === section
      );
      let newRatings;
      if (existing) {
        if (existing.rating === rating) {
          newRatings = prev.skillRatings.filter(
            sr => !(sr.skill === skill && sr.section === section)
          );
        } else {
          newRatings = prev.skillRatings.map(sr =>
            sr.skill === skill && sr.section === section ? { ...sr, rating } : sr
          );
        }
      } else {
        newRatings = [...prev.skillRatings, { skill, section, rating }];
      }
      return { ...prev, skillRatings: newRatings };
    });
  };

  const getRating = (skill: string, section: string) =>
    formData.skillRatings.find(sr => sr.skill === skill && sr.section === section)?.rating || 0;

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.employeeId.trim()) return 'Employee ID is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@ielektron.com')) return 'Please use company email';
    if (formData.skillRatings.length === 0) return 'Please rate at least one skill';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setStatus('error');
      setErrorMessage(validationError);
      setTimeout(() => setStatus(null), 4000);
      return;
    }

    setLoading(true);
    setStatus(null);
    setErrorMessage('');

    try {
      // Clean the employee ID before submission (remove spaces and dashes)
      const cleanedEmployeeId = formData.employeeId.replace(/\s+/g, '').replace(/-/g, '');
      
      await skillMappingApi.createResponse({
        name: formData.name,
        employee_id: cleanedEmployeeId,
        email: formData.email,
        selected_skills: formData.skillRatings.map(sr => sr.skill),
        skill_ratings: formData.skillRatings,
        additional_skills: formData.additionalSkills
      });

      setFormData({
        name: '',
        employeeId: '',
        email: '',
        skillRatings: [],
        additionalSkills: ''
      });
      setCurrentStep(0);
      setStatus('success');
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Redirect to Thank You page after confetti
      setTimeout(() => {
        window.location.href = '/thankyou';
      }, 800);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const StarRating = ({ skill, section }: { skill: string; section: string }) => {
    const rating = getRating(skill, section);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(skill, section, star)}
              className="group transition-transform hover:scale-110"
            >
              <svg
                className={`w-7 h-7 ${
                  star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200'
                }`}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-xs text-slate-600 text-center font-medium">
            {RATING_LABELS[rating as keyof typeof RATING_LABELS]}
          </span>
        )}
      </div>
    );
  };

  const currentSectionKey = sectionKeys[currentStep] || 'additional';
  const currentSection = SKILL_SECTIONS[currentSectionKey as keyof typeof SKILL_SECTIONS];
  const currentColor = currentSection?.color || 'from-sky-400 to-indigo-400';
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 py-6 md:py-12 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute -top-24 -left-20 w-52 h-52 md:w-72 md:h-72 bg-pink-200 opacity-30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-sky-200 opacity-30 rounded-full blur-3xl delay-1000"></div>

      <div className="max-w-5xl mx-auto px-4 md:px-10 relative z-10">
        {/* HEADER */}
        <header className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 rounded-xl shadow-xl p-5 md:p-10 text-white mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex justify-center md:justify-start w-full md:w-auto">
            <img
              src={logo}
              alt="Logo"
              className="w-14 h-14 md:w-20 md:h-20 rounded-full shadow-lg border-2 border-white/60"
            />
          </div>
          <div className="text-center md:flex-1 flex flex-col items-center">
            <h1 className="text-2xl md:text-4xl font-extrabold flex justify-center items-center gap-3">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 animate-spin-slow" />
              Employee Skill Mapping Survey
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 animate-spin-slow" />
            </h1>
            <p className="text-white/80 mt-1 md:mt-2 text-sm md:text-base font-medium">
              Explore and highlight your expertise
            </p>
          </div>
        </header>

        {/* FORM */}
        <form onSubmit={e => e.preventDefault()} className="space-y-6 md:space-y-8">
          {/* PERSONAL INFO */}
          <section className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg p-4 md:p-8 border border-slate-100">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-slate-800">
              Personal Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Employee ID (Ex: IET1234 or IET - 1234)"
                  value={formData.employeeId}
                  required
                  onChange={e => {
                    // Allow flexible input - user can type with or without spaces/dashes
                    let value = e.target.value.toUpperCase();
                    
                    // Remove any existing formatting
                    value = value.replace(/\s+/g, '').replace(/-/g, '');
                    
                    // Ensure it starts with IET
                    if (!value.startsWith('IET')) {
                      value = 'IET' + value.replace(/^IET/i, '');
                    }
                    
                    // Keep only IET and numbers
                    value = value.replace(/[^IET0-9]/g, '');
                    
                    setFormData({ ...formData, employeeId: value });
                  }}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none"
                  maxLength={10}
                />
                {fetchingEmployee && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 border-2 border-sky-400 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                required
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none"
              />
              <input
                type="email"
                placeholder="email.address@ielektron.com"
                value={formData.email}
                required
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none md:col-span-2"
              />
            </div>
          </section>

          {/* PROGRESS */}
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-xs md:text-sm font-semibold text-slate-700 min-w-[70px] md:min-w-[90px] text-right">
              Step {currentStep + 1} / {totalSteps}
            </span>
            <div className="flex-1 h-2.5 md:h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${currentColor} transition-[width] duration-700`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* MAIN SECTIONS (Skills / Additional / Review) */}
          {currentStep < sectionKeys.length ? (
            <div className="rounded-xl overflow-hidden shadow-xl bg-white">
              <div
                className={`px-4 md:px-6 py-4 md:py-5 bg-gradient-to-r ${currentColor} text-white text-lg font-semibold flex gap-2 items-center`}
              >
                {currentSection.icon}
                {currentSection.title}
              </div>
              <div className="p-4 md:p-6 space-y-4 md:space-y-5">
                {currentSection.skills.map(skill => (
                  <div
                    key={skill}
                    className="flex justify-between items-center p-3 md:p-4 bg-slate-50 rounded-xl"
                  >
                    <p className="font-medium text-slate-700 text-sm md:text-base">{skill}</p>
                    <div className="scale-90 md:scale-100">
                      <StarRating skill={skill} section={currentSectionKey} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentStep === sectionKeys.length ? (
            <section className="bg-white rounded-2xl p-4 md:p-8 shadow-lg border border-slate-100">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-3 md:mb-4">
                Additional Skills
              </h2>
              <textarea
                rows={4}
                placeholder="Domain or industry areas where you have strong expertise (e.g., Automotive, Healthcare, etc.)"
                value={formData.additionalSkills}
                onChange={e => setFormData({ ...formData, additionalSkills: e.target.value })}
                className="w-full p-3 border-2 border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-sky-400 outline-none"
              />
            </section>
          ) : (
            <section className="bg-white rounded-2xl p-4 md:p-8 shadow-lg border border-slate-100">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 mb-4 text-slate-800">
                <Eye className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" /> Review Your Ratings
              </h2>
              <div className="space-y-5">
                <div className="bg-slate-50 p-4 rounded-lg text-sm md:text-base">
                  <h3 className="font-semibold text-slate-700 mb-2">Personal Info</h3>
                  <p>
                    <b>Name:</b> {formData.name}
                  </p>
                  <p>
                    <b>Employee ID:</b> {formData.employeeId}
                  </p>
                  <p>
                    <b>Email:</b> {formData.email}
                  </p>
                </div>

                {sectionKeys.map(key => {
                  const section = SKILL_SECTIONS[key as keyof typeof SKILL_SECTIONS];
                  const rated = formData.skillRatings.filter(sr => sr.section === key);
                  if (rated.length === 0) return null;
                  return (
                    <div key={key} className="border-t pt-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                        {section.icon} {section.title}
                      </h3>
                      {rated.map(sr => (
                        <div
                          key={sr.skill}
                          className="bg-slate-50 p-3 mt-2 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="font-medium text-slate-700 text-sm md:text-base">
                            {sr.skill}
                          </span>
                          <div className="flex items-center gap-2 mt-1 sm:mt-0">
                            {[1, 2, 3, 4, 5].map(star => (
                              <svg
                                key={star}
                                className={`w-4 h-4 md:w-5 md:h-5 ${
                                  star <= sr.rating ? 'fill-yellow-400' : 'fill-gray-200'
                                }`}
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ))}
                            <span className="text-xs md:text-sm text-slate-600 font-medium">
                              {RATING_LABELS[sr.rating as keyof typeof RATING_LABELS]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {formData.additionalSkills && (
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">
                      Additional Skills
                    </h3>
                    <p className="text-slate-700 mt-1 whitespace-pre-line text-sm md:text-base">
                      {formData.additionalSkills}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`w-full md:w-auto px-6 py-3 rounded-xl font-semibold shadow-md ${
                currentStep === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-slate-400 to-slate-600 text-white'
              }`}
            >
              Previous
            </button>
            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className={`w-full md:w-auto px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${currentColor}`}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-sky-400 to-indigo-400 text-white font-bold text-lg rounded-2xl shadow-lg disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit Form'}
              </button>
            )}
          </div>
        </form>

        {/* TOASTS */}
        {status === 'success' && (
          <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce-in">
            <CheckCircle /> Form submitted successfully 🎉
          </div>
        )}
        {status === 'error' && (
          <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-rose-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce-in max-w-xs text-sm">
            <AlertCircle /> {errorMessage}
          </div>
        )}
      </div>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes bounce-in {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
