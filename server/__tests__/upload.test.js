const request = require('supertest');
const express = require('express');
const multer = require('multer');

// Mock the Anthropic SDK before importing controllers
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

// Import controllers AFTER mocking
const { generateReport } = require('../controllers/reportController');
const { analyzeTimeline } = require('../controllers/timelineController');

// Setup Express app with multer for testing
const setupApp = () => {
    const app = express();
    app.use(express.json());
    
    const storage = multer.memoryStorage();
    const upload = multer({ storage });
    
    app.post('/api/generate-report', upload.array('logFiles', 5), generateReport);
    app.post('/api/analyze-timeline', upload.array('logFiles', 5), analyzeTimeline);
    
    return app;
};

describe('Express File Upload Endpoints', () => {
    let app;

    beforeEach(() => {
        app = setupApp();
        jest.clearAllMocks();
        mockCreate.mockClear();
    });

    describe('POST /api/generate-report', () => {
        // ==================== VALID FILE UPLOAD ====================
        describe('Valid file upload', () => {
            it('should successfully upload a valid log file and process it', async () => {
                const mockLogContent = 'Log entry 1\nLog entry 2\nVulnerability found';
                const mockResponse = {
                    content: [
                        {
                            text: '# RedReport AI Confidential Security Report\n\n## Executive Summary\nTest report'
                        }
                    ]
                };

                mockCreate.mockResolvedValue(mockResponse);

                const response = await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from(mockLogContent), 'logs.txt');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.reportContent).toContain('Executive Summary');
                expect(mockCreate).toHaveBeenCalledTimes(1);
                expect(mockCreate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        model: 'claude-3-5-sonnet-20240620',
                        max_tokens: 2500,
                        temperature: 0.2
                    })
                );
            });

            it('should correctly read file from memory and combine multiple files', async () => {
                const mockLogContent1 = 'First file log data';
                const mockLogContent2 = 'Second file log data';
                const mockResponse = {
                    content: [
                        {
                            text: '# Report combining multiple files'
                        }
                    ]
                };

                mockCreate.mockResolvedValue(mockResponse);

                const response = await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from(mockLogContent1), 'logs1.txt')
                    .attach('logFiles', Buffer.from(mockLogContent2), 'logs2.txt');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                
                // Verify that both file contents are passed to the API
                const callArgs = mockCreate.mock.calls[0][0];
                const userContent = callArgs.messages[0].content;
                expect(userContent).toContain('First file log data');
                expect(userContent).toContain('Second file log data');
                expect(userContent).toContain('--- File: logs1.txt ---');
                expect(userContent).toContain('--- File: logs2.txt ---');
            });
        });

        // ==================== CONTROLLER PROCESSES FILE CORRECTLY ====================
        describe('Controller processes file from memory', () => {
            it('should read file buffer correctly and convert to UTF-8 string', async () => {
                const mockLogContent = 'Test log content with special chars: 🔐';
                const mockResponse = {
                    content: [{ text: '# Test Report' }]
                };

                mockCreate.mockResolvedValue(mockResponse);

                await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from(mockLogContent, 'utf-8'), 'logs.txt');

                const callArgs = mockCreate.mock.calls[0][0];
                const userContent = callArgs.messages[0].content;
                expect(userContent).toContain('Test log content with special chars: 🔐');
            });

            it('should include original filename in the combined logs', async () => {
                const mockLogContent = 'Test content';
                const mockResponse = {
                    content: [{ text: '# Report' }]
                };

                mockCreate.mockResolvedValue(mockResponse);

                await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from(mockLogContent), 'custom-filename.log');

                const callArgs = mockCreate.mock.calls[0][0];
                const userContent = callArgs.messages[0].content;
                expect(userContent).toContain('--- File: custom-filename.log ---');
            });
        });

        // ==================== MOCKED CLAUDE API ====================
        describe('Mocked Claude API calls', () => {
            it('should mock Anthropic API and return dummy JSON response', async () => {
                const dummyReport = '# Security Report\n## Findings\nNo vulnerabilities detected.';
                mockCreate.mockResolvedValue({
                    content: [{ text: dummyReport }]
                });

                const response = await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from('Sample logs'), 'logs.txt');

                expect(response.status).toBe(200);
                expect(response.body.reportContent).toBe(dummyReport);
                expect(mockCreate).toHaveBeenCalled();
            });

            it('should pass correct system prompt to Claude', async () => {
                mockCreate.mockResolvedValue({
                    content: [{ text: '# Report' }]
                });

                await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from('Logs'), 'test.log');

                const callArgs = mockCreate.mock.calls[0][0];
                expect(callArgs.system).toContain('Red Team Operator');
                expect(callArgs.system).toContain('Executive Summary');
                expect(callArgs.system).toContain('Remediation Roadmap');
            });

            it('should not make network calls when API is mocked', async () => {
                mockCreate.mockResolvedValue({
                    content: [{ text: '# Mocked Report' }]
                });

                await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from('Test'), 'test.txt');

                expect(mockCreate).toHaveBeenCalled();
            });
        });

        // ==================== EDGE CASES ====================
        describe('Edge cases', () => {
            it('should return 400 when no files are provided', async () => {
                const response = await request(app)
                    .post('/api/generate-report')
                    .send({});

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('No log files provided');
            });

            it('should return 400 when empty file array is provided', async () => {
                const response = await request(app)
                    .post('/api/generate-report')
                    .field('logFiles', []);

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('No log files provided');
            });

            it('should handle empty file content gracefully', async () => {
                const mockResponse = {
                    content: [{ text: '# Report for empty logs' }]
                };

                mockCreate.mockResolvedValue(mockResponse);

                const response = await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from(''), 'empty-logs.txt');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                
                const callArgs = mockCreate.mock.calls[0][0];
                const userContent = callArgs.messages[0].content;
                expect(userContent).toContain('--- File: empty-logs.txt ---');
            });

            it('should reject unsupported file formats silently (but process them as text)', async () => {
                const mockResponse = {
                    content: [{ text: '# Binary file analysis' }]
                };

                mockCreate.mockResolvedValue(mockResponse);

                // Multer processes all files, but binary data will be garbled
                const response = await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), 'image.jpg');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should handle files at maximum size limit (5 files)', async () => {
                const mockResponse = {
                    content: [{ text: '# Report for 5 files' }]
                };

                mockCreate.mockResolvedValue(mockResponse);

                const response = await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from('File 1'), 'logs1.txt')
                    .attach('logFiles', Buffer.from('File 2'), 'logs2.txt')
                    .attach('logFiles', Buffer.from('File 3'), 'logs3.txt')
                    .attach('logFiles', Buffer.from('File 4'), 'logs4.txt')
                    .attach('logFiles', Buffer.from('File 5'), 'logs5.txt');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should handle API errors and return 500 status', async () => {
                mockCreate.mockRejectedValue(
                    new Error('API rate limit exceeded')
                );

                const response = await request(app)
                    .post('/api/generate-report')
                    .attach('logFiles', Buffer.from('Logs'), 'logs.txt');

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('Failed to generate report');
                expect(response.body.details).toContain('API rate limit exceeded');
            });
        });
    });

    describe('POST /api/analyze-timeline', () => {
        // ==================== VALID FILE UPLOAD ====================
        describe('Valid file upload', () => {
            it('should successfully upload a log file and analyze timeline', async () => {
                const mockLogContent = '[12:00:00] Attack detected\n[12:05:00] System compromised';
                const mockTimelineData = [
                    {
                        timestamp: '12:00:00',
                        event: 'Attack Detected',
                        sourceIp: '192.168.1.100',
                        targetIp: '10.0.0.1',
                        severity: 'Critical',
                        details: 'Unauthorized access attempt detected'
                    },
                    {
                        timestamp: '12:05:00',
                        event: 'System Compromised',
                        sourceIp: '192.168.1.100',
                        targetIp: '10.0.0.1',
                        severity: 'Critical',
                        details: 'Attacker gained system access'
                    }
                ];

                mockCreate.mockResolvedValue({
                    content: [{ text: JSON.stringify(mockTimelineData) }]
                });

                const response = await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from(mockLogContent), 'logs.txt');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data.length).toBe(2);
                expect(response.body.data[0].event).toBe('Attack Detected');
            });
        });

        // ==================== CONTROLLER PROCESSES FILE CORRECTLY ====================
        describe('Controller processes file from memory', () => {
            it('should read file buffer and extract content correctly', async () => {
                const mockLogContent = 'Timeline data';
                const mockTimelineData = [];

                mockCreate.mockResolvedValue({
                    content: [{ text: JSON.stringify(mockTimelineData) }]
                });

                await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from(mockLogContent), 'logs.txt');

                const callArgs = mockCreate.mock.calls[0][0];
                const userContent = callArgs.messages[0].content;
                expect(userContent).toContain('Timeline data');
            });
        });

        // ==================== MOCKED CLAUDE API ====================
        describe('Mocked Claude API calls', () => {
            it('should mock Anthropic API and parse JSON timeline response', async () => {
                const dummyTimeline = JSON.stringify([
                    {
                        timestamp: '2026-01-01 00:00:00',
                        event: 'Incident Start',
                        sourceIp: '10.0.0.1',
                        targetIp: '10.0.0.2',
                        severity: 'High',
                        details: 'Initial compromise'
                    }
                ]);

                mockCreate.mockResolvedValue({
                    content: [{ text: dummyTimeline }]
                });

                const response = await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from('Sample logs'), 'logs.txt');

                expect(response.status).toBe(200);
                expect(response.body.data).toEqual(JSON.parse(dummyTimeline));
                expect(mockCreate).toHaveBeenCalled();
            });

            it('should pass timeline-specific system prompt to Claude', async () => {
                mockCreate.mockResolvedValue({
                    content: [{ text: '[]' }]
                });

                await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from('Logs'), 'test.log');

                const callArgs = mockCreate.mock.calls[0][0];
                expect(callArgs.system).toContain('Incident Response Analyst');
                expect(callArgs.system).toContain('JSON array');
                expect(callArgs.system).toContain('chronologically');
                expect(callArgs.temperature).toBe(0.1);
            });

            it('should return mocked JSON without making real network calls', async () => {
                mockCreate.mockResolvedValue({
                    content: [{ text: '[]' }]
                });

                await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from('Test'), 'test.txt');

                expect(mockCreate).toHaveBeenCalled();
            });
        });

        // ==================== EDGE CASES ====================
        describe('Edge cases', () => {
            it('should return 400 when no files are provided', async () => {
                const response = await request(app)
                    .post('/api/analyze-timeline')
                    .send({});

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('No data files provided for timeline analysis');
            });

            it('should handle empty file content', async () => {
                mockCreate.mockResolvedValue({
                    content: [{ text: '[]' }]
                });

                const response = await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from(''), 'empty.txt');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should reject malformed JSON response from Claude', async () => {
                mockCreate.mockResolvedValue({
                    content: [{ text: 'Invalid JSON not an array' }]
                });

                const response = await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from('Logs'), 'logs.txt');

                expect(response.status).toBe(500);
                expect(response.body.error).toContain('Failed to analyze incident timeline');
            });

            it('should handle files with special characters in names', async () => {
                mockCreate.mockResolvedValue({
                    content: [{ text: '[]' }]
                });

                const response = await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from('Data'), 'logs-[2026-01-01].txt');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should parse timeline with trimmed JSON response', async () => {
                const timelineJson = JSON.stringify([
                    {
                        timestamp: '2026-01-01',
                        event: 'Test',
                        sourceIp: '1.1.1.1',
                        targetIp: '2.2.2.2',
                        severity: 'Low',
                        details: 'Test event'
                    }
                ]);

                mockCreate.mockResolvedValue({
                    content: [{ text: `  ${timelineJson}  ` }]
                });

                const response = await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from('Test'), 'test.txt');

                expect(response.status).toBe(200);
                expect(response.body.data[0].timestamp).toBe('2026-01-01');
            });

            it('should handle API errors gracefully', async () => {
                mockCreate.mockRejectedValue(
                    new Error('Connection timeout')
                );

                const response = await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from('Logs'), 'logs.txt');

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('Failed to analyze incident timeline');
                expect(response.body.details).toContain('Connection timeout');
            });

            it('should combine multiple file contents in timeline analysis', async () => {
                mockCreate.mockResolvedValue({
                    content: [{ text: '[]' }]
                });

                const response = await request(app)
                    .post('/api/analyze-timeline')
                    .attach('logFiles', Buffer.from('Log 1'), 'logs1.txt')
                    .attach('logFiles', Buffer.from('Log 2'), 'logs2.txt');

                expect(response.status).toBe(200);
                const callArgs = mockCreate.mock.calls[0][0];
                const userContent = callArgs.messages[0].content;
                expect(userContent).toContain('Log 1');
                expect(userContent).toContain('Log 2');
            });
        });
    });
});
