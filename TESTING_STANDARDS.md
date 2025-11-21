# 🧪 Testing Standards & Framework

## Overview

This document outlines the comprehensive testing framework for the Gov Messaging project, covering unit tests, integration tests, and end-to-end tests.

---

## 📊 Testing Pyramid

```
          E2E Tests (10%)
       /      |      \
      /       |       \
   Integration Tests (30%)
   /         |         \
  /          |          \
Unit Tests (60%)
```

---

## 🏗️ Backend Testing

### Setup

Install testing dependencies:
```bash
cd Back
npm install --save-dev jest supertest @jest/globals
```

### Test Structure

```
Back/tests/
├── setup.js              # Jest setup file
├── auth.test.js          # Authentication tests
├── users.test.js         # User management tests
├── messages.test.js      # Message API tests
├── approvals.test.js     # Approval workflow tests
├── e2e/
│   └── manual-tests.js   # Manual E2E test scenarios
└── fixtures/
    └── test-data.json    # Test data
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

### Test Categories

#### 1. **Unit Tests** (60%)
Test individual functions in isolation.

**Example:**
```javascript
test('should hash password correctly', async () => {
  const password = 'test123';
  const hash = await bcrypt.hash(password, 10);
  expect(await bcrypt.compare(password, hash)).toBe(true);
});
```

**Coverage Areas:**
- Password hashing (bcryptjs)
- JWT token creation/validation
- Role normalization
- Data validation functions
- Error handling

#### 2. **Integration Tests** (30%)
Test multiple components working together.

**Example:**
```javascript
test('should login and return valid JWT token', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  
  expect(response.status).toBe(200);
  expect(response.body.data.token).toBeDefined();
  expect(jwt.verify(response.body.data.token, process.env.JWT_SECRET)).toBeDefined();
});
```

**Coverage Areas:**
- Authentication flow (login → JWT → profile access)
- Message creation → approval → sending workflow
- Database operations with API
- Permission checks across routes

#### 3. **End-to-End Tests** (10%)
Test complete user workflows.

**Example:**
```javascript
// 1. Employee creates message
// 2. Manager reviews and approves
// 3. Admin sends to recipient
// 4. Verify audit log
```

**Coverage Areas:**
- Complete message lifecycle
- Role-based access control
- Department-based recipient filtering
- Approval chain (Employee → Manager → Admin)

---

## 🧪 Test Cases

### Authentication Tests (`auth.test.js`)

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Login with valid admin credentials | Returns JWT token | ✅ |
| Login with invalid password | Returns 401 Unauthorized | ✅ |
| Login with non-existent user | Returns 401 Unauthorized | ✅ |
| Register with valid data | Creates user, returns 201 | ✅ |
| Register with weak password | Returns 400 Bad Request | ✅ |
| Register with invalid email | Returns 400 Bad Request | ✅ |
| Get profile with valid token | Returns user data | ✅ |
| Get profile without token | Returns 401 Unauthorized | ✅ |

### User Tests (`users.test.js`)

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Get all users as admin | Returns user list | ✅ |
| Get recipients filtered by role | Returns role-based recipients | ✅ |
| Get recipients without auth | Returns 401 Unauthorized | ✅ |

### Message Tests (`messages.test.js`)

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Create message with valid data | Returns 201 Created | ✅ |
| Send message successfully | Updates status to "sent" | ✅ |
| Get messages with pagination | Returns paginated results | ✅ |
| Delete own message | Returns 200 OK | ✅ |

### Approval Tests (`approvals.test.js`)

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Manager approves message | Updates approval status | ✅ |
| Manager rejects message | Returns rejection reason | ✅ |
| Employee cannot approve | Returns 403 Forbidden | ✅ |

---

## 📋 Coverage Goals

### Target Coverage

- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

### Current Coverage

Run to check:
```bash
npm run test:coverage
```

### Critical Paths (Must Cover 100%)

1. ✅ Authentication (login, token validation)
2. ✅ Authorization (role checks)
3. ✅ Data validation (input sanitization)
4. ✅ Error handling (exception cases)
5. ✅ Database operations (CRUD operations)

---

## 🔍 Test Writing Guidelines

### Best Practices

1. **Descriptive Test Names**
   ```javascript
   // ✅ Good
   test('should return 401 when login with invalid password', () => {});
   
   // ❌ Bad
   test('login fails', () => {});
   ```

2. **Arrange-Act-Assert Pattern**
   ```javascript
   test('example', async () => {
     // Arrange
     const testData = { username: 'admin', password: 'admin123' };
     
     // Act
     const response = await request(app)
       .post('/api/auth/login')
       .send(testData);
     
     // Assert
     expect(response.status).toBe(200);
   });
   ```

3. **Test One Thing**
   ```javascript
   // ✅ Good - tests one specific behavior
   test('should return 400 with missing username', async () => {
     const response = await request(app).post('/api/auth/login').send({});
     expect(response.status).toBe(400);
   });
   
   // ❌ Bad - tests multiple things
   test('should validate login fields', async () => {
     // Too many assertions, multiple behaviors
   });
   ```

4. **Use Fixtures for Test Data**
   ```javascript
   const testUser = require('../fixtures/test-data.json').users[0];
   ```

5. **Clean Up After Tests**
   ```javascript
   afterEach(async () => {
     // Clean up test data
     await db.query('DELETE FROM test_table');
   });
   ```

---

## 🚀 Frontend Testing

### Setup

```bash
cd Front
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Test Files

