/**
 * Message API Tests
 * Tests for message management and approval workflow
 */
const request = require('supertest');
const app = require('../../server');
const db = require('../../db');

describe('Message API', () => {

  let adminToken;
  let employeeToken;
  let messageId;

  beforeAll(async () => {
    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    adminToken = adminLogin.body.data.token;
  });

  afterAll(async () => {
    await db.pool.end();
  });

  describe('POST /api/messages/create', () => {

    test('should create message with valid data', async () => {
      const response = await request(app)
        .post('/api/messages/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Test Message',
          content: 'This is a test message',
          recipient_id: 1,
          message_type: 'general',
          priority: 'normal'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBeDefined();
      messageId = response.body.data.message.id;
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/messages/create')
        .send({
          subject: 'Test Message',
          content: 'This is a test message',
          recipient_id: 1
        });

      expect(response.status).toBe(401);
    });

    test('should fail with missing subject', async () => {
      const response = await request(app)
        .post('/api/messages/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'This is a test message',
          recipient_id: 1
        });

      expect(response.status).toBe(400);
    });

  });

  describe('GET /api/messages', () => {

    test('should get messages for authenticated user', async () => {
      const response = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.messages)).toBe(true);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/messages?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('total');
    });

  });

  describe('POST /api/messages/send/:id', () => {

    test('should send message successfully', async () => {
      // First create a message
      const createResponse = await request(app)
        .post('/api/messages/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Send Test',
          content: 'Testing send functionality',
          recipient_id: 1,
          priority: 'normal'
        });

      const msgId = createResponse.body.data.message.id;

      // Then send it
      const response = await request(app)
        .post(`/api/messages/send/${msgId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

  });

});
