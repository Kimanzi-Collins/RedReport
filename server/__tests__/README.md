# Express File Upload Endpoint Tests

Comprehensive unit tests for Express endpoints that handle log file uploads using **multer with memoryStorage** and **Claude API integration** via the Anthropic SDK.

## Overview

The test suite (`__tests__/upload.test.js`) provides **25 passing tests** covering two critical endpoints:

- **POST /api/generate-report** - Analyzes security logs and generates executive reports
- **POST /api/analyze-timeline** - Reconstructs incident timelines from log data

## Test Coverage Summary

### ✅ Valid File Upload (4 tests)
- [x] Upload single log file and verify processing
- [x] Upload multiple files and verify combination
- [x] Handle UTF-8 encoding with special characters
- [x] Verify original filenames in combined logs

### ✅ Controller File Processing (2 tests)
- [x] Verify buffer is read correctly from memoryStorage
- [x] Confirm file metadata is preserved in API calls

### ✅ Mocked Claude API Integration (6 tests)
- [x] Mock Anthropic SDK without network calls
- [x] Verify correct model parameters (claude-3-5-sonnet-20240620)
- [x] Validate system prompts passed to Claude
- [x] Parse JSON responses from timeline analysis
- [x] Confirm no real API calls are made during tests
- [x] Handle trimmed/whitespace-padded responses

### ✅ Edge Cases & Error Handling (13 tests)
- [x] Reject requests with no files (400 error)
- [x] Handle empty file content gracefully
- [x] Process unsupported file formats as text
- [x] Support maximum file limit (5 files)
- [x] Handle API rate limiting errors (500)
- [x] Reject malformed JSON responses
- [x] Handle filenames with special characters
- [x] Return 400 when empty file array provided
- [x] Parse JSON with leading/trailing whitespace
- [x] Handle connection timeouts gracefully
- [x] Combine multiple file contents correctly

## Test Execution

### Run All Tests
```bash
cd server
npm test
```

### Watch Mode (Auto-rerun on file changes)
```bash
npm run test:watch
```

### Run with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- __tests__/upload.test.js
```

## How Mocking Works

### Anthropic SDK Mock
The test file mocks the Anthropic SDK **at module load time** before importing controllers:

```javascript
const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
    return {
        Anthropic: jest.fn().mockImplementation(() => ({
            messages: {
                create: mockCreate
            }
        }))
    };
});
```

This ensures:
- ✅ No real API calls to Claude (no network traffic)
- ✅ Full control over response values
- ✅ Ability to test error scenarios
- ✅ Consistent, fast test execution (~1.4 seconds)

### Mock Reset Between Tests
The `beforeEach` hook clears all mock calls:

```javascript
beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
    mockCreate.mockClear();
});
```

This prevents test pollution and ensures test isolation.

## Test Scenarios

### 1. Valid Log File Upload

**Test**: `should successfully upload a valid log file and process it`

```javascript
const mockLogContent = 'Log entry 1\nLog entry 2\nVulnerability found';
const response = await request(app)
    .post('/api/generate-report')
    .attach('logFiles', Buffer.from(mockLogContent), 'logs.txt');

expect(response.status).toBe(200);
expect(response.body.success).toBe(true);
expect(response.body.reportContent).toContain('Executive Summary');
```

Verifies:
- File is received by endpoint
- Buffer is processed correctly
- Response includes mocked report content
- HTTP 200 status

### 2. Multiple File Combination

**Test**: `should correctly read file from memory and combine multiple files`

```javascript
const response = await request(app)
    .post('/api/generate-report')
    .attach('logFiles', Buffer.from('First file log data'), 'logs1.txt')
    .attach('logFiles', Buffer.from('Second file log data'), 'logs2.txt');

// Verify both files are included in API call
const callArgs = mockCreate.mock.calls[0][0];
const userContent = callArgs.messages[0].content;
expect(userContent).toContain('First file log data');
expect(userContent).toContain('Second file log data');
```

Verifies:
- Multiple files uploaded via array
- Files combined in memory
- Original filenames preserved
- Correct formatting for Claude

### 3. Mocked Claude API

**Test**: `should mock Anthropic API and return dummy JSON response`

```javascript
const dummyReport = '# Security Report\n## Findings\nNo vulnerabilities detected.';
mockCreate.mockResolvedValue({
    content: [{ text: dummyReport }]
});

const response = await request(app)
    .post('/api/generate-report')
    .attach('logFiles', Buffer.from('Sample logs'), 'logs.txt');

expect(response.body.reportContent).toBe(dummyReport);
expect(mockCreate).toHaveBeenCalled();
```

Verifies:
- Mock intercepts API call
- Dummy response returned immediately
- No network activity occurs
- Controller processes mock response correctly

### 4. Edge Case: No Files Provided

**Test**: `should return 400 when no files are provided`

```javascript
const response = await request(app)
    .post('/api/generate-report')
    .send({});

expect(response.status).toBe(400);
expect(response.body.error).toContain('No log files provided');
```

Verifies:
- Endpoint validates file presence
- Returns proper HTTP 400 error
- Error message is descriptive

### 5. Edge Case: API Error Handling

**Test**: `should handle API errors and return 500 status`

```javascript
mockCreate.mockRejectedValue(
    new Error('API rate limit exceeded')
);

const response = await request(app)
    .post('/api/generate-report')
    .attach('logFiles', Buffer.from('Logs'), 'logs.txt');

