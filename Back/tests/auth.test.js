/**
 * Authentication API Tests
 * Tests for login, register, profile endpoints
 */
const request = require('supertest');
const app = require('../../server');
const db = require('../../db');

describe('Authentication API', () => {
  
  beforeAll(async () => {
    // Setup: Create test database if needed
    console.log('Setting up authentication tests...');
  });

  afterAll(async () => {
    // Cleanup
    await db.pool.end();
  });

  describe('POST /api/auth/login', () => {
    
    test('should login with valid admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe('admin');
      expect(response.body.data.user.role).toBe('admin');
    });

    test('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/غير صحيحة|invalid/i);
    });

    test('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'admin123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

  });

  describe('POST /api/auth/register', () => {

    test('should register new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `testuser_${Date.now()}`,
          email: `test_${Date.now()}@gov.ma`,
          password: 'Test1234',
          full_name: 'Test User',
          role: 'employee'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });

    test('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `testuser_${Date.now()}`,
          email: `test_${Date.now()}@gov.ma`,
          password: '123',
          full_name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `testuser_${Date.now()}`,
          email: 'invalid-email',
          password: 'Test1234',
          full_name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

  });

  describe('GET /api/auth/profile', () => {

    let token;

    beforeAll(async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      token = loginResponse.body.data.token;
    });

    test('should get profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe('admin');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
    });

  });

});
