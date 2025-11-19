import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserProfile from '../models/UserProfile.js';
import { config } from '../config/env.js';

class AuthService {
  /**
   * Hash password using bcrypt with 10 salt rounds
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token containing user ID and role
   * @param {string} userId - User's MongoDB ObjectId
   * @param {string} role - User's role (Admin, Lead, HR, Delivery Team)
   * @returns {string} JWT token
   */
  static generateToken(userId, role) {
    const payload = {
      userId,
      role
    };
    
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiration
    });
  }

  /**
   * Verify JWT token and extract payload
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload with userId and role
   * @throws {Error} If token is invalid or expired
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Register new user
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @param {string} name - User name
   * @param {string} role - User role
   * @returns {Promise<Object>} Created user (without password)
   */
  static async register(email, password, name, role) {
    // Check if user already exists
    const existingUser = await UserProfile.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await UserProfile.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role
    });

    // Return user without password
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object>} Object containing user and token
   */
  static async login(email, password) {
    // Find user by email
    const user = await UserProfile.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user._id.toString(), user.role);

    // Return user without password and token
    const userObject = user.toObject();
    delete userObject.password;

    return {
      user: userObject,
      token
    };
  }
}

export default AuthService;
