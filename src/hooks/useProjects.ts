import { useEffect, useMemo, useState } from 'react';
import { ProjectService, ClientWithProjects } from '../lib/projectService';

export const useProjects = () => {
  const [clients, setClients] = useState<ClientWithProjects[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await ProjectService.getClientsWithProjects();
      setClients(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Refresh only a specific client
  const refreshClient = async (clientName: string) => {
    try {
      const updatedClients = await ProjectService.getClientsWithProjects();
      const updatedClient = updatedClients.find(c => c.client === clientName);
      
      if (updatedClient) {
        setClients(prev => 
          prev.map(client => 
            client.client === clientName ? updatedClient : client
          )
        );
      }
    } catch (e) {
      console.error('Failed to refresh client:', e);
    }
  };

  // Refresh only a specific project
  const refreshProject = async (projectId: string) => {
    try {
      // Get updated project details
      const projectDetails = await ProjectService.getProjectById(projectId);
      const clientName = projectDetails.client;
      
      // Update the specific project in state
      setClients(prev => 
        prev.map(client => {
          if (client.client === clientName) {
            return {
              ...client,
              projects: client.projects.map(project => 
                project.id === projectId 
                  ? {
                      ...project,
                      name: projectDetails.name,
                      status: projectDetails.status,
                      teamSize: projectDetails.team_size,
                      poNumber: projectDetails.po_number
                    }
                  : project
              )
            };
          }
          return client;
        })
      );
    } catch (e) {
      console.error('Failed to refresh project:', e);
    }
  };

  // Add a new project to state without full refresh
  const addProjectToState = (newProject: {
    id: string;
    name: string;
    client: string;
    status: string;
    teamSize: number;
    employeeCount: number;
    poNumber?: string | null;
  }) => {
    setClients(prev => 
      prev.map(client => {
        if (client.client === newProject.client) {
          // Check if project already exists
          const existingProject = client.projects.find(p => p.id === newProject.id);
          if (!existingProject) {
            return {
              ...client,
              projects: [...client.projects, newProject]
            };
          }
        }
        return client;
      })
    );
  };

  // Remove a project from state without full refresh
  const removeProjectFromState = (projectId: string, clientName: string) => {
    setClients(prev => 
      prev.map(client => {
        if (client.client === clientName) {
          return {
            ...client,
            projects: client.projects.filter(p => p.id !== projectId)
          };
        }
        return client;
      })
    );
  };

  // Update project employees count without full refresh
  const updateProjectEmployeeCount = (projectId: string, clientName: string, employeeCount: number) => {
    setClients(prev => 
      prev.map(client => {
        if (client.client === clientName) {
          return {
            ...client,
            projects: client.projects.map(project => 
              project.id === projectId 
                ? { ...project, employeeCount }
                : project
            )
          };
        }
        return client;
      })
    );
  };

  useEffect(() => {
    refresh();
  }, []);

  const clientNames = useMemo(() => clients.map(c => c.client), [clients]);
  
  const getProjectsForClient = (clientName: string) => {
    const c = clients.find(x => x.client === clientName);
    if (!c) return [];
    
    // Filter out special client-only projects and placeholder projects
    return c.projects.filter(p => 
      !p.name.startsWith('[Client]') && !p.name.startsWith('__CLIENT_ONLY__')
    );
  };

  return { 
    clients, 
    clientNames, 
    getProjectsForClient, 
    loading, 
    error, 
    refresh,
    refreshClient,
    refreshProject,
    addProjectToState,
    removeProjectFromState,
    updateProjectEmployeeCount
  };
};