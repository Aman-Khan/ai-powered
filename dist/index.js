"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import 'dotenv/config' to load environment variables from .env file
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const generative_ai_1 = require("@google/generative-ai");
// Initialize the Express application
const app = (0, express_1.default)();
// Define the port, using process.env.PORT for flexibility (e.g., for deployment) or default to 3000
const port = process.env.PORT || 3000;
// Middleware: Enable JSON body parsing for incoming requests.
// This is essential for handling POST requests with JSON payloads.
app.use(express_1.default.json());
// --- Routes ---
// GET /
// A basic health check or welcome route to confirm the server is running.
app.get('/', (req, res) => {
    res.send('Hello from the Express & TypeScript backend!');
});
// POST /api/generate
// This endpoint handles requests to generate content using the Gemini API.
app.post('/api/generate', async (req, res) => {
    // Retrieve the Gemini API key from environment variables.
    const apiKey = process.env.GEMINI_API_KEY;
    // Validate if the API key is provided.
    if (!apiKey) {
        console.error('Error: GEMINI_API_KEY is not set. Please ensure it is configured in your .env file.');
        // Send a 500 Internal Server Error response if the API key is missing.
        return res.status(500).json({ error: 'Server configuration error: Gemini API key is missing.' });
    }
    // Extract the 'text' field from the request body.
    // This 'text' will be the prompt sent to the Gemini model.
    const userInput = req.body.text;
    // Validate if the user input text is provided.
    if (!userInput) {
        // Send a 400 Bad Request response if the 'text' field is missing.
        return res.status(400).json({ error: 'Bad Request: Please provide a "text" field in the JSON body.' });
    }
    try {
        // Initialize the Google Generative AI client with the API key.
        const genAI = new generative_ai_1.GoogleGenerativeAI({ apiKey });
        // Define the model configuration.
        // 'gemini-2.5-pro' is specified in your original code.
        const modelId = 'gemini-2.5-pro';
        const generationConfig = {
            // 'thinkingBudget: -1' from your original code.
            // Note: `thinkingConfig` is not a standard property in `GenerateContentStreamRequest`.
            // The `thinkingBudget` might be an internal or deprecated setting.
            // For standard usage, you typically focus on `temperature`, `topK`, `topP`, `maxOutputTokens`.
            // I've kept it as `any` to match your original structure, but be aware it might not be recognized.
            // A more common setup would be:
            // temperature: 0.7,
            // maxOutputTokens: 200,
            responseMimeType: 'text/plain', // Cast to any to satisfy the type if it's not a direct enum
        };
        // Prepare the content for the API request.
        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        text: userInput, // The user's prompt
                    },
                ],
            },
        ];
        // Call the Gemini API to generate content.
        // Using `generateContentStream` for streaming responses, as in your original code.
        const responseStream = genAI.getGenerativeModel({ model: modelId }).generateContentStream({
            contents,
            generationConfig: generationConfig // Cast to any due to custom thinkingConfig
        });
        // Collect all streamed chunks to form the complete response text.
        let fullResponseText = '';
        for await (const chunk of responseStream.stream) {
            if (chunk.text) { // Ensure the chunk has text content
                fullResponseText += chunk.text;
            }
        }
        // Send the collected AI-generated response back to the client.
        res.json({ generatedText: fullResponseText });
    }
    catch (error) {
        // Log the error for debugging purposes on the server side.
        console.error('Error calling Gemini API:', error);
        // Send a 500 Internal Server Error response to the client.
        res.status(500).json({ error: 'An error occurred while generating content from the Gemini API.' });
    }
});
// Start the Express server and listen on the specified port.
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
