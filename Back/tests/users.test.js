/**
 * User API Tests
 * Tests for user management endpoints
 */
const request = require('supertest');
const app = require('../../server');
const db = require('../../db');

describe('User API', () => {

  let adminToken;
  let userId;

  beforeAll(async () => {
    // Login as admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    adminToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await db.pool.end();
  });

  describe('GET /api/users', () => {

    test('should get all users as admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
    });

  });

  describe('GET /api/users/meta/recipients', () => {

    test('should get recipients as admin', async () => {
      const response = await request(app)
        .get('/api/users/meta/recipients')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recipients).toBeDefined();
    });

    test('should return grouped recipients', async () => {
      const response = await request(app)
        .get('/api/users/meta/recipients')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.grouped).toBeDefined();
      expect(response.body.data.grouped.admins).toBeDefined();
    });

  });

});
