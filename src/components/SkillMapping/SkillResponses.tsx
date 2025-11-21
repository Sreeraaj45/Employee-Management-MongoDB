import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Trash2, Edit2, Save, X, Loader, RefreshCw, Download, Columns, Search, AlertCircle, BarChart3, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { skillMappingApi } from '../../lib/api/skillMappingApi';
import EmployeeReview from './EmployeeReview';
import Analytics from './Analytics';

const RATING_LABELS: Record<number, string> = {
  1: 'No Knowledge', 2: 'Novice', 3: 'Proficient', 4: 'Expert', 5: 'Advanced'
};

const SKILL_SECTIONS: Record<string, { title: string; color: string; skills: string[] }> = {
  programming: { title: 'Programming Skills', color: 'from-sky-500 to-emerald-500',
    skills: ['Python', 'C++', 'Java', 'Rust', 'JavaScript', 'C', 'PySpark', 'SQL', 'NoSQL'] },
  dataAnalytics: { title: 'Data Analytics', color: 'from-amber-500 to-pink-500',
    skills: ['Power BI / Tableau', 'Visualization Libraries'] },
  dataScience: { title: 'Data Science', color: 'from-indigo-500 to-purple-500',
    skills: ['Data Modelling (ML Algorithms)', 'Statistics (Fundamental statistical concepts)', 'Dashboards (Power BI, Grafana)'] },
  dataEngineering: { title: 'Data Engineering', color: 'from-orange-500 to-yellow-500',
    skills: ['AWS', 'GCP', 'Azure', 'Apache Airflow', 'Kubernetes', 'Docker', 'flyte'] },
  aiDL: { title: 'AI / Deep Learning', color: 'from-fuchsia-500 to-rose-500',
    skills: ['TensorFlow', 'PyTorch', 'OpenCV', 'Computer Vision Models', 'Generative AI (GenAI)'] },
  frontend: { title: 'Frontend Development', color: 'from-cyan-500 to-blue-500',
    skills: ['HTML', 'CSS', 'Bootstrap', 'React', 'Angular', 'Tailwind CSS', 'Vue.js', 'TypeScript'] },
  backend: { title: 'Backend Development', color: 'from-teal-500 to-green-500',
    skills: ['Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Express.js'] },
  devops: { title: 'DevOps', color: 'from-slate-500 to-indigo-500', skills: ['Jenkins', 'CI/CD'] },
  ADAS: { title: 'ADAS', skills: ['Camera calibration/processing', 'LiDAR (3D)', 'Sensor fusion'], color: 'from-rose-500 to-orange-500' }
};

interface EmployeeResponse {
  _id?: string; name: string; employee_id: string; email: string; selected_skills: string[];
  skill_ratings: Array<{ skill: string; rating: number }>; additional_skills: string; timestamp?: string;
  manager_ratings?: Array<{ skill: string; rating: number }>; company_expectations?: Array<{ skill: string; expectation: number }>;
  rating_gaps?: Array<{ skill: string; gap: number }>; overall_manager_review?: string; manager_review_timestamp?: string;
}

