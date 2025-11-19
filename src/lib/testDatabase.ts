import { supabase } from './supabase';

export const testDatabase = async () => {
  console.log('🔍 Testing database structure...');
  
  try {
    // Test 1: Check projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');
    
    if (projectsError) {
      console.error('❌ Projects error:', projectsError);
    } else {
      console.log('📊 Projects found:', projects?.length || 0);
      projects?.forEach(p => {
        console.log(`  - ${p.name} (${p.client}) - Status: ${p.status}`);
      });
    }

    // Test 2: Check employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, employee_id, name, client, billability_status');
    
    if (employeesError) {
      console.error('❌ Employees error:', employeesError);
    } else {
      console.log('👥 Employees found:', employees?.length || 0);
      employees?.forEach(e => {
        console.log(`  - ${e.name} (${e.employee_id}) - Client: ${e.client || 'None'} - Status: ${e.billability_status}`);
      });
    }

    // Test 3: Check employee_projects mapping
    const { data: mappings, error: mappingsError } = await supabase
      .from('employee_projects')
      .select('*');
    
    if (mappingsError) {
      console.error('❌ Employee-Projects mapping error:', mappingsError);
    } else {
      console.log('🔗 Employee-Project mappings found:', mappings?.length || 0);
      mappings?.forEach(m => {
        console.log(`  - Employee: ${m.employee_id} -> Project: ${m.project_id}`);
      });
    }

    // Test 4: Check unique clients from employees
    const { data: clientEmployees, error: clientError } = await supabase
      .from('employees')
      .select('client')
      .not('client', 'is', null);
    
    if (clientError) {
      console.error('❌ Client employees error:', clientError);
    } else {
      const uniqueClients = [...new Set(clientEmployees?.map(e => e.client))];
      console.log('🏢 Unique clients from employees:', uniqueClients);
    }

  } catch (error) {
    console.error('💥 Database test error:', error);
  }
};
