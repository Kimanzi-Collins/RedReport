const mockAnthropicCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => ({
    Anthropic: jest.fn().mockImplementation(() => ({
        messages: { create: mockAnthropicCreate }
    }))
}));

const mockGenerateContent = jest.fn();
jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({ generateContent: mockGenerateContent })
    }))
}));

const { generateWithFailover } = require('../services/llmService');

describe('generateWithFailover', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.USE_DEMO_MODE = 'false';
        process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
        process.env.GEMINI_API_KEY = 'test-gemini-key';
        process.env.NVIDIA_API_KEY = 'test-nvidia-key';
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('tries Claude first when no preferred provider is given', async () => {
        mockAnthropicCreate.mockResolvedValue({ content: [{ type: 'text', text: 'claude response' }] });

        const result = await generateWithFailover('system prompt', 'user prompt');

        expect(result).toBe('claude response');
        expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
        expect(mockGenerateContent).not.toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('falls over to Gemini when Claude fails', async () => {
        mockAnthropicCreate.mockRejectedValue(new Error('HTTP_529'));
        mockGenerateContent.mockResolvedValue({ response: { text: () => 'gemini response' } });

        const result = await generateWithFailover('system prompt', 'user prompt');

        expect(result).toBe('gemini response');
        expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('falls over to NVIDIA when Claude and Gemini both fail', async () => {
        mockAnthropicCreate.mockRejectedValue(new Error('HTTP_500'));
        mockGenerateContent.mockRejectedValue(new Error('quota exceeded'));
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ choices: [{ message: { content: 'nvidia response' } }] })
        });

        const result = await generateWithFailover('system prompt', 'user prompt');

        expect(result).toBe('nvidia response');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('throws only after every engine fails', async () => {
        mockAnthropicCreate.mockRejectedValue(new Error('HTTP_500'));
        mockGenerateContent.mockRejectedValue(new Error('quota exceeded'));
        global.fetch.mockResolvedValue({ ok: false, status: 503 });

        await expect(generateWithFailover('system prompt', 'user prompt'))
            .rejects.toThrow('AI engine not functional');
    });

    it('does not hang forever when a provider stalls — aborts within the timeout and fails over', async () => {
        jest.useFakeTimers({ advanceTimers: true });

        // Simulate NVIDIA hanging indefinitely: the fetch promise only ever
        // settles if its AbortSignal fires, exactly like a real stalled request.
        global.fetch.mockImplementation((url, options) => new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => {
                const err = new Error('The operation was aborted');
                err.name = 'AbortError';
                reject(err);
            });
        }));
        mockAnthropicCreate.mockResolvedValue({ content: [{ type: 'text', text: 'claude saved it' }] });

        const resultPromise = generateWithFailover('system prompt', 'user prompt', 'nvidia');

        // Advance past the 10s per-provider timeout so NVIDIA's AbortController fires.
        await jest.advanceTimersByTimeAsync(10000);

        const result = await resultPromise;

        expect(result).toBe('claude saved it');
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
    }, 15000);
});