export default function SkillResponses() {
  const [activeTab, setActiveTab] = useState<'responses' | 'analytics'>('responses');
  const [responses, setResponses] = useState<EmployeeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EmployeeResponse>>({});
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [reviewedEmployees, setReviewedEmployees] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const filterPopupRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [headerOrder, setHeaderOrder] = useState<string[]>([]);
  const [subOrder, setSubOrder] = useState<Record<string, string[]>>({});
  const dragHeaderId = useRef<string | null>(null);
  const dragSubSkill = useRef<{ section: string; skill: string } | null>(null);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);

  const initialHeaderOrder = useMemo(() => {
    const keys: string[] = ['number', 'name', 'employee_id', 'email'];
    Object.keys(SKILL_SECTIONS).forEach(sectionKey => keys.push(`section_${sectionKey}`));
    keys.push('additional_skills', 'timestamp', 'actions');
    return keys;
  }, []);

  useEffect(() => {
    const initialVisible: Record<string, boolean> = {};
    const initialSubOrder: Record<string, string[]> = {};
    initialHeaderOrder.forEach(key => { initialVisible[key] = true; });
    Object.entries(SKILL_SECTIONS).forEach(([sectionKey, section]) => {
      initialSubOrder[sectionKey] = [...section.skills];
      section.skills.forEach((skill: string) => { initialVisible[skill] = true; });
    });
    setVisibleColumns(initialVisible);
    setSubOrder(initialSubOrder);
    setHeaderOrder(initialHeaderOrder);
    loadResponses();
  }, [initialHeaderOrder]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnsDropdownRef.current && !columnsDropdownRef.current.contains(event.target as Node)) setShowColumnsDropdown(false);
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) setShowFilterPopup(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadResponses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await skillMappingApi.getResponses();
      if (Array.isArray(data)) setResponses(data);
      else setResponses([]);
    } catch (err: any) {
      setError(`Failed to load responses: ${err?.message || 'Server error'}`);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const startEdit = (response: EmployeeResponse) => {
    setEditingId(response._id || null);
    setEditData({ ...response, skill_ratings: response.skill_ratings.map(sr => ({ ...sr })) });
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await skillMappingApi.deleteResponse(id);
      setResponses(prev => prev.filter((r) => r._id !== id));
      setShowDeleteModal(null);
    } catch {
      setError('Failed to delete response.');
    } finally {
      setDeleting(false);
    }
  };

  const saveEdit = async (id: string) => {
    try {
      const updatePayload: any = {
        name: editData.name,
        employee_id: editData.employee_id,
        email: editData.email,
        additional_skills: editData.additional_skills,
        skill_ratings: editData.skill_ratings?.map(sr => ({ skill: sr.skill, rating: sr.rating, section: '' }))
      };
      await skillMappingApi.updateResponse(id, updatePayload);
      const updated = responses.map((r) => r._id === id ? ({ ...(r as any), ...(editData as any), _id: id } as EmployeeResponse) : r);
      setResponses(updated);
      setEditingId(null);
      setEditData({});
    } catch {
      setError('Failed to update response.');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleRatingChange = (skill: string, newRating: number) => {
    if (!editData.skill_ratings) return;
    const existingRatingIndex = editData.skill_ratings.findIndex((r) => r.skill === skill);
    const updatedRatings = existingRatingIndex !== -1
      ? editData.skill_ratings.map((r, index) => index === existingRatingIndex ? { ...r, rating: newRating } : r)
      : [...editData.skill_ratings, { skill, rating: newRating }];
    setEditData({ ...editData, skill_ratings: updatedRatings });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const hasManagerReview = (employee: EmployeeResponse) => {
    return employee.manager_ratings && employee.manager_ratings.length > 0;
  };

  const filteredResponses = useMemo(() => {
    let filtered = responses;
    if (selectedSkill && selectedSkill.trim() !== '' && selectedRatings.length > 0) {
      const ratingsSet = new Set(selectedRatings);
      filtered = filtered.filter(employee => {
        if (!employee.skill_ratings || !Array.isArray(employee.skill_ratings)) return false;
        for (let i = 0; i < employee.skill_ratings.length; i++) {
          const sr = employee.skill_ratings[i];
          if (sr && sr.skill === selectedSkill) return ratingsSet.has(sr.rating);
        }
        return false;
      });
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || r.employee_id.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }
    return filtered;
  }, [responses, searchTerm, selectedSkill, selectedRatings]);

  const clearFilters = useCallback(() => { setSearchTerm(''); }, []);
  const clearSkillFilters = useCallback(() => { setSelectedSkill(null); setSelectedRatings([]); setShowFilterPopup(false); }, []);

  const handleSkillHeaderClick = useCallback((skill: string) => {
    if (selectedSkill === skill) {
      setShowFilterPopup(prev => !prev);
    } else {
      setSelectedSkill(skill);
      setSelectedRatings([]);
      setShowFilterPopup(true);
    }
  }, [selectedSkill]);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const next = { ...prev };
      const newVal = !prev[key];
      next[key] = newVal;
      if (key.startsWith('section_')) {
        const sectionKey = key.replace('section_', '');
        (SKILL_SECTIONS as any)[sectionKey].skills.forEach((s: string) => (next[s] = newVal));
      } else {
        const sectionEntry = Object.entries(SKILL_SECTIONS).find(([_, sec]) => sec.skills.includes(key));
        if (sectionEntry) {
          const sectionKey = sectionEntry[0];
          const skills: string[] = sectionEntry[1].skills;
          next[key] = newVal;
          const allOff = skills.every(s => !next[s] || !next[s]);
          if (newVal) next[`section_${sectionKey}`] = true;
          else if (allOff) next[`section_${sectionKey}`] = false;
        }
      }
      return next;
    });
  };

  const sectionVisibleCount = (sectionKey: string) => {
    const skills = subOrder[sectionKey] || [];
    return skills.filter(s => visibleColumns[s]).length;
  };

  const getSkillRating = (response: EmployeeResponse | Partial<EmployeeResponse>, skill: string) => {
    const ratings = response._id === editingId ? editData.skill_ratings : response.skill_ratings;
    return ratings?.find(sr => sr.skill === skill)?.rating || 0;
  };

  const handleHeaderDragStart = (e: React.DragEvent, headerId: string) => {
    dragHeaderId.current = headerId;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-40', 'shadow-xl');
  };

  const handleHeaderDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-40', 'shadow-xl');
    dragHeaderId.current = null;
  };

  const handleHeaderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleHeaderDrop = (e: React.DragEvent, targetHeaderId: string) => {
    e.preventDefault();
    const dragged = dragHeaderId.current;
    if (!dragged || dragged === targetHeaderId) return;
    setHeaderOrder(prev => {
      const next = [...prev];
      const from = next.indexOf(dragged);
      const to = next.indexOf(targetHeaderId);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragged);
      return next;
    });
    dragHeaderId.current = null;
  };

  const handleSubDragStart = (e: React.DragEvent, sectionKey: string, skill: string) => {
    dragSubSkill.current = { section: sectionKey, skill };
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-40', 'shadow-xl');
  };

  const handleSubDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-40', 'shadow-xl');
    dragSubSkill.current = null;
  };

  const handleSubDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSubDrop = (e: React.DragEvent, sectionKey: string, targetSkill: string) => {
    e.preventDefault();
    const dragged = dragSubSkill.current;
    if (!dragged || dragged.section !== sectionKey || dragged.skill === targetSkill) return;
    setSubOrder(prev => {
      const arr = [...(prev[sectionKey] || [])];
      const from = arr.indexOf(dragged.skill);
      const to = arr.indexOf(targetSkill);
      if (from === -1 || to === -1) return prev;
      arr.splice(from, 1);
      arr.splice(to, 0, dragged.skill);
      return { ...prev, [sectionKey]: arr };
    });
    dragSubSkill.current = null;
  };

  const downloadExcel = () => {
    const visibleKeysOrdered: string[] = [];
    headerOrder.forEach(h => {
      if (h.startsWith('section_')) {
        const sectionKey = h.replace('section_', '');
        const skills = subOrder[sectionKey] || [];
        skills.forEach(skill => { if (visibleColumns[skill]) visibleKeysOrdered.push(skill); });
      } else {
        if (visibleColumns[h]) visibleKeysOrdered.push(h);
      }
    });
    const exportKeys = visibleKeysOrdered.filter(k => k !== 'timestamp' && k !== 'actions');
    if (exportKeys.length === 0) { alert('No columns selected to export.'); return; }
    const headerRow1: string[] = [];
    const headerRow2: string[] = [];
    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
    let colIndex = 0;
    headerOrder.forEach(h => {
      if (h.startsWith('section_')) {
        const sectionKey = h.replace('section_', '');
        const skills = subOrder[sectionKey] || [];
        const visibleSkills = skills.filter(s => exportKeys.includes(s));
        const span = visibleSkills.length;
        if (span === 0) return;
        headerRow1.push(SKILL_SECTIONS[sectionKey].title);
        for (let i = 1; i < span; ++i) headerRow1.push('');
        if (span > 1) merges.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + span - 1 } });
        visibleSkills.forEach(skill => { headerRow2.push(skill); });
        colIndex += span;
      } else {
        if (!exportKeys.includes(h)) return;
        const friendly = h === 'number' ? 'No.' : h === 'employee_id' ? 'Emp ID' : h === 'additional_skills' ? 'Additional Skills' : h === 'name' ? 'Name' : h === 'email' ? 'Email' : h;
        headerRow1.push(friendly);
        headerRow2.push('');
        merges.push({ s: { r: 0, c: colIndex }, e: { r: 1, c: colIndex } });
        colIndex += 1;
      }
    });
    const dataRows = filteredResponses.map((r, idx) => exportKeys.map(k => {
      if (k === 'number') return idx + 1;
      if (k === 'name') return r.name;
      if (k === 'employee_id') return r.employee_id;
      if (k === 'email') return r.email;
      if (k === 'additional_skills') return r.additional_skills || '';
      const ratingObj = r.skill_ratings.find(sr => sr.skill === k);
      if (ratingObj) {
        const label = RATING_LABELS[ratingObj.rating] || '';
        return `${label} (${ratingObj.rating})`;
      }
      return '';
    }));
    const aoa = [headerRow1, headerRow2, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    if (!ws['!merges']) ws['!merges'] = [];
    (ws['!merges'] as any[]).push(...merges);
    try {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddr1 = XLSX.utils.encode_cell({ r: 0, c: C });
        const cell1 = ws[cellAddr1];
        if (cell1) cell1.s = { font: { bold: true, color: { rgb: 'FFFFFFFF' } }, fill: { fgColor: { rgb: 'FF1E293B' } }, alignment: { horizontal: 'center', vertical: 'center' } };
        const cellAddr2 = XLSX.utils.encode_cell({ r: 1, c: C });
        const cell2 = ws[cellAddr2];
        if (cell2) cell2.s = { font: { bold: true, color: { rgb: 'FF1E293B' } }, fill: { fgColor: { rgb: 'FFE2E8F0' } }, alignment: { horizontal: 'center', vertical: 'center' } };
      }
    } catch (e) { /* ignore styling errors */ }
    const headerCombined = headerRow1.map((h, i) => {
      const sub = headerRow2[i];
      return sub && sub.length > 0 ? sub : h;
    });
    const colWidths = headerCombined.map((h, i) => {
      let max = String(h).length;
      for (let r = 0; r < dataRows.length; ++r) {
        const v = dataRows[r][i];
        const len = v ? String(v).length : 0;
        if (len > max) max = len;
      }
      return { wch: Math.min(Math.max(max + 2, 12), 60) };
    });
    ws['!cols'] = colWidths;
    ws['!rows'] = [{ hpt: 22 }, { hpt: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SkillMapResponses');
    const now = new Date();
    const filename = `responses_export_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.xlsx`;
    XLSX.writeFile(wb, filename, { bookType: 'xlsx', bookSST: false, cellStyles: true });
  };

  if (selectedEmployeeId) {
    return (
      <EmployeeReview
        employeeId={selectedEmployeeId}
        onBack={() => setSelectedEmployeeId(null)}
        onSaveSuccess={(empId) => {
          setReviewedEmployees(prev => new Set(prev).add(empId));
        }}
      />
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white min-h-screen">
      <Loader size={48} className="animate-spin text-indigo-600" />
      <span className="ml-3 text-lg font-medium text-gray-700 mt-4">Fetching skill responses...</span>
    </div>
  );

  if (error) return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200">
      <div className="text-red-600 flex items-center gap-3">
        <AlertCircle size={24} />
        <h3 className="text-xl font-semibold">Data Error</h3>
      </div>
      <p className="mt-3 text-red-800 bg-red-50 p-3 rounded">{error}</p>
      <button onClick={loadResponses} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md">
        <RefreshCw size={16} className="inline mr-2" /> Retry Loading
      </button>
    </div>
  );

  if (responses.length === 0 && activeTab === 'responses') return <p className="text-center text-gray-500 mt-12 text-lg">No responses found yet.</p>;

  // If Analytics tab is active, render Analytics component
  if (activeTab === 'analytics') {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        {/* Navigation Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-1 p-2">
            <button
              onClick={() => setActiveTab('responses')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium"
            >
              <Users size={18} />
              <span>Responses</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white shadow-sm font-medium"
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </button>
          </div>
        </div>
        {/* Analytics Content */}
        <div className="flex-1 overflow-auto">
          <Analytics />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50" role="main">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-1 p-2">
          <button
            onClick={() => setActiveTab('responses')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white shadow-sm font-medium"
          >
            <Users size={18} />
            <span>Responses</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium"
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-2">
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {selectedSkill && selectedRatings.length > 0 && (`Showing ${filteredResponses.length} of ${responses.length} employees with ${selectedSkill} rated ${selectedRatings.sort((a, b) => a - b).join(', ')}`)}
        </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white rounded-l shadow-md border border-slate-100">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">Total Responses: <span className="text-indigo-600">{responses.length}</span></h1>
          <button onClick={loadResponses} className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" title="Refresh" aria-label="Refresh employee responses">
            <RefreshCw size={16} />Refresh
          </button>
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search name, employee ID, or email..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm" />
            {searchTerm && (
              <button onClick={clearFilters} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition" title="Clear search">
                <X size={16} />
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <span className="font-medium">{filteredResponses.length}</span><span>of</span><span className="font-medium">{responses.length}</span><span>results</span>
            </div>
          )}
          <div className="relative" ref={columnsDropdownRef}>
            <button onClick={() => setShowColumnsDropdown(s => !s)} className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium border border-gray-300" title="Toggle columns">
              <Columns size={16} />Columns ({Object.values(visibleColumns).filter(v => v).length - Object.keys(SKILL_SECTIONS).length} visible)
            </button>
            {showColumnsDropdown && (
              <div className="absolute z-40 mt-2 right-0 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 transition-all duration-300 origin-top-right animate-fade-in-down">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                  <strong className="text-slate-800">Column Visibility</strong>
                  <button onClick={() => {
                    const hasAnyHidden = Object.values(visibleColumns).filter(v => typeof v === 'boolean' && !v).length > 0;
                    const next: Record<string, boolean> = {};
                    Object.keys(visibleColumns).forEach(k => (next[k] = hasAnyHidden));
                    setVisibleColumns(next);
                  }} className="relative inline-flex items-center justify-center px-3 py-2 border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-500 hover:text-white font-medium rounded-lg transition-all duration-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2">
                    <span className="flex text-xs items-center gap-2">Toggle All</span>
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {headerOrder.filter(h => !h.startsWith('section_') && h !== 'actions' && h !== 'timestamp').map(h => (
                    <label key={h} className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 rounded px-2">
                      <input type="checkbox" checked={!!visibleColumns[h]} onChange={() => toggleColumn(h)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span>{h === 'number' ? 'No.' : h.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                    </label>
                  ))}
                  <hr className="my-2 border-gray-100" />
                  {Object.entries(SKILL_SECTIONS).map(([sectionKey, section]) => (
                    <div key={sectionKey} className="mb-2 p-2 rounded-lg bg-indigo-50/50 border border-indigo-100">
                      <label className="flex items-center gap-2 text-sm font-semibold py-1 cursor-pointer text-indigo-800">
                        <input type="checkbox" checked={!!visibleColumns[`section_${sectionKey}`]} onChange={() => toggleColumn(`section_${sectionKey}`)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                        <span>{section.title}</span>
                      </label>
                      <div className="ml-5 border-l border-indigo-200 pl-3 pt-1 space-y-1">
                        {(subOrder[sectionKey] || []).map((skill: string) => (
                          <label key={skill} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer hover:bg-white rounded px-2">
                            <input type="checkbox" checked={!!visibleColumns[skill]} onChange={() => toggleColumn(skill)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                            <span>{skill}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <hr className="my-2 border-gray-100" />
                  {['additional_skills', 'timestamp', 'actions'].map(h => (
                    <label key={h} className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 rounded px-2">
                      <input type="checkbox" checked={!!visibleColumns[h]} onChange={() => toggleColumn(h)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span>{h.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={downloadExcel} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition shadow-md text-sm font-medium" title="Export visible rows to XLSX (Submitted & Actions excluded)">
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      {showFilterPopup && selectedSkill && (
        <div ref={filterPopupRef} className="fixed top-32 right-8 z-50 bg-white rounded-lg shadow-2xl border-2 border-indigo-300 p-4 animate-fade-in-down" aria-label="Rating filter popup">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Filter by Rating</span>
                <span className="text-sm font-bold text-indigo-700">{selectedSkill}</span>
              </div>
              <button onClick={() => setShowFilterPopup(false)} className="text-gray-400 hover:text-gray-600 transition" title="Close">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-600">Select Ratings:</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className={`flex items-center justify-center w-10 h-10 border-2 rounded-md cursor-pointer transition-all ${selectedRatings.includes(rating) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50'}`} title={RATING_LABELS[rating]}>
                    <input type="checkbox" checked={selectedRatings.includes(rating)} onChange={(e) => {
                      if (e.target.checked) setSelectedRatings([...selectedRatings, rating]);
                      else setSelectedRatings(selectedRatings.filter((r) => r !== rating));
                    }} className="sr-only" aria-label={`Rating ${rating} - ${RATING_LABELS[rating]}`} />
                    <span className="font-bold">{rating}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedRatings.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  <span className="font-bold text-indigo-700">{filteredResponses.length}</span> results
                </div>
                <button onClick={clearSkillFilters} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition text-xs font-medium" title="Clear filter">
                  <X size={12} />Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="bg-white rounded-l shadow-2xl overflow-hidden border border-gray-200 flex-1 relative">
        <div className="overflow-auto h-full overscroll-contain">
          <table className="min-w-full text-sm border-separate border-spacing-0 table-fixed">
            <thead>
              <tr>
                {headerOrder.map((hdr) => {
                  if (!visibleColumns[hdr]) return null;
                  if (!hdr.startsWith('section_')) {
                    const titleMap: Record<string, string> = { 'number': 'No.', 'name': 'Name', 'employee_id': 'Emp ID', 'email': 'Email', 'additional_skills': 'Additional Skills', 'timestamp': 'Submitted', 'actions': 'Actions' };
                    const title = titleMap[hdr] || hdr;
                    return (
                      <th key={hdr} draggable onDragStart={(e) => handleHeaderDragStart(e, hdr)} onDragEnd={handleHeaderDragEnd} onDragOver={handleHeaderDragOver} onDrop={(e) => handleHeaderDrop(e, hdr)}
                        className={`sticky top-0 z-30 px-4 py-3 bg-slate-700 text-white text-left font-bold border border-slate-700 whitespace-nowrap ${hdr === 'number' ? ' left-0 w-[40px] z-40' : ''} ${hdr === 'name' ? ' left-[55px] w-[180px] z-40' : ''} ${hdr === 'employee_id' ? ' left-[139px] w-[160px] z-40' : ''} ${hdr === 'email' ? ' left-[236px] w-[250px] z-40' : ''}`}>
                        {title}
                      </th>
                    );
                  }
                  const sectionKey = hdr.replace('section_', '');
                  const visibleCount = sectionVisibleCount(sectionKey);
                  if (visibleCount === 0) return null;
                  const section = SKILL_SECTIONS[sectionKey];
                  return (
                    <th key={hdr} draggable onDragStart={(e) => handleHeaderDragStart(e, hdr)} onDragEnd={handleHeaderDragEnd} onDragOver={handleHeaderDragOver} onDrop={(e) => handleHeaderDrop(e, hdr)} colSpan={visibleCount}
                      className={`sticky top-0 z-20 px-4 py-3 text-center font-bold text-white border-r border-b border-slate-700 bg-gradient-to-r ${section.color} cursor-move transition-colors whitespace-nowrap`}>
                      {section.title}
                    </th>
                  );
                })}
              </tr>
              <tr className="bg-gray-100">
                {headerOrder.map((hdr) => {
                  if (!visibleColumns[hdr]) return null;
                  if (!hdr.startsWith('section_')) {
                    const stickyLeft = hdr === 'number' ? ' sticky left-0 w-[60px] z-20' : hdr === 'name' ? ' sticky left-[55px] w-[180px] z-20' : hdr === 'employee_id' ? ' sticky left-[139px] w-[160px] z-20' : hdr === 'email' ? ' sticky left-[236px] w-[250px] z-20' : '';
                    return <th key={`${hdr}-spacer`} className={`top-[49px] bg-gray-100 border-r border-b border-gray-300${stickyLeft}`} />;
                  }
                  const sectionKey = hdr.replace('section_', '');
                  if (sectionVisibleCount(sectionKey) === 0) return null;
                  return ((subOrder[sectionKey] || []).filter(skill => visibleColumns[skill]).map((skill) => {
                    const isActiveFilter = selectedSkill === skill && selectedRatings.length > 0;
                    return (
                      <th key={skill} draggable onDragStart={(e) => handleSubDragStart(e, sectionKey, skill)} onDragEnd={handleSubDragEnd} onDragOver={handleSubDragOver} onDrop={(e) => handleSubDrop(e, sectionKey, skill)} onClick={() => handleSkillHeaderClick(skill)}
                        className={`sticky top-[49px] z-10 px-3 py-2 text-xs font-semibold border-r border-b border-gray-200 cursor-pointer whitespace-nowrap transition-colors ${isActiveFilter ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' : 'bg-gray-50 text-gray-700 hover:bg-indigo-50'}`} title={`Click to filter by ${skill}`}>
                        <div className="flex items-center justify-center gap-1">
                          {skill}
                          {isActiveFilter && (<span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-indigo-600 rounded-full">{selectedRatings.length}</span>)}
                        </div>
                      </th>
                    );
                  }));
                })}
              </tr>
            </thead>
            <tbody>
              {filteredResponses.map((response, index) => {
                const isEditing = response._id === editingId;
                const displayData = isEditing ? editData : response;
                const isOddRow = index % 2 !== 0;
                return (
                  <tr key={response._id} className={`group hover:bg-indigo-50/50 transition duration-150 ${isEditing ? 'bg-indigo-100/80 shadow-inner' : isOddRow ? 'bg-white' : 'bg-gray-50'}`}>
                    {headerOrder.map((hdr) => {
                      if (!visibleColumns[hdr]) return null;
                      if (!hdr.startsWith('section_')) {
                        const cellClasses = `p-3 whitespace-nowrap overflow-hidden text-ellipsis bg-white border border-gray-200 ${hdr === 'number' ? ' sticky left-0 w-[60px] z-20 bg-white text-center' : ''} ${hdr === 'name' ? ' sticky left-[55px] w-[180px] z-20 bg-white text-left' : ''} ${hdr === 'employee_id' ? ' sticky left-[139px] w-[160px] z-20 bg-white text-left' : ''} ${hdr === 'email' ? ' sticky left-[236px] w-[250px] z-20 bg-white text-left' : ''}`;
                        if (hdr === 'actions') {
                          return (
                            <td key={hdr} className={`${cellClasses} w-1 bg-gray-100/50`}>
                              <div className="flex items-center justify-center gap-2">
                                {isEditing ? (
                                  <>
                                    <button onClick={() => saveEdit(response._id!)} className="p-1.5 rounded-full text-white bg-green-500 hover:bg-green-600 transition disabled:opacity-50" disabled={deleting} title="Save"><Save size={18} /></button>
                                    <button onClick={cancelEdit} className="p-1.5 rounded-full text-white bg-red-500 hover:bg-red-600 transition" title="Cancel"><X size={18} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(response)} className="p-1.5 rounded-full text-white bg-indigo-500 hover:bg-indigo-600 transition" title="Edit"><Edit2 size={18} /></button>
                                    <button onClick={() => setShowDeleteModal(response._id!)} className="p-1.5 rounded-full text-white bg-red-400 hover:bg-red-500 transition" title="Delete"><Trash2 size={18} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        }
                        if (isEditing && (hdr === 'name' || hdr === 'employee_id' || hdr === 'email' || hdr === 'additional_skills')) {
                          const isLongText = hdr === 'additional_skills';
                          return (
                            <td key={hdr} className={cellClasses}>
                              {isLongText ? (
                                <textarea value={editData[hdr] || ''} onChange={(e) => setEditData({ ...editData, [hdr]: e.target.value })} className="w-full p-1 border rounded focus:ring-indigo-500 text-xs h-16 resize-none" />
                              ) : (
                                <input type="text" value={editData[hdr] || ''} onChange={(e) => setEditData({ ...editData, [hdr]: e.target.value })} className="w-full p-1 border rounded focus:ring-indigo-500 text-sm" />
                              )}
                            </td>
                          );
                        }
                        let value: string | number = '';
                        if (hdr === 'number') value = index + 1;
                        else if (hdr === 'timestamp') value = formatDate(response.timestamp);
                        else {
                          const rawValue = response[hdr as keyof EmployeeResponse];
                          if (Array.isArray(rawValue)) value = rawValue.length > 0 ? JSON.stringify(rawValue) : '';
                          else if (typeof rawValue === 'object') value = JSON.stringify(rawValue);
                          else value = rawValue as string || '';
                        }
                        return (
                          <td key={hdr} className={cellClasses}>
                            {hdr === 'name' ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => setSelectedEmployeeId(displayData._id || null)} className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">{value}</button>
                                {hasManagerReview(response) ? (
                                  <span title="Manager review completed" className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                ) : (<span title="Manager review pending" className="flex items-center gap-1"></span>)}
                              </div>
                            ) : (
                              <span className={hdr === 'employee_id' ? 'font-mono text-indigo-700 font-semibold' : 'text-gray-600'}>{value}</span>
                            )}
                          </td>
                        );
                      }
                      const sectionKey = hdr.replace('section_', '');
                      if (sectionVisibleCount(sectionKey) === 0) return null;
                      return ((subOrder[sectionKey] || []).filter(skill => visibleColumns[skill]).map((skill) => {
                        const rating = getSkillRating(displayData, skill);
                        const ratingText = RATING_LABELS[rating] || 'Unrated';
                        const cellClasses = `p-3 text-center border-r border-b border-gray-200 transition-all`;
                        if (isEditing) {
                          return (
                            <td key={skill} className={cellClasses}>
                              <select value={rating} onChange={(e) => handleRatingChange(skill, parseInt(e.target.value))} className="w-full p-1 text-sm border rounded focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                                <option value={0}>Unrated</option>
                                {[1, 2, 3, 4, 5].map(r => (<option key={r} value={r}>{RATING_LABELS[r]} ({r})</option>))}
                              </select>
                            </td>
                          );
                        }
                        return (
                          <td key={skill} className={cellClasses}>
                            {rating > 0 ? (
                              <div className="flex flex-col items-center justify-center">
                                <div className="flex items-center gap-1"><span className="text-lg font-bold text-indigo-600">{rating}</span></div>
                                <span className="text-xs text-gray-500">{ratingText}</span>
                              </div>
                            ) : (<span className="text-xs text-gray-400">N/A</span>)}
                          </td>
                        );
                      }));
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredResponses.length === 0 && (
            <div className="p-8 text-center text-lg text-gray-500 bg-white">
              {searchTerm ? `No results found for "${searchTerm}".` : selectedSkill && selectedRatings.length > 0 ? `No employees found with ${selectedSkill} rated ${selectedRatings.sort((a, b) => a - b).join(', ')}.` : 'No responses found.'}
            </div>
          )}
        </div>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2"><Trash2 /> Confirm Deletion</h3>
            <p className="mt-4 text-gray-700">Are you sure you want to delete the response from <strong>{responses.find(r => r._id === showDeleteModal)?.name}</strong>? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition" disabled={deleting}>Cancel</button>
              <button onClick={() => handleDelete(showDeleteModal)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50" disabled={deleting}>
                {deleting && <Loader size={16} className="animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
        <style>{`
          .animate-fade-in-down { animation: fadeInDown 0.3s ease-out; }
          @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-slide-down { animation: slideDown 0.4s ease-out; }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 1000px; } }
          .animate-count-update { animation: countPulse 0.3s ease-in-out; }
          @keyframes countPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); color: rgb(79, 70, 229); } }
          .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
        `}</style>
      </div>
    </div>
  );
}
