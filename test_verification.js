// Test script to verify the auto-creation logic
console.log('🧪 Testing Auto-Creation Logic\n');

// Sample employee data with new clients and projects
const testEmployees = [
  {
    employeeId: 'TEST001',
    name: 'Alice Johnson',
    client: 'Acme Corporation',
    projects: 'E-commerce Platform'
  },
  {
    employeeId: 'TEST002', 
    name: 'Bob Smith',
    client: 'Acme Corporation', // Same client as first
    projects: 'E-commerce Platform' // Same project as first
  },
  {
    employeeId: 'TEST003',
    name: 'Carol Davis', 
    client: 'TechStart Inc', // New client
    projects: 'Mobile Banking App' // New project
  },
  {
    employeeId: 'TEST004',
    name: 'David Wilson',
    client: 'TechStart Inc', // Same client as third
    projects: 'Mobile Banking App' // Same project as third
  },
  {
    employeeId: 'TEST005',
    name: 'Eve Brown',
    client: 'Global Solutions', // Another new client
    projects: 'Data Analytics Dashboard' // Another new project
  }
];

// Extract unique clients and projects (same logic as in the implementation)
const uniqueClients = [...new Set(testEmployees
  .map(emp => emp.client)
  .filter(client => client && client.trim() !== '')
)];

const uniqueProjects = [...new Set(testEmployees
  .map(emp => emp.projects)
  .filter(project => project && project.trim() !== '')
)];

console.log('📋 Analysis Results:');
console.log('Unique clients found:', uniqueClients);
console.log('Unique projects found:', uniqueProjects);
console.log('Total employees to process:', testEmployees.length);

// Test project-client association logic
function findProjectClientAssociation(project, employeesData) {
  const projectEmployees = employeesData.filter(emp => emp.projects === project && emp.client);
  
  if (projectEmployees.length === 0) {
    return 'Auto-created Client'; // Default fallback
  }
  
  // Find the most common client for this project
  const clientCounts = projectEmployees.reduce((acc, emp) => {
    acc[emp.client] = (acc[emp.client] || 0) + 1;
    return acc;
  }, {});
  
  const associatedClient = Object.keys(clientCounts).reduce((a, b) => 
    clientCounts[a] > clientCounts[b] ? a : b
  );
  
  return { client: associatedClient, count: clientCounts[associatedClient] };
}

console.log('\n🔗 Project-Client Associations:');
uniqueProjects.forEach(project => {
  const association = findProjectClientAssociation(project, testEmployees);
  console.log(`Project "${project}" → Client "${association.client}" (${association.count} employees)`);
});

console.log('\n✅ Test completed! This shows what would happen during bulk upload.');
console.log('\n📝 Expected Results:');
console.log('- 3 new clients would be created: Acme Corporation, TechStart Inc, Global Solutions');
console.log('- 3 new projects would be created with correct client associations');
console.log('- 5 test employees would be processed');