// Import 'dotenv/config' to load environment variables from .env file
import 'dotenv/config'; 
import express, { Express, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Express application
const app: Express = express();
// Define the port, using process.env.PORT for flexibility (e.g., for deployment) or default to 3000
const port = process.env.PORT || 3000;

// Middleware: Enable JSON body parsing for incoming requests.
// This is essential for handling POST requests with JSON payloads.
app.use(express.json());

// --- Routes ---

// GET /
// A basic health check or welcome route to confirm the server is running.
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the Express & TypeScript backend!');
});

// POST /api/generate
// This endpoint handles requests to generate content using the Gemini API.
app.post('/api/generate', async (req: Request, res: Response) => {
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
  const userInput: string = req.body.text;

  // Validate if the user input text is provided.
  if (!userInput) {
    // Send a 400 Bad Request response if the 'text' field is missing.
    return res.status(400).json({ error: 'Bad Request: Please provide a "text" field in the JSON body.' });
  }

  try {
    // Initialize the Google Generative AI client with the API key.
    const genAI = new GoogleGenerativeAI(apiKey); 
    
    // Define the model configuration.
    const modelId = 'gemini-2.5-pro';
    const generationConfig = {
      // The 'thinkingBudget: -1' is not a standard configuration property for the public API.
      // It's cast to 'any' to avoid type errors, but it's recommended to remove
      // if it causes issues or isn't officially supported.
      responseMimeType: 'text/plain' as any, 
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
    // The 'await' keyword ensures the promise resolves before accessing '.stream'.
    const response = await genAI.getGenerativeModel({ model: modelId }).generateContentStream({
      contents,
      generationConfig: generationConfig as any 
    });

    // Collect all streamed chunks to form the complete response text.
    let fullResponseText = '';
    // Iterate over the 'stream' property of the awaited 'response' object.
    for await (const chunk of response.stream) { 
      // FIX: Use chunk.text() method to correctly extract the text content from the chunk.
      if (chunk.text()) { 
        fullResponseText += chunk.text();
      }
    }

    // Send the collected AI-generated response back to the client.
    res.json({ generatedText: fullResponseText });
  } catch (error) {
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
