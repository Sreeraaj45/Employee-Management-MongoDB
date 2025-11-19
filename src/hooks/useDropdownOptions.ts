import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DropdownOption } from '../types';

export const useDropdownOptions = () => {
  const [options, setOptions] = useState<{ [key: string]: DropdownOption[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching dropdown options:', error);
        return;
      }

      const groupedOptions: { [key: string]: DropdownOption[] } = {};
      data.forEach((option: any) => {
        const mappedOption: DropdownOption = {
          id: option.id,
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
      const { data: { user } } = await supabase.auth.getUser();
      
      const maxOrder = options[fieldName]?.length 
        ? Math.max(...options[fieldName].map(opt => opt.displayOrder))
        : 0;

      const { data, error } = await supabase
        .from('dropdown_options')
        .insert({
          field_name: fieldName,
          option_value: optionValue,
          display_order: maxOrder + 1,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding dropdown option:', error);
        return { success: false, error: error.message };
      }

      if (data) {
        const newOption: DropdownOption = {
          id: data.id,
          fieldName: data.field_name,
          optionValue: data.option_value,
          displayOrder: data.display_order,
          isActive: data.is_active,
          createdBy: data.created_by,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };

        setOptions(prev => ({
          ...prev,
          [fieldName]: [...(prev[fieldName] || []), newOption]
        }));
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding dropdown option:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const removeOption = async (id: string, fieldName: string) => {
    try {
      const { error } = await supabase
        .from('dropdown_options')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error removing dropdown option:', error);
        return { success: false, error: error.message };
      }

      setOptions(prev => ({
        ...prev,
        [fieldName]: prev[fieldName]?.filter(opt => opt.id !== id) || []
      }));

      return { success: true };
    } catch (error) {
      console.error('Error removing dropdown option:', error);
      return { success: false, error: 'An unexpected error occurred' };
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