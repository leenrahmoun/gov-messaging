# 🚀 Quick Testing Guide

## 5-Minute Setup

### 1. Install Test Dependencies

```bash
cd Back
npm install --save-dev jest supertest @jest/globals
```

### 2. Run Tests

```bash
# All tests
npm test

# Specific test file
npm test -- auth.test.js

# Watch mode (auto-rerun on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Test Files Available

| File | Tests | Purpose |
|------|-------|---------|
| `tests/auth.test.js` | 8 | Login, register, profile |
| `tests/users.test.js` | 3 | User management, recipients |
| `tests/messages.test.js` | 5 | Message CRUD, sending |
| `tests/approvals.test.js` | 5 | Approval workflow |

**Total: 21 test cases**

---

## Common Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (reruns on save)
npm run test:watch

# Run only auth tests
npm test -- auth.test.js

# Run with coverage
npm run test:coverage

# Run specific test case
npm test -- -t "should login with valid credentials"

# Run with verbose output
npm test -- --verbose

# Run single test file and exit
npm test -- auth.test.js --bail
```

---

## Test Results Interpretation

### Success Example

```
PASS  tests/auth.test.js
  Authentication API
    POST /api/auth/login
      ✓ should login with valid admin credentials (45ms)
      ✓ should fail with invalid password (12ms)
      ✓ should fail with non-existent user (10ms)
    POST /api/auth/register
      ✓ should register new user with valid data (78ms)
      ✓ should fail with weak password (8ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Time:        1.234s
```

### Failure Example

```
FAIL  tests/auth.test.js
  Authentication API
    POST /api/auth/login
      ✗ should login with valid admin credentials

  ● Authentication API › POST /api/auth/login › should login with valid admin credentials

    Expected: 200
    Received: 500

    Error: password authentication failed for user "postgres"
```

**Solution:** Check DATABASE_URL in `.env` file

---

## Coverage Report

Generate and view:

```bash
npm run test:coverage
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

Shows coverage % for:
- Statements: % of code executed
- Branches: % of if/else paths taken
- Functions: % of functions called
- Lines: % of lines executed

---

## Debugging Tests

### Add Debugging to Test

```javascript
test('should login', async () => {
  console.log('DEBUG: Starting login test');
  
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  
  console.log('DEBUG: Response status:', response.status);
  console.log('DEBUG: Response body:', response.body);
  
  expect(response.status).toBe(200);
});
```

Then run:
```bash
npm test -- auth.test.js --verbose
```

### Use Node Debugger

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome DevTools

---

## Common Issues

### Issue: "Cannot find module 'supertest'"

**Solution:**
```bash
npm install --save-dev supertest
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Kill process using port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Issue: "Database connection failed"

**Solution:** Check `.env` file has valid DATABASE_URL

### Issue: Tests timeout

**Solution:** Increase timeout in `tests/setup.js`:
```javascript
jest.setTimeout(15000); // 15 seconds
```

---

## Writing Your Own Tests

### Basic Template

```javascript
const request = require('supertest');
const app = require('../../server');

describe('My API Feature', () => {
  
  test('should do something', async () => {
    // Arrange
    const testData = { /* ... */ };
    
    // Act
    const response = await request(app)
      .post('/api/endpoint')
      .send(testData);
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

});
```

### Useful Assertions

```javascript
// Status codes
expect(response.status).toBe(200);

// Response structure
expect(response.body).toHaveProperty('success');
expect(response.body.data).toBeDefined();

// Arrays
expect(response.body.data).toBeInstanceOf(Array);
expect(response.body.data.length).toBeGreaterThan(0);

// Objects
expect(response.body.user).toHaveProperty('id');
expect(response.body.user.id).toMatch(/\d+/);

// Strings
expect(response.body.message).toMatch(/success/i);
```

---

## CI/CD Integration

Add to GitHub Actions (`.github/workflows/test.yml`):

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

---

## Next Steps

1. ✅ Run `npm test` to verify setup
2. ✅ Review test output and coverage
3. ✅ Add tests for your new features
4. ✅ Aim for >80% coverage
5. ✅ Run tests before each commit

---

**Happy Testing! 🎉**
