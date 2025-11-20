import { useState, useEffect } from 'react';
import { DropdownOption } from '../types';
import { DropdownApi } from '../lib/api/dropdownApi';

export const useDropdownOptions = () => {
  const [options, setOptions] = useState<{ [key: string]: DropdownOption[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchOptions = async () => {
    // Check if user is authenticated before fetching
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await DropdownApi.getAllOptions();

      // Data is already grouped by field_name from the backend
      const groupedOptions: { [key: string]: DropdownOption[] } = {};
      
      Object.keys(data).forEach((fieldName) => {
        groupedOptions[fieldName] = data[fieldName].map((option: any) => ({
          id: option._id,
          fieldName: fieldName,
          optionValue: option.option_value,
          displayOrder: option.display_order,
          isActive: true,
          createdBy: undefined,
          createdAt: option.created_at,
          updatedAt: option.updated_at
        }));
      });

      setOptions(groupedOptions);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const addOption = async (fieldName: string, optionValue: string) => {
    try {
      const maxOrder = options[fieldName]?.length 
        ? Math.max(...options[fieldName].map(opt => opt.displayOrder))
        : 0;

      const data = await DropdownApi.createOption({
        field_name: fieldName,
        option_value: optionValue,
        display_order: maxOrder + 1,
        is_active: true
      });

      const newOption: DropdownOption = {
        id: data._id,
        fieldName: data.field_name,
        optionValue: data.option_value,
        displayOrder: data.display_order,
        isActive: data.is_active,
        createdBy: undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setOptions(prev => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), newOption]
      }));

      return { success: true };
    } catch (error: any) {
      console.error('Error adding dropdown option:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const removeOption = async (id: string, fieldName: string) => {
    try {
      await DropdownApi.updateOption(id, { is_active: false });

      setOptions(prev => ({
        ...prev,
        [fieldName]: prev[fieldName]?.filter(opt => opt.id !== id) || []
      }));

      return { success: true };
    } catch (error: any) {
      console.error('Error removing dropdown option:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  return {
    options,
    isLoading,
    addOption,
    removeOption,
    refreshOptions: fetchOptions
  };
};