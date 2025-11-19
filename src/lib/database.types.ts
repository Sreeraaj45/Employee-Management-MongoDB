export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      notifications: {
        Row: {
          id: string
          title: string
          message: string
          type: 'employee_created' | 'employee_updated' | 'employee_deleted' | 'project_created' | 'project_updated' | 'project_deleted' | 'user_created' | 'user_updated' | 'user_deleted' | 'bulk_upload_completed' | 'system_announcement'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          target_roles: ('Admin' | 'Lead' | 'HR')[]
          target_user_id: string | null
          action_url: string | null
          action_label: string | null
          created_by: string | null
          created_at: string
          expires_at: string | null
          is_read: boolean
          read_at: string | null
          read_by: string | null
        }
        Insert: {
          id?: string
          title: string
          message: string
          type: 'employee_created' | 'employee_updated' | 'employee_deleted' | 'project_created' | 'project_updated' | 'project_deleted' | 'user_created' | 'user_updated' | 'user_deleted' | 'bulk_upload_completed' | 'system_announcement'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          target_roles?: ('Admin' | 'Lead' | 'HR')[]
          target_user_id?: string | null
          action_url?: string | null
          action_label?: string | null
          created_by?: string | null
          created_at?: string
          expires_at?: string | null
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          message?: string
          type?: 'employee_created' | 'employee_updated' | 'employee_deleted' | 'project_created' | 'project_updated' | 'project_deleted' | 'user_created' | 'user_updated' | 'user_deleted' | 'bulk_upload_completed' | 'system_announcement'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          target_roles?: ('Admin' | 'Lead' | 'HR')[]
          target_user_id?: string | null
          action_url?: string | null
          action_label?: string | null
          created_by?: string | null
          created_at?: string
          expires_at?: string | null
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
        }
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          id?: string
          notification_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          id?: string
          notification_id?: string
          user_id?: string
          read_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'Admin' | 'Lead' | 'HR'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'Admin' | 'Lead' | 'HR'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'Admin' | 'Lead' | 'HR'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          s_no: number
          employee_id: string
          name: string
          email: string
          department: string
          designation: string
          mode_of_management: string
          client: string | null
          billability_status: string
          po_number: string | null
          last_active_date: string | null
          projects: string | null
          billability_percentage: number
          project_start_date: string | null
          project_end_date: string | null
          experience_band: string
          ageing: number
          bench_days: number
          phone_number: string | null
          emergency_contact: string | null
          ctc: number
          remarks: string | null
          last_modified_by: string | null
          position: string | null
          joining_date: string | null
          contact_number: string | null
          location: string | null
          manager: string | null
          skills: string[]
          created_at: string
          updated_at: string
          date_of_separation: string | null
        }
        Insert: {
          id?: string
          s_no?: never
          employee_id: string
          name: string
          email: string
          department: string
          designation: string
          mode_of_management?: string
          client?: string | null
          billability_status?: string
          po_number?: string | null
          last_active_date?: string | null
          projects?: string | null
          billability_percentage?: number
          project_start_date?: string | null
          project_end_date?: string | null
          experience_band?: string
          ageing?: number
          bench_days?: number
          phone_number?: string | null
          emergency_contact?: string | null
          ctc?: number
          remarks?: string | null
          last_modified_by?: string | null
          position?: string | null
          joining_date?: string | null
          contact_number?: string | null
          location?: string | null
          manager?: string | null
          skills?: string[]
          created_at?: string
          updated_at?: string
          date_of_separation?: string | null 
        }
        Update: {
          id?: string
          s_no?: never
          employee_id?: string
          name?: string
          email?: string
          department?: string
          designation?: string
          mode_of_management?: string
          client?: string | null
          billability_status?: string
          po_number?: string | null
          last_active_date?: string | null
          projects?: string | null
          billability_percentage?: number
          project_start_date?: string | null
          project_end_date?: string | null
          experience_band?: string
          ageing?: number
          bench_days?: number
          phone_number?: string | null
          emergency_contact?: string | null
          ctc?: number
          remarks?: string | null
          last_modified_by?: string | null
          position?: string | null
          joining_date?: string | null
          contact_number?: string | null
          location?: string | null
          manager?: string | null
          skills?: string[]
          created_at?: string
          updated_at?: string
          date_of_separation?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          client: string
          description: string | null
          department: string | null
          start_date: string
          end_date: string | null
          status: string
          po_number: string | null
          budget: number | null
          team_size: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          client: string
          description?: string | null
          department?: string | null
          start_date: string
          end_date?: string | null
          status?: string
          po_number?: string | null
          budget?: number | null
          team_size?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          client?: string
          description?: string | null
          department?: string | null
          start_date?: string
          end_date?: string | null
          status?: string
          po_number?: string | null
          budget?: number | null
          team_size?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employee_projects: {
        Row: {
          id: string
          employee_id: string
          project_id: string
          allocation_percentage: number
          start_date: string
          end_date: string | null
          role_in_project: string | null
          po_number: string | null 
          billing: 'Monthly' | 'Fixed' | 'Daily' | 'Hourly' | null
          rate: number | null   
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          project_id: string
          allocation_percentage?: number
          start_date?: string
          end_date?: string | null
          role_in_project?: string | null
          po_number?: string | null 
          billing: 'Monthly' | 'Fixed' | 'Daily' | 'Hourly' | null 
          rate?: number | null      
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          project_id?: string
          allocation_percentage?: number
          start_date?: string
          end_date?: string | null
          role_in_project?: string | null
          po_number?: string | null 
          billing: 'Monthly' | 'Fixed' | 'Daily' | 'Hourly' | null 
          rate?: number | null    
          created_at?: string
        }
      }
      dropdown_options: {
        Row: {
          id: string
          field_name: string
          option_value: string
          display_order: number
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          field_name: string
          option_value: string
          display_order?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          field_name?: string
          option_value?: string
          display_order?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'Admin' | 'Lead' | 'HR'
      billability_status: 'Billable' | 'Non-Billable' | 'Bench' | 'Trainee' | 'Buffer' | 'ML' | 'NA'
      engagement_mode: 'Full Time' | 'Contract' | 'Part Time' | 'Consultant'
      project_status: 'Active' | 'Completed' | 'On Hold' | 'Cancelled'
      billing_type: 'Monthly' | 'Fixed' | 'Daily' | 'Hourly'
    }
  }
}

