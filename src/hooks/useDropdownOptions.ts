import { useState, useEffect } from 'react';
import { DropdownOption } from '../types';
import { DropdownApi } from '../lib/api/dropdownApi';

export const useDropdownOptions = () => {
  const [options, setOptions] = useState<{ [key: string]: DropdownOption[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchOptions = async () => {
    try {
      const data = await DropdownApi.getAllOptions();

      const groupedOptions: { [key: string]: DropdownOption[] } = {};
      data.forEach((option: any) => {
        const mappedOption: DropdownOption = {
          id: option._id,
          fieldName: option.field_name,
          optionValue: option.option_value,
          displayOrder: option.display_order,
          isActive: option.is_active,
          createdBy: option.created_by,
          createdAt: option.created_at,
          updatedAt: option.updated_at
        };

        if (!groupedOptions[option.field_name]) {
          groupedOptions[option.field_name] = [];
        }
        groupedOptions[option.field_name].push(mappedOption);
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