expect(response.status).toBe(500);
expect(response.body.error).toBe('Failed to generate report');
expect(response.body.details).toContain('API rate limit exceeded');
```

Verifies:
- Errors are caught and handled
- Error details logged in response
- Appropriate HTTP 500 status
- Error message passed through

## File Structure

```
server/
├── __tests__/
│   └── upload.test.js           # Main test file (21KB, 25 tests)
├── controllers/
│   ├── reportController.js       # Generates security reports
│   ├── timelineController.js     # Reconstructs incident timelines
│   ├── mitreController.js
│   └── blueprintController.js
├── index.js                      # Express app setup with routes
├── package.json                  # Dependencies: jest, supertest
└── .env                          # API keys (ANTHROPIC_API_KEY)
```

## Dependencies

### Test Framework
- **Jest** (^29.7.0) - Test runner and assertion library
- **Supertest** (^6.3.3) - HTTP assertion library for testing Express apps

### Application Dependencies
- **Express** (^5.2.1) - Web framework
- **Multer** (^2.1.1) - File upload middleware
- **@anthropic-ai/sdk** (^0.100.1) - Claude API client
- **CORS** (^2.8.6) - Cross-origin support
- **dotenv** (^17.4.2) - Environment variables

## Installation & Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

This installs:
- Jest and Supertest in devDependencies
- All application dependencies

### 2. Create .env File (if needed for local testing)
```bash
ANTHROPIC_API_KEY=your_api_key_here
PORT=5000
```

**Note**: Tests don't require a real API key since the Anthropic SDK is mocked.

### 3. Run Tests
```bash
npm test
```

## Test Output Example

```
 PASS  __tests__/upload.test.js

  Express File Upload Endpoints
    POST /api/generate-report
      Valid file upload
        ✓ should successfully upload a valid log file and process it (57 ms)
        ✓ should correctly read file from memory and combine multiple files (6 ms)
      Controller processes file from memory
        ✓ should read file buffer correctly and convert to UTF-8 string (6 ms)
        ✓ should include original filename in the combined logs (5 ms)
      Mocked Claude API calls
        ✓ should mock Anthropic API and return dummy JSON response (6 ms)
        ✓ should pass correct system prompt to Claude (5 ms)
        ✓ should not make network calls when API is mocked (6 ms)
      Edge cases
        ✓ should return 400 when no files are provided (14 ms)
        ✓ should return 400 when empty file array is provided (5 ms)
        ✓ should handle empty file content gracefully (7 ms)
        ...
    POST /api/analyze-timeline
      ...

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        1.427 s, estimated 2 s
```

## Key Testing Patterns

### 1. Buffer Attachment with Supertest
```javascript
await request(app)
    .post('/api/generate-report')
    .attach('logFiles', Buffer.from(mockLogContent), 'logs.txt');
```

### 2. Mock Assertion
```javascript
expect(mockCreate).toHaveBeenCalledWith(
    expect.objectContaining({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2500
    })
);
```

### 3. Inspecting Mock Call Arguments
```javascript
const callArgs = mockCreate.mock.calls[0][0];
const userContent = callArgs.messages[0].content;
expect(userContent).toContain('expected content');
```

### 4. Error Simulation
```javascript
mockCreate.mockRejectedValue(new Error('Timeout'));
const response = await request(app).post('/api/endpoint').attach(...);
expect(response.status).toBe(500);
```

## Extending the Tests

### Add a New Endpoint Test
```javascript
describe('POST /api/new-endpoint', () => {
    it('should test new functionality', async () => {
        mockCreate.mockResolvedValue({
            content: [{ text: 'Mock response' }]
        });

        const response = await request(app)
            .post('/api/new-endpoint')
            .attach('logFiles', Buffer.from('Test data'), 'test.txt');

        expect(response.status).toBe(200);
    });
});
```

### Test Additional Error Scenarios
```javascript
it('should handle network timeout', async () => {
    mockCreate.mockRejectedValue(new Error('Network timeout'));
    const response = await request(app).post('/api/generate-report')...;
    expect(response.status).toBe(500);
});
```

## Best Practices Applied

✅ **Isolation**: Each test is independent with `beforeEach` reset  
✅ **Clarity**: Descriptive test names explain what's being tested  
✅ **Coverage**: Tests cover happy paths and edge cases  
✅ **Mocking**: External APIs mocked to avoid network dependency  
✅ **Assertions**: Multiple assertions per test for thorough validation  
✅ **Error Handling**: Tests verify graceful error responses  
✅ **Documentation**: Clear comments explaining test logic  

## Troubleshooting

### Tests Not Running
```bash
# Ensure dependencies are installed
npm install

# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose
```

### Mock Not Working
- Ensure mock is defined before importing controllers
- Clear mocks between tests with `beforeEach`
- Verify mock function names match actual calls

### Port Conflict
- Supertest uses ephemeral ports, no conflict expected
- If issues occur, check no other services on port 5000

## Summary

This comprehensive test suite ensures:

1. ✅ **File uploads work correctly** with multer memoryStorage
2. ✅ **Buffers are processed** without writing to disk
3. ✅ **Claude API calls are mocked** (no network dependency)
4. ✅ **Edge cases are handled** gracefully
5. ✅ **Error responses** are proper HTTP status codes
6. ✅ **Multiple files** combine correctly
7. ✅ **System prompts** are passed to Claude correctly

All 25 tests pass in ~1.4 seconds, providing fast, reliable feedback during development.
