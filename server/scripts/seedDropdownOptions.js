import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DropdownOption from '../models/DropdownOption.js';
import connectDB from '../config/database.js';

dotenv.config();

/**
 * Seed data for dropdown options
 * This script populates the database with common dropdown values
 * It is idempotent - can be run multiple times safely
 */

const dropdownData = {
  department: [
    'Engineering',
    'Human Resources',
    'Finance',
    'Marketing',
    'Sales',
    'Operations',
    'Product Management',
    'Quality Assurance',
    'Customer Support',
    'Administration',
    'Research & Development',
    'Business Development',
    'Legal',
    'IT Support',
    'Data Analytics'
  ],
  
  designation: [
    'Software Engineer',
    'Senior Software Engineer',
    'Lead Software Engineer',
    'Principal Engineer',
    'Engineering Manager',
    'Technical Architect',
    'DevOps Engineer',
    'QA Engineer',
    'Senior QA Engineer',
    'Product Manager',
    'Senior Product Manager',
    'Project Manager',
    'Business Analyst',
    'Data Analyst',
    'Data Scientist',
    'UI/UX Designer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Mobile Developer',
    'HR Manager',
    'HR Executive',
    'Recruiter',
    'Finance Manager',
    'Accountant',
    'Marketing Manager',
    'Marketing Executive',
    'Sales Manager',
    'Sales Executive',
    'Operations Manager',
    'Team Lead',
    'Associate',
    'Senior Associate',
    'Consultant',
    'Senior Consultant',
    'Director',
    'Vice President',
    'Chief Technology Officer',
    'Chief Executive Officer'
  ],
  
  billability_status: [
    'Billable',
    'Non-Billable',
    'Partially Billable',
    'On Bench',
    'Internal Project',
    'Training',
    'On Leave',
    'Shadow Resource'
  ],
  
  experience_band: [
    '0-1 years',
    '1-2 years',
    '2-3 years',
    '3-5 years',
    '5-7 years',
    '7-10 years',
    '10-15 years',
    '15+ years'
  ],
  
  mode_of_management: [
    'Direct',
    'Indirect',
    'Matrix',
    'Functional',
    'Project-based'
  ],
  
  billing: [
    'Monthly',
    'Fixed',
    'Daily',
    'Hourly',
    'Milestone-based',
    'Retainer'
  ],
  
  location: [
    'Bangalore',
    'Mumbai',
    'Delhi',
    'Hyderabad',
    'Pune',
    'Chennai',
    'Kolkata',
    'Ahmedabad',
    'Noida',
    'Gurgaon',
    'Remote',
    'Hybrid'
  ],
  
  position: [
    'Junior',
    'Mid-Level',
    'Senior',
    'Lead',
    'Principal',
    'Manager',
    'Senior Manager',
    'Director',
    'VP',
    'C-Level'
  ]
};

/**
 * Seed dropdown options into the database
 */
async function seedDropdownOptions() {
  try {
    console.log('Starting dropdown options seeding...');
    
    let totalCreated = 0;
    let totalSkipped = 0;
    
    // Iterate through each field and its options
    for (const [fieldName, options] of Object.entries(dropdownData)) {
      console.log(`\nProcessing field: ${fieldName}`);
      
      for (let i = 0; i < options.length; i++) {
        const optionValue = options[i];
        
        try {
          // Check if option already exists
          const existingOption = await DropdownOption.findOne({
            field_name: fieldName,
            option_value: optionValue
          });
          
          if (existingOption) {
            console.log(`  ✓ Skipped (exists): ${optionValue}`);
            totalSkipped++;
          } else {
            // Create new option
            await DropdownOption.create({
              field_name: fieldName,
              option_value: optionValue,
              display_order: i,
              is_active: true
            });
            console.log(`  ✓ Created: ${optionValue}`);
            totalCreated++;
          }
        } catch (error) {
          // Handle duplicate key errors gracefully
          if (error.code === 11000) {
            console.log(`  ✓ Skipped (duplicate): ${optionValue}`);
            totalSkipped++;
          } else {
            console.error(`  ✗ Error creating ${optionValue}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('Seeding completed!');
    console.log(`Total created: ${totalCreated}`);
    console.log(`Total skipped: ${totalSkipped}`);
    console.log('='.repeat(50));
    
    return { created: totalCreated, skipped: totalSkipped };
  } catch (error) {
    console.error('Error seeding dropdown options:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Connect to database
    await connectDB();
    
    // Run seeding
    await seedDropdownOptions();
    
    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Export functions for use in other modules
export { seedDropdownOptions, dropdownData };

// Run main function when script is executed directly
main();
