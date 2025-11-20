import UserProfile from '../models/UserProfile.js';
import AuthService from './authService.js';

/**
 * Initialization Service
 * Handles first-time setup tasks like creating default admin user
 */
class InitializationService {
  /**
   * Initialize the application on startup
   * Creates default admin user if no users exist
   */
  static async initialize() {
    try {
      console.log('Running initialization checks...');
      
      await this.createDefaultAdminIfNeeded();
      
      console.log('Initialization complete.');
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  /**
   * Create default admin user if no users exist in the database
   * This ensures there's always a way to access the system initially
   */
  static async createDefaultAdminIfNeeded() {
    try {
      // Check if any users exist
      const userCount = await UserProfile.countDocuments();
      
      if (userCount === 0) {
        console.log('No users found in database. Creating default admin user...');
        
        // Generate secure default credentials
        const defaultEmail = 'admin@company.com';
        const defaultPassword = this.generateSecurePassword();
        const hashedPassword = await AuthService.hashPassword(defaultPassword);
        
        try {
          // Create default admin user
          const adminUser = await UserProfile.create({
            email: defaultEmail,
            password: hashedPassword,
            name: 'System Administrator',
            role: 'Admin'
          });
          
          console.log('\n' + '='.repeat(70));
          console.log('DEFAULT ADMIN USER CREATED');
          console.log('='.repeat(70));
          console.log(`Email:    ${defaultEmail}`);
          console.log(`Password: ${defaultPassword}`);
          console.log('='.repeat(70));
          console.log('IMPORTANT: Please login and change the password immediately!');
          console.log('='.repeat(70) + '\n');
          
          return {
            created: true,
            email: defaultEmail,
            password: defaultPassword,
            userId: adminUser._id.toString()
          };
        } catch (createError) {
          // Handle race condition - another process may have created the admin
          if (createError.code === 11000) {
            console.log('Admin user was created by another process. Skipping.');
            return {
              created: false,
              reason: 'Admin created by concurrent process'
            };
          }
          throw createError;
        }
      } else {
        console.log(`Found ${userCount} existing user(s). Skipping default admin creation.`);
        return {
          created: false,
          reason: 'Users already exist'
        };
      }
    } catch (error) {
      console.error('Error creating default admin user:', error);
      throw error;
    }
  }

  /**
   * Generate a secure random password
   * @returns {string} Secure password
   */
  static generateSecurePassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if default admin exists
   * @returns {Promise<boolean>} True if default admin exists
   */
  static async defaultAdminExists() {
    const defaultAdmin = await UserProfile.findOne({ 
      email: 'admin@company.com',
      role: 'Admin'
    });
    return !!defaultAdmin;
  }

  /**
   * Get user count
   * @returns {Promise<number>} Number of users in database
   */
  static async getUserCount() {
    return await UserProfile.countDocuments();
  }
}

export default InitializationService;
