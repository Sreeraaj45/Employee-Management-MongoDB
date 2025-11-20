import mongoose from 'mongoose';
import DropdownOption from '../models/DropdownOption.js';
import dotenv from 'dotenv';

dotenv.config();

const defaultOptions = {
  billability_status: [
    'Billable',
    'Bench',
    'Trainee',
    'Buffer',
    'ML',
    'NA'
  ],
  mode_of_management: [
    'Managed Service',
    'SUPPORT_FUNCTIONS',
    'T&M',
    'Fixed Price'
  ],
  experience_band: [
    '0-2 years',
    '2-5 years',
    '5-8 years',
    '8-12 years',
    '12+ years'
  ],
  department: [
    'Engineering',
    'QA',
    'DevOps',
    'Design',
    'Product',
    'Management',
    'HR',
    'Finance',
    'Sales',
    'Marketing'
  ],
  designation: [
    'Software Engineer',
    'Senior Software Engineer',
    'Lead Engineer',
    'Architect',
    'QA Engineer',
    'DevOps Engineer',
    'Product Manager',
    'Project Manager',
    'Designer',
    'Analyst'
  ]
};

async function seedDropdownOptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing options (optional - comment out if you want to keep existing)
    // await DropdownOption.deleteMany({});
    // console.log('🗑️  Cleared existing dropdown options');

    let createdCount = 0;
    let skippedCount = 0;

    // Seed each field's options
    for (const [fieldName, options] of Object.entries(defaultOptions)) {
      for (let i = 0; i < options.length; i++) {
        const optionValue = options[i];
        
        // Check if option already exists
        const existing = await DropdownOption.findOne({
          field_name: fieldName,
          option_value: optionValue
        });

        if (existing) {
          console.log(`⏭️  Skipped: ${fieldName} - ${optionValue} (already exists)`);
          skippedCount++;
          continue;
        }

        // Create new option
        const dropdown = new DropdownOption({
          field_name: fieldName,
          option_value: optionValue,
          display_order: i + 1,
          is_active: true
        });

        await dropdown.save();
        console.log(`✅ Created: ${fieldName} - ${optionValue}`);
        createdCount++;
      }
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`   Created: ${createdCount} options`);
    console.log(`   Skipped: ${skippedCount} options (already existed)`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dropdown options:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDropdownOptions();
