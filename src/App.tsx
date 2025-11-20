import { useState, useEffect } from 'react';
import { AuthContext, useAuth, useAuthProvider } from './hooks/useAuth';
import { useEmployees } from './hooks/useEmployees';
import { LoginForm } from './components/Auth/LoginForm';
import { AuthCallback } from './components/Auth/AuthCallback'; // ← ADD THIS IMPORT
import { Sidebar } from './components/Layout/Sidebar';
import { DashboardCards } from './components/Dashboard/DashboardCards';
import { EmployeeTable } from './components/Employees/EmployeeTable';
import { EmployeeForm } from './components/Employees/EmployeeForm';
import { EmployeeDetail } from './components/Employees/EmployeeDetail';
import { BulkUpload } from './components/BulkUpload/BulkUpload';
import { FinancialDashboard } from './components/Financial/FinancialDashboard';
import { ReportsPage } from './components/Reports/ReportsPage';
import { UserManagement } from './components/Settings/UserManagement';
import { PasswordChange } from './components/Settings/PasswordChange';
import { Employee } from './types';
import Projects from './components/Projects/Projects';
import { POScheduler } from './lib/poScheduler';
import { Menu } from 'lucide-react';
import { ProjectService } from './lib/projectService';
export default App;

function AppContent() {
  const { user, isLoading } = useAuth();
  const { 
    employees, 
    loading: employeesLoading, 
    getDashboardMetrics, 
    createEmployee: addEmployee, 
    updateEmployee, 
    bulkUploadEmployees: bulkImportEmployees,
    refetch
  } = useEmployees();
  
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // URL to page mapping - ADD AUTH CALLBACK ROUTE
  const urlToPageMap: { [key: string]: string } = {
    '/dashboard': 'dashboard',
    '/employees': 'employees',
    '/projects': 'projects',
    '/financial': 'financial',
    '/reports': 'reports',
    '/upload': 'upload',
    '/settings': 'settings',
    '/user-management': 'user-management',
    '/auth/callback': 'auth-callback' // ← ADD THIS
  };

  // Page to URL mapping
  const pageToUrlMap: { [key: string]: string } = {
    'dashboard': '/dashboard',
    'employees': '/employees',
    'projects': '/projects',
    'financial': '/financial',
    'reports': '/reports',
    'upload': '/upload',
    'settings': '/settings',
    'user-management': '/user-management',
    'auth-callback': '/auth/callback' // ← ADD THIS
  };

  // Get current page from URL
  const getCurrentPageFromUrl = (): string => {
    const path = window.location.pathname;
    return urlToPageMap[path] || 'dashboard';
  };

  // Update URL when page changes
  const updateUrl = (page: string) => {
    const url = pageToUrlMap[page] || '/dashboard';
    if (window.location.pathname !== url) {
      window.history.pushState({}, '', url);
    }
  };
  
  // Commented out - needs migration to MongoDB API
  // useEffect(() => {
  //   // Migrate existing default project names
  //   ProjectService.migrateDefaultProjectNames();
  // }, []);

  // Initialize page from URL on mount
  useEffect(() => {
    const initialPage = getCurrentPageFromUrl();
    setCurrentPage(initialPage);
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const page = getCurrentPageFromUrl();
      setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ✅ ADD PO SCHEDULER HERE - Run when user is authenticated
  useEffect(() => {
    const initializePOScheduler = async () => {
      if (user) {
        try {
          console.log('🔄 Initializing PO scheduler...');
          const result = await POScheduler.recalculateAllActivePOs();
          console.log('✅ PO scheduler completed:', result);
        } catch (error) {
          console.error('❌ PO scheduler failed:', error);
        }
      }
    };

    initializePOScheduler();
  }, [user]);

  // Refetch employees after login/auth ready to avoid initial 0 metrics
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  // Debug logging for state
  console.log('🔍 AppContent render - user:', user, 'isLoading:', isLoading);

  // ✅ ADD AUTH CALLBACK HANDLING
  if (currentPage === 'auth-callback') {
    console.log('🔄 Rendering AuthCallback component');
    return <AuthCallback />;
  }

  if (isLoading) {
    console.log('⏳ Showing loading screen');
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🚪 No user, showing login form');
    return <LoginForm />;
  }

  const handleEditEmployee = (employee: Employee, section?: string) => {
    setSelectedEmployee(employee);
    setShowEmployeeForm(true);
    setShowEmployeeDetail(false);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    console.log('Employee deleted:', employeeId);
    refetch();
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeDetail(true);
  };

  const handleSaveEmployee = async (employeeData: Omit<Employee, 'id' | 'lastUpdated'>) => {
    try {
      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.id, employeeData);
      } else {
        await addEmployee(employeeData);
      }
      setShowEmployeeForm(false);
      setSelectedEmployee(null);
    } catch (err) {
      console.error('Failed to save employee:', err);
    }
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setShowEmployeeForm(true);
  };

  const handleBulkUpload = async (newEmployees: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[]) => {
    try {
      await bulkImportEmployees(newEmployees);
      console.log('Bulk upload successful, employees should refresh automatically');
    } catch (error) {
      console.error('Error uploading employees:', error);
    }
  };

  const handleNavigate = (url: string) => {
    const page = urlToPageMap[url];
    if (page) {
      setCurrentPage(page);
      updateUrl(page);
      setSidebarOpen(false);
    }
  };

  const renderPageContent = () => {
    if (employeesLoading) {
      return (
        <div className="flex items-center justify-center min-h-[600px] w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ...</p>
          </div>
        </div>
      );
    }

    const metrics = getDashboardMetrics();

    switch (currentPage) {
      case 'dashboard':
        return (
          <div>
            <DashboardCards metrics={metrics} />
          </div>
        );
      
      case 'employees':
        return (
          <EmployeeTable
            onEdit={handleEditEmployee}
            onAdd={handleAddEmployee}
            onView={handleViewEmployee}
          />
        );
      
      case 'projects':
        return <Projects />;
      
      case 'financial':
        if (user.role === 'HR') {
          return (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">You don't have permission to view financial data.</p>
            </div>
          );
        }
        return <FinancialDashboard employees={employees} />;
      
      case 'reports':
        return <ReportsPage employees={employees} />;
      
      case 'upload':
        if (user.role !== 'Admin') {
          return (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">Only administrators can perform bulk uploads.</p>
            </div>
          );
        }
        return <BulkUpload onUpload={handleBulkUpload} />;
      
      case 'user-management':
        if (user.role !== 'Admin') {
          return (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">Only administrators can manage users.</p>
            </div>
          );
        }
        return <UserManagement />;
      
      case 'settings':
        return (
          <div className="space-y-8">
            <PasswordChange />
          </div>
        );
      
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Page Not Found</h3>
            <p className="text-gray-600">The requested page could not be found.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex-shrink-0
      `}>
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={(page) => {
            setCurrentPage(page);
            updateUrl(page);
            setSidebarOpen(false);
          }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile Menu Button */}
        <div className="lg:hidden p-4 border-b bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        {/* Main content */}
        <main className={`flex-1 overflow-y-auto w-full max-w-full ${
          currentPage === 'employees' ? '' : 'p-3 sm:p-4 lg:p-5'
        }`}>
          {currentPage === 'employees' ? (
            renderPageContent()
          ) : (
            <div className="w-full max-w-full mx-auto">
              {renderPageContent()}
            </div>
          )}
        </main>
      </div>

      {showEmployeeForm && (
        <EmployeeForm
          employee={selectedEmployee || undefined}
          onSave={handleSaveEmployee}
          onClose={() => {
            setShowEmployeeForm(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {showEmployeeDetail && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-white animate-in fade-in duration-300">
          <EmployeeDetail
            employee={selectedEmployee}
            onEdit={handleEditEmployee}
            onBack={() => {
              setShowEmployeeDetail(false);
              setSelectedEmployee(null);
            }}
            onDelete={handleDeleteEmployee}
          />
        </div>
      )}
    </div>
  );
}

function App() {
  const authValue = useAuthProvider();
  
  return (
    <AuthContext.Provider value={authValue}>
      <AppContent />
    </AuthContext.Provider>
  );
}
