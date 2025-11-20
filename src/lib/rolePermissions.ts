/**
 * Role-Based Access Control (RBAC)
 * Defines permissions for each user role
 */

export type UserRole = 'Admin' | 'Lead' | 'HR' | 'Delivery Team';

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewEmployees: boolean;
  canManageEmployees: boolean;
  canDeleteEmployees: boolean;
  canViewProjects: boolean;
  canManageProjects: boolean;
  canViewFinancial: boolean;
  canViewReports: boolean;
  canBulkUpload: boolean;
  canManageUsers: boolean;
  canViewSettings: boolean;
}

/**
 * Get permissions for a specific role
 */
export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'Admin':
      return {
        canViewDashboard: true,
        canViewEmployees: true,
        canManageEmployees: true,
        canDeleteEmployees: true,
        canViewProjects: true,
        canManageProjects: true,
        canViewFinancial: true,
        canViewReports: true,
        canBulkUpload: true,
        canManageUsers: true,
        canViewSettings: true,
      };

    case 'Lead':
      return {
        canViewDashboard: true,
        canViewEmployees: true,
        canManageEmployees: true,
        canDeleteEmployees: false,
        canViewProjects: true,
        canManageProjects: true,
        canViewFinancial: true,
        canViewReports: true,
        canBulkUpload: false,
        canManageUsers: false,
        canViewSettings: true,
      };

    case 'HR':
      return {
        canViewDashboard: true,
        canViewEmployees: true,
        canManageEmployees: true,
        canDeleteEmployees: false,
        canViewProjects: true,
        canManageProjects: true,
        canViewFinancial: false,
        canViewReports: true,
        canBulkUpload: false,
        canManageUsers: false,
        canViewSettings: true,
      };

    case 'Delivery Team':
      return {
        canViewDashboard: true,
        canViewEmployees: true,
        canManageEmployees: true,
        canDeleteEmployees: true,
        canViewProjects: true,
        canManageProjects: true,
        canViewFinancial: false,
        canViewReports: false,
        canBulkUpload: false,
        canManageUsers: false,
        canViewSettings: true,
      };

    default:
      // Default to most restrictive permissions
      return {
        canViewDashboard: false,
        canViewEmployees: false,
        canManageEmployees: false,
        canDeleteEmployees: false,
        canViewProjects: false,
        canManageProjects: false,
        canViewFinancial: false,
        canViewReports: false,
        canBulkUpload: false,
        canManageUsers: false,
        canViewSettings: false,
      };
  }
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (
  role: UserRole,
  permission: keyof RolePermissions
): boolean => {
  const permissions = getRolePermissions(role);
  return permissions[permission];
};

/**
 * Get menu items that should be visible for a role
 */
export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  requiredPermission: keyof RolePermissions;
}

export const getVisibleMenuItems = (role: UserRole): MenuItem[] => {
  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      requiredPermission: 'canViewDashboard',
    },
    {
      id: 'employees',
      label: 'Employees',
      path: '/employees',
      requiredPermission: 'canViewEmployees',
    },
    {
      id: 'projects',
      label: 'Projects',
      path: '/projects',
      requiredPermission: 'canViewProjects',
    },
    {
      id: 'financial',
      label: 'Financial',
      path: '/financial',
      requiredPermission: 'canViewFinancial',
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      requiredPermission: 'canViewReports',
    },
    {
      id: 'upload',
      label: 'Bulk Upload',
      path: '/upload',
      requiredPermission: 'canBulkUpload',
    },
    {
      id: 'users',
      label: 'User Management',
      path: '/users',
      requiredPermission: 'canManageUsers',
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      requiredPermission: 'canViewSettings',
    },
  ];

  const permissions = getRolePermissions(role);
  return allMenuItems.filter(item => permissions[item.requiredPermission]);
};
