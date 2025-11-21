import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Loader, Maximize2, X, Users, Code2, Code, Star, BarChart3, Cpu, Brain, Database, Settings, Server, Layout, Car, ChevronDown } from 'lucide-react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import { skillMappingApi } from '../../lib/api/skillMappingApi';
import SkillDetailModal from './SkillDetailModal';
import SkillsListModal from './SkillsListModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
am4core.useTheme(am4themes_animated);

interface EmployeeResponse {
  _id?: string; name: string; employee_id: string; email: string; selected_skills: string[];
  skill_ratings: Array<{ skill: string; rating: number; section?: string }>; additional_skills: string; timestamp?: string;
}

interface EmployeeSkillData {
  name: string; employee_id: string; email: string; rating: number; categoryAvgRating?: number;
}

const SKILL_SECTIONS = {
  programming: { title: 'Programming Skills', skills: ['Python', 'C++', 'Java', 'Rust', 'JavaScript', 'C', 'PySpark', 'SQL', 'NoSQL'], icon: Code2, color: 'from-sky-400 to-emerald-400' },
  dataAnalytics: { title: 'Data Analytics', skills: ['Power BI / Tableau', 'Visualization Libraries'], icon: BarChart3, color: 'from-amber-400 to-pink-400' },
  dataScience: { title: 'Data Science', skills: ['Data Modelling (ML Algorithms)', 'Statistics (Fundamental statistical concepts)', 'Dashboards (Power BI, Grafana)'], icon: Brain, color: 'from-indigo-400 to-purple-400' },
  dataEngineering: { title: 'Data Engineering', skills: ['AWS', 'GCP', 'Azure', 'Apache Airflow', 'Kubernetes', 'Docker', 'flyte'], icon: Database, color: 'from-orange-400 to-yellow-400' },
  aiDL: { title: 'AI / Deep Learning', skills: ['TensorFlow', 'PyTorch', 'OpenCV', 'Computer Vision Models', 'Generative AI (GenAI)'], icon: Cpu, color: 'from-fuchsia-400 to-rose-400' },
  frontend: { title: 'Frontend Development', skills: ['HTML', 'CSS', 'Bootstrap', 'React', 'Angular', 'Tailwind CSS', 'Vue.js', 'TypeScript'], icon: Layout, color: 'from-cyan-400 to-blue-400' },
  backend: { title: 'Backend Development', skills: ['Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Express.js'], icon: Server, color: 'from-teal-400 to-green-400' },
  devops: { title: 'DevOps', skills: ['Jenkins', 'CI/CD'], icon: Settings, color: 'from-slate-400 to-indigo-400' },
  ADAS: { title: 'ADAS', skills: ['Camera calibration/processing', 'LiDAR (3D)', 'Sensor fusion'], icon: Car, color: 'from-rose-400 to-orange-400' }
};

