import { apiClient } from '../apiClient';

export interface DropdownOption {
  _id: string;
  field_name: string;
  option_value: string;
  display_order?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export class DropdownApi {
  static async getAllOptions(fieldName?: string): Promise<DropdownOption[]> {
    try {
      const endpoint = fieldName 
        ? `/api/dropdowns?field_name=${encodeURIComponent(fieldName)}`
        : '/api/dropdowns';
      const response = await apiClient.get<{ options: DropdownOption[] }>(endpoint);
      return response.options;
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      throw error;
    }
  }

  static async createOption(optionData: Partial<DropdownOption>): Promise<DropdownOption> {
    try {
      const response = await apiClient.post<{ option: DropdownOption }>('/api/dropdowns', optionData);
      return response.option;
    } catch (error) {
      console.error('Error creating dropdown option:', error);
      throw error;
    }
  }

  static async updateOption(id: string, optionData: Partial<DropdownOption>): Promise<DropdownOption> {
    try {
      const response = await apiClient.put<{ option: DropdownOption }>(`/api/dropdowns/${id}`, optionData);
      return response.option;
    } catch (error) {
      console.error('Error updating dropdown option:', error);
      throw error;
    }
  }

  static async deleteOption(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/dropdowns/${id}`);
    } catch (error) {
      console.error('Error deleting dropdown option:', error);
      throw error;
    }
  }
}