```
Front/src/__tests__/
├── components/
│   ├── LoginForm.test.jsx
│   ├── MessageCard.test.jsx
│   └── ApprovalQueue.test.jsx
├── pages/
│   ├── Dashboard.test.jsx
│   ├── Compose.test.jsx
│   └── Approvals.test.jsx
└── utils/
    └── api.test.jsx
```

### Running Frontend Tests

```bash
npm run test
npm run test:watch
npm run test:coverage
```

---

## 🔗 End-to-End Testing

### Manual E2E Test Scenarios

**File:** `Back/tests/e2e/manual-tests.js`

#### Scenario 1: Complete Message Workflow

```
1. Admin logs in
2. Admin creates message for Manager
3. Manager logs in, reviews message
4. Manager approves message
5. Message automatically sent
6. Verify audit log entry
```

#### Scenario 2: Department-Based Filtering

```
1. Employee from HR logs in
2. Gets recipients list
3. Should only see: HR Manager + Admins
4. Should NOT see: Finance/IT employees
```

#### Scenario 3: Role-Based Access Control

```
1. Employee tries to access /api/audit → 403
2. Manager tries to approve message from other dept → 403
3. Admin accesses all endpoints → 200
```

---

## 📊 Running All Tests

```bash
# Backend tests
cd Back
npm test                    # Run all tests
npm run test:coverage       # Generate coverage report
npm run test:e2e           # Run E2E tests

# Frontend tests
cd Front
npm run test               # Run component tests
npm run test:coverage      # Generate coverage report

# Full project test
npm test --workspaces     # Run all tests in both directories
```

---

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Backend Tests
        run: |
          cd Back
          npm install
          npm run test:coverage
      
      - name: Frontend Tests
        run: |
          cd Front
          npm install
          npm test
```

---

## 🐛 Debugging Tests

### Run Single Test File

```bash
npm test -- auth.test.js
```

### Run with Verbose Output

```bash
npm test -- --verbose
```

### Debug in Chrome DevTools

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect`

---

## 📝 Test Results & Reports

### Generate Coverage Report

```bash
npm run test:coverage
```

Creates `coverage/` directory with HTML report:
```
coverage/
├── index.html
├── controllers/
├── routes/
└── middleware/
```

Open `coverage/index.html` in browser to view detailed coverage.

---

## ✅ Checklist for New Features

Before merging new code:

- [ ] All unit tests pass (`npm test`)
- [ ] Coverage maintained or improved (≥ 80%)
- [ ] Integration tests written for API endpoints
- [ ] E2E scenarios tested manually
- [ ] No console errors or warnings
- [ ] Database migrations tested
- [ ] Error cases handled
- [ ] Security checks passed
- [ ] Performance acceptable (< 500ms per request)

---

## 🔗 Related Documentation

- `STARTUP_GUIDE.md` — Project setup
- `IMPLEMENTATION_SUMMARY.md` — Feature implementation details
- `TROUBLESHOOTING.md` — Common issues and solutions

---

**Version:** 1.0.0
**Last Updated:** November 18, 2025
**Maintained By:** Development Team