export default function Analytics() {
  const [responses, setResponses] = useState<EmployeeResponse[]>([]);
  const [skillAnalytics, setSkillAnalytics] = useState<Array<{ skill: string; count: number; avgRating: number }>>([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const modalChartRef = useRef<HTMLDivElement | null>(null);
  const pieChartInstance = useRef<any>(null);
  const modalPieChartInstance = useRef<any>(null);
  const [isPieModalOpen, setIsPieModalOpen] = useState(false);
  const [isBarModalOpen, setIsBarModalOpen] = useState(false);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; employees: EmployeeSkillData[]; sectionTitle: string; sectionColor: string } | null>(null);
  const [showTop5Only, setShowTop5Only] = useState(true);
  const [skillsListModalOpen, setSkillsListModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{ key: string; title: string; color: string; icon: any } | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await skillMappingApi.getResponses();
      setResponses(Array.isArray(data) ? data : []);
      analyzeSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setResponses([]);
      setSkillAnalytics([]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkills = (responseData: EmployeeResponse[]) => {
    const skillMap = new Map<string, { count: number; totalRating: number; ratingCount: number }>();
    responseData.forEach((response) => {
      const seen = new Set<string>();
      (response.selected_skills || []).forEach((skill) => {
        if (!skillMap.has(skill)) skillMap.set(skill, { count: 0, totalRating: 0, ratingCount: 0 });
        const d = skillMap.get(skill)!;
        d.count++;
        seen.add(skill);
        const rating = (response.skill_ratings || []).find((sr) => sr.skill === skill);
        if (rating) { d.totalRating += rating.rating; d.ratingCount++; }
      });
      (response.skill_ratings || []).forEach((sr) => {
        if (seen.has(sr.skill)) return;
        if (!skillMap.has(sr.skill)) skillMap.set(sr.skill, { count: 0, totalRating: 0, ratingCount: 0 });
        const d = skillMap.get(sr.skill)!;
        d.count++;
        d.totalRating += sr.rating;
        d.ratingCount++;
      });
    });
    const analytics = Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill, count: data.count, avgRating: data.ratingCount > 0 ? Number((data.totalRating / data.ratingCount).toFixed(1)) : 0
    }));
    setSkillAnalytics(analytics.sort((a, b) => b.count - a.count));
  };

  useEffect(() => {
    loadAnalytics();
    return () => {
      if (pieChartInstance.current) { pieChartInstance.current.dispose(); pieChartInstance.current = null; }
      if (modalPieChartInstance.current) { modalPieChartInstance.current.dispose(); modalPieChartInstance.current = null; }
    };
  }, []);

  useEffect(() => {
    createSmallPieChart();
    if (isPieModalOpen) createModalPieChart();
  }, [skillAnalytics]);

  useEffect(() => {
    if (isPieModalOpen) createModalPieChart();
    else if (modalPieChartInstance.current) { modalPieChartInstance.current.dispose(); modalPieChartInstance.current = null; }
  }, [isPieModalOpen]);

  const topRatedSkills = [...skillAnalytics].filter(s => s.avgRating > 0).sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);
  const top10RatedSkills = [...skillAnalytics].filter(s => s.avgRating > 0).sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);
  const avgRating = skillAnalytics.length > 0 ? (skillAnalytics.reduce((sum, s) => sum + s.avgRating, 0) / skillAnalytics.length).toFixed(1) : '0';

  const getCategoryAverageRating = (employeeId: string, sectionKey: string): number => {
    const section = SKILL_SECTIONS[sectionKey as keyof typeof SKILL_SECTIONS];
    if (!section) return 0;
    const response = responses.find(r => r.employee_id === employeeId);
    if (!response) return 0;
    const sectionSkills = new Set(section.skills);
    const ratings = response.skill_ratings?.filter(sr => sectionSkills.has(sr.skill)) || [];
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, sr) => acc + sr.rating, 0);
    return sum / ratings.length;
  };

  const getEmployeesForSkill = (skillName: string, sectionKey?: string): EmployeeSkillData[] => {
    const employees: EmployeeSkillData[] = [];
    responses.forEach((response) => {
      const skillRating = response.skill_ratings?.find((sr) => sr.skill === skillName);
      if (skillRating) {
        const categoryAvgRating = sectionKey ? getCategoryAverageRating(response.employee_id, sectionKey) : undefined;
        employees.push({ name: response.name, employee_id: response.employee_id, email: response.email, rating: skillRating.rating, categoryAvgRating });
      }
    });
    return employees.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return (b.categoryAvgRating || 0) - (a.categoryAvgRating || 0);
    });
  };

  const getTopEmployeesPerSection = (sectionKey: string) => {
    const section = SKILL_SECTIONS[sectionKey as keyof typeof SKILL_SECTIONS];
    if (!section) return [];
    return section.skills.map((skill) => {
      const allEmployees = getEmployeesForSkill(skill);
      const top5 = allEmployees.slice(0, 5);
      return { skill, employees: top5, totalCount: allEmployees.length, allEmployees };
    }).filter(item => item.totalCount > 0);
  };

  const handleViewAllEmployees = (skillName: string, sectionTitle: string, sectionColor: string, sectionKey: string) => {
    const employees = getEmployeesForSkill(skillName, sectionKey);
    setSelectedSkill({ name: skillName, employees, sectionTitle, sectionColor });
    setShowTop5Only(true);
    setSkillModalOpen(true);
  };

  const handleSectionClick = (sectionKey: string) => {
    const section = SKILL_SECTIONS[sectionKey as keyof typeof SKILL_SECTIONS];
    if (!section) return;
    setSelectedSection({ key: sectionKey, title: section.title, color: section.color, icon: section.icon });
    setSkillsListModalOpen(true);
  };

  const handleSkillClickFromList = (skillName: string) => {
    if (!selectedSection) return;
    setSkillsListModalOpen(false);
    handleViewAllEmployees(skillName, selectedSection.title, selectedSection.color, selectedSection.key);
  };

  const handleBackToSkillsList = () => {
    setSkillModalOpen(false);
    setSelectedSkill(null);
    setShowTop5Only(true);
    setSkillsListModalOpen(true);
  };

  const barChartData = {
    labels: topRatedSkills.map((s) => s.skill),
    datasets: [{
      label: 'Average Rating',
      data: topRatedSkills.map((s) => s.avgRating),
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.7)');
        return gradient;
      },
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: 0.8,
      categoryPercentage: 0.8
    }]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, color: '#111827', font: { size: 18, weight: 'bold' as const } },
      tooltip: { callbacks: { label: function(context: any) { return `Average Rating: ${context.parsed.y.toFixed(2)} / 5.0`; } } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#4B5563' } },
      y: { beginAtZero: true, max: 5, grid: { color: 'rgba(229,231,235,0.4)' }, ticks: { color: '#4B5563', stepSize: 1 } }
    }
  };

  const barModalData = {
    labels: top10RatedSkills.map((s) => s.skill),
    datasets: [{
      label: 'Average Rating',
      data: top10RatedSkills.map((s) => s.avgRating),
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.7)');
        return gradient;
      },
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      borderRadius: 8,
      barPercentage: 0.4,
      categoryPercentage: 0.6
    }]
  };

  const barModalOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Top 10 Highest Rated Skills', color: '#111827', font: { size: 20, weight: 'bold' as const } },
      tooltip: { callbacks: { label: function(context: any) { return `Average Rating: ${context.parsed.y.toFixed(2)} / 5.0`; } } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#4B5563', maxRotation: 45, minRotation: 45 } },
      y: { beginAtZero: true, max: 5, grid: { color: 'rgba(229,231,235,0.4)' }, ticks: { color: '#4B5563', stepSize: 1 } }
    }
  };

  const createPieChartOn = (div: HTMLDivElement | null, targetRef: React.MutableRefObject<any>) => {
    if (!div) return null;
    if (targetRef.current) {
      try { targetRef.current.dispose(); } catch (e) { /* ignore */ }
      targetRef.current = null;
    }
    const chart = am4core.create(div, am4charts.PieChart3D);
    try { (chart as any).logo && ((chart as any).logo.disabled = true); } catch (e) { /* ignore */ }
    chart.hiddenState.properties.opacity = 0;
    const dataForPie = skillAnalytics.filter(s => s.avgRating > 0).map((s) => ({ category: s.skill, value: s.avgRating, count: s.count }));
    chart.data = dataForPie;
    const series = chart.series.push(new am4charts.PieSeries3D());
    series.dataFields.value = 'value';
    series.dataFields.category = 'category';
    series.labels.template.text = '{category}: {value.percent.formatNumber(\'#.0\')}%';
    series.labels.template.fill = am4core.color('#4B5563');
    series.labels.template.fontSize = 10;
    series.labels.template.fontWeight = '600';
    series.ticks.template.disabled = false;
    series.ticks.template.strokeOpacity = 0.5;
    series.labels.template.wrap = true;
    series.labels.template.maxWidth = 150;
    series.labels.template.truncate = false;
    series.colors.list = [
      am4core.color('#A7C7E7'), am4core.color('#F7CAC9'), am4core.color('#C3E8BD'),
      am4core.color('#FBE5A1'), am4core.color('#E6C9F7'), am4core.color('#FFD6A5'), am4core.color('#B5EAD7')
    ];
    chart.innerRadius = am4core.percent(30);
    chart.depth = 35;
    chart.radius = am4core.percent(70);
    chart.padding(16, 16, 16, 16);
    chart.align = 'center';
    series.slices.template.tooltipText = '{category}: Avg Rating {value.formatNumber(\'#.00\')}/5.0 ({count} ratings)';
    targetRef.current = chart;
    return chart;
  };

  const createSmallPieChart = () => {
    if (!chartRef.current) return;
    if (pieChartInstance.current) {
      try { pieChartInstance.current.dispose(); } catch (e) { /* ignore */ }
      pieChartInstance.current = null;
    }
    pieChartInstance.current = createPieChartOn(chartRef.current, pieChartInstance);
  };

  const createModalPieChart = () => {
    if (!modalChartRef.current) return;
    if (modalPieChartInstance.current) {
      try { modalPieChartInstance.current.dispose(); } catch (e) { /* ignore */ }
      modalPieChartInstance.current = null;
    }
    modalPieChartInstance.current = createPieChartOn(modalChartRef.current, modalPieChartInstance);
    if (modalPieChartInstance.current) {
      modalPieChartInstance.current.radius = am4core.percent(85);
      modalPieChartInstance.current.innerRadius = am4core.percent(40);
      modalPieChartInstance.current.depth = 45;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-2xl p-16 flex flex-col items-center justify-center gap-4 border border-gray-100">
          <Loader size={32} className="animate-spin text-indigo-600" />
          <span className="text-xl font-medium text-gray-700">Loading comprehensive analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 md:p-6 bg-gray-50 min-h-screen">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:bg-blue-100 group">
          <div className="flex items-center justify-between">
            <Users className="w-6 h-6 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Submissions</div>
          </div>
          <div className="text-3xl font-extrabold text-blue-700 mt-2 transition-transform duration-300">{responses.length}</div>
          <p className="text-xs text-gray-700 mt-1">Total responses collected</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:bg-green-100 group">
          <div className="flex items-center justify-between">
            <Code className="w-6 h-6 text-green-500 transition-transform duration-300 group-hover:scale-110" />
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">Unique Skills</div>
          </div>
          <div className="text-3xl font-extrabold text-green-700 mt-2 transition-transform duration-300">{skillAnalytics.length}</div>
          <p className="text-xs text-gray-700 mt-1">Distinct skills rated/selected</p>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:bg-yellow-100 group">
          <div className="flex items-center justify-between">
            <Star className="w-6 h-6 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">Overall Avg Rating</div>
          </div>
          <div className="text-3xl font-extrabold text-yellow-700 mt-2 transition-transform duration-300">{avgRating}</div>
          <p className="text-xs text-gray-700 mt-1">Average proficiency across all skills</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="bg-white rounded-xl shadow-xl ring-1 ring-black/5 p-6 relative flex flex-col lg:col-span-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-800">Top 5 Highest Rated Skills</h3>
            <button onClick={() => setIsBarModalOpen(true)} title="Open bar chart fullscreen (Top 10)" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition">
              <Maximize2 size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Skills with the best average ratings from employees.</p>
          <div className="min-h-[300px] flex items-center justify-center">
            {topRatedSkills.length > 0 ? (<Bar data={barChartData} options={barChartOptions} />) : (<p className="text-gray-400 italic">No rating data available</p>)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-xl ring-1 ring-black/5 p-6 relative flex flex-col lg:col-span-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-800">Skill Rating Distribution</h3>
            <button onClick={() => setIsPieModalOpen(true)} title="Open pie chart fullscreen" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition">
              <Maximize2 size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Distribution based on average skill ratings.</p>
          <div className="mt-3 flex-1 min-h-[300px]">
            <div ref={chartRef} id="chartdiv" style={{ width: '100%', height: '100%', minHeight: '300px' }} />
          </div>
        </div>
      </div>

      {/* Skill Categories Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Skill Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Object.entries(SKILL_SECTIONS).map(([sectionKey, section]) => {
            const topEmployeesData = getTopEmployeesPerSection(sectionKey);
            if (topEmployeesData.length === 0) return null;
            const Icon = section.icon;
            const totalEmployees = topEmployeesData.reduce((sum, skill) => sum + skill.totalCount, 0);
            return (
              <button key={sectionKey} onClick={() => handleSectionClick(sectionKey)} className={`bg-gradient-to-br ${section.color} rounded-xl shadow-lg p-4 md:p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-left group`}>
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="p-3 md:p-4 rounded-xl bg-white/30 group-hover:bg-white/50 transition-all">
                    <Icon size={28} className="text-white md:w-8 md:h-8" />
                  </div>
                  <div className="bg-white/90 px-2 md:px-3 py-1 rounded-full">
                    <span className="text-xs md:text-sm font-bold text-gray-700">{topEmployeesData.length} skills</span>
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2 group-hover:text-white/90 transition-colors">{section.title}</h3>
                <p className="text-xs md:text-sm text-white/80 font-medium">{totalEmployees} total employee {totalEmployees === 1 ? 'rating' : 'ratings'}</p>
                <div className="mt-3 md:mt-4 flex items-center gap-2 text-xs md:text-sm font-semibold text-white">
                  <span>View Skills</span>
                  <ChevronDown size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Skill Proficiency Overview */}
      <div className="space-y-8">
        <div className="grid gap-8">
          <div className="bg-white rounded-xl shadow-2xl ring-1 ring-black/5 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Skill Proficiency Overview</h3>
            <div className="grid grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-2">
              {skillAnalytics.length > 0 ? (
                skillAnalytics.map((skill, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition duration-150 border border-gray-100">
                    <span className="text-sm text-gray-700 flex-1 font-medium">{skill.skill}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} fill={i < Math.round(skill.avgRating) ? '#FBBF24' : 'none'} stroke={i < Math.round(skill.avgRating) ? '#FBBF24' : '#D1D5DB'} className="transition duration-100" />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-indigo-700 w-6 text-right">{skill.avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2">
                  <p className="text-gray-500 italic text-center py-4">No ratings data available for overview.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isPieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] relative transform scale-100 transition-transform duration-300">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Full Skill Rating Distribution</h3>
                <p className="text-sm text-gray-500 mt-1">Distribution based on average skill ratings</p>
              </div>
              <button onClick={() => setIsPieModalOpen(false)} title="Close" className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 h-[calc(100vh-120px)] flex items-center justify-center">
              <div ref={modalChartRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {isBarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-0 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-screen relative transform scale-100 transition-transform duration-300 mt-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-800">Top 10 Highest Rated Skills</h3>
              <button onClick={() => setIsBarModalOpen(false)} title="Close" className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 h-[calc(100vh-120px)] flex items-center justify-center">
              <div className="w-full h-full">
                {top10RatedSkills.length > 0 ? (<Bar data={barModalData} options={barModalOptions} />) : (<p className="text-gray-400 italic text-lg">No rating data available</p>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedSection && (
        <SkillsListModal
          isOpen={skillsListModalOpen}
          onClose={() => { setSkillsListModalOpen(false); setSelectedSection(null); }}
          sectionTitle={selectedSection.title}
          sectionColor={selectedSection.color}
          sectionIcon={selectedSection.icon}
          skills={getTopEmployeesPerSection(selectedSection.key).map(s => ({ skill: s.skill, totalCount: s.totalCount }))}
          onSkillClick={handleSkillClickFromList}
        />
      )}

      {selectedSkill && (
        <SkillDetailModal
          isOpen={skillModalOpen}
          onClose={() => { setSkillModalOpen(false); setSelectedSkill(null); setShowTop5Only(true); setSelectedSection(null); }}
          skillName={selectedSkill.name}
          employees={selectedSkill.employees}
          sectionTitle={selectedSkill.sectionTitle}
          sectionColor={selectedSkill.sectionColor}
          showTop5Only={showTop5Only}
          onShowMore={() => setShowTop5Only(false)}
          onBack={selectedSection ? handleBackToSkillsList : undefined}
        />
      )}
    </div>
  );
}
