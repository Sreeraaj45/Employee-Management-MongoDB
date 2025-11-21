const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface EmployeeData {
  name: string;
  employeeId: string;
  email: string;
}

interface SkillRating {
  skill: string;
  rating: number;
  section: string;
}

interface SkillResponseData {
  name: string;
  employee_id: string;
  email: string;
  selected_skills: string[];
  skill_ratings: SkillRating[];
  additional_skills: string;
}

export const skillMappingApi = {
  // Fetch employee data by employee ID (public, no auth)
  async getEmployeeByEmployeeId(employeeId: string): Promise<EmployeeData> {
    const response = await fetch(`${API_BASE_URL}/api/public/employee/${employeeId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch employee');
    }
    
    const data = await response.json();
    return data.employee;
  },

  // Submit skill mapping response (public, no auth)
  async createResponse(responseData: SkillResponseData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/public/skill-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to submit skill mapping');
    }
    
    return response.json();
  },

  // Get all skill responses (requires auth)
  async getResponses(): Promise<any[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/public/skill-responses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch responses');
    }
    
    const data = await response.json();
    return data.responses;
  },

  // Update skill response (requires auth)
  async updateResponse(id: string, updateData: Partial<SkillResponseData>): Promise<any> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/public/skill-responses/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update response');
    }
    
    return response.json();
  },

  // Delete skill response (requires auth)
  async deleteResponse(id: string): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/public/skill-responses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete response');
    }
  },

  // Save manager review (requires auth)
  async saveManagerReview(
    id: string,
    reviewData: {
      managerRatings: Array<{ skill: string; rating: number }>;
      companyExpectations: Array<{ skill: string; expectation: number }>;
      ratingGaps: Array<{ skill: string; gap: number }>;
      overallManagerReview: string;
    }
  ): Promise<any> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/public/skill-responses/${id}/manager-review`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to save manager review');
    }
    
    return response.json();
  }
};
