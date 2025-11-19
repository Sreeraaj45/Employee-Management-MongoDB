import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  UserProfile,
  Employee,
  Project,
  EmployeeProject,
  Notification,
  NotificationRead,
  DropdownOption,
  POAmendment
} from '../models/index.js';

dotenv.config();

async function testModels() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected successfully');

    // Test that all models are properly defined
    const models = {
      UserProfile,
      Employee,
      Project,
      EmployeeProject,
      Notification,
      NotificationRead,
      DropdownOption,
      POAmendment
    };

    console.log('\nVerifying models...');
    for (const [name, model] of Object.entries(models)) {
      console.log(`✓ ${name} model loaded`);
      
      // Check if model has schema
      if (!model.schema) {
        throw new Error(`${name} model has no schema`);
      }
      
      // Check indexes
      const indexes = model.schema.indexes();
      console.log(`  - ${indexes.length} index(es) defined`);
    }

    console.log('\n✓ All models verified successfully!');
    
    // Test creating a sample document (without saving)
    console.log('\nTesting model instantiation...');
    
    const testUser = new UserProfile({
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: 'Admin'
    });
    console.log('✓ UserProfile instantiation successful');

    const testEmployee = new Employee({
      employee_id: 'EMP001',
      name: 'Test Employee',
      email: 'employee@example.com',
      department: 'Engineering',
      designation: 'Developer'
    });
    console.log('✓ Employee instantiation successful');

    const testProject = new Project({
      name: 'Test Project',
      client: 'Test Client',
      start_date: new Date()
    });
    console.log('✓ Project instantiation successful');

    console.log('\n✓ All tests passed!');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

testModels();
