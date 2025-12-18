const { GoogleGenAI } = require("@google/genai");

// Initialize Google Generative AI with the dedicated analyzer API key
// Updated to use the latest API key for better quota management
// Added improved error handling for rate limiting and API errors
// Implemented caching and request throttling to prevent rate limiting
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_ANALYZER_API_KEY });

// Simple in-memory cache for complexity analysis results
const analysisCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track request timestamps for basic rate limiting
const requestTimestamps = [];

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  // Remove expired cache entries
  for (const [key, value] of analysisCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      analysisCache.delete(key);
    }
  }
  
  // Keep only recent request timestamps (last 10 minutes)
  const tenMinutesAgo = now - 10 * 60 * 1000;
  requestTimestamps.splice(0, requestTimestamps.findIndex(ts => ts > tenMinutesAgo));
}, 60 * 1000); // Run cleanup every minute

// Controller for complexity analysis
// This controller analyzes the time and space complexity of code using Google's Gemini AI
// Updated to use the dedicated analyzer API key for better resource management

const analyzeComplexity = async (req, res) => {
  try {
    const { code, language, problem } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({ error: 'Code is required for complexity analysis' });
    }

    // Create a cache key using a simple approach
    const cacheKey = `${language}-${problem?.title || 'unknown'}-${code.length}`;

    // Check cache first
    const cachedResult = analysisCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      return res.json(cachedResult.data);
    }

    // Rate limiting check - limit to 10 requests per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    
    // Remove old timestamps
    while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
      requestTimestamps.shift();
    }
    
    // Check if we're over the limit
    if (requestTimestamps.length >= 10) {
      return res.status(429).json({ 
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter: "60 seconds"
      });
    }
    
    // Add current timestamp
    requestTimestamps.push(now);

    // Create a prompt for complexity analysis
    const prompt = `
    Analyze the time and space complexity of the following ${language} code:
    
    Code:
    ${code}
    
    Problem Context:
    Title: ${problem?.title || 'Not provided'}
    Description: ${problem?.description || 'Not provided'}
    
    Please provide:
    1. Time Complexity in Big O notation
    2. Space Complexity in Big O notation
    3. A brief explanation of how you determined the complexity
    4. A breakdown of major operations and their complexities
    5. Suggestions for optimization if applicable
    
    Format your response as a JSON object with the following structure:
    {
      "timeComplexity": "O(?)",
      "spaceComplexity": "O(?)",
      "explanation": "...",
      "breakdown": [
        {
          "operation": "...",
          "complexity": "O(?)",
          "description": "..."
        }
      ],
      "optimization": "..." // Optional suggestions
    }
    `;

    // Generate content using the GoogleGenAI
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });

    // Extract the text response
    const text = response.text();

    // Try to parse the response as JSON
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonString = text.substring(jsonStart, jsonEnd);
      
      const analysis = JSON.parse(jsonString);
      
      // Cache the result
      analysisCache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now()
      });
      
      res.json(analysis);
    } catch (parseError) {
      // If parsing fails, return a simplified response
      const analysis = {
        timeComplexity: "Analysis completed",
        spaceComplexity: "See explanation",
        explanation: text,
        breakdown: [],
        optimization: "Review the full analysis above"
      };
      
      // Cache the result
      analysisCache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now()
      });
      
      res.json(analysis);
    }
  } catch (error) {
    console.error("Complexity analysis error:", error);
    
    // Handle rate limiting specifically
    if (error.status === 429 || (error.message && error.message.includes('quota'))) {
      // Extract retry delay if available
      let retryAfter = "a few minutes";
      if (error.details && error.details.length > 0) {
        const retryInfo = error.details.find(detail => detail["@type"] && detail["@type"].includes("RetryInfo"));
        if (retryInfo && retryInfo.retryDelay) {
          retryAfter = `${Math.ceil(parseInt(retryInfo.retryDelay.replace('s', '')))} seconds`;
        }
      }
      
      return res.status(429).json({ 
        error: "Rate limit exceeded",
        message: "You have exceeded the API quota. Please try again later or consider upgrading to a paid plan.",
        retryAfter: retryAfter
      });
    }
    
    // Handle other API errors
    if (error.status) {
      return res.status(error.status).json({ 
        error: "API Error",
        message: error.message || "An error occurred while processing your request"
      });
    }
    
    res.status(500).json({ 
      error: "Failed to analyze complexity",
      message: error.message 
    });
  }
};

// Function to generate mock performance data for graph visualization
const generatePerformanceData = (timeComplexity) => {
  // This would be replaced with actual benchmarking in a real implementation
  const testData = [];
  
  // Generate mock data based on complexity pattern
  const patterns = {
    'O(1)': () => 1,
    'O(log n)': (n) => Math.log2(n) * 10,
    'O(n)': (n) => n * 0.5,
    'O(n log n)': (n) => n * Math.log2(n) * 0.1,
    'O(n^2)': (n) => n * n * 0.01,
    'O(2^n)': (n) => Math.pow(2, n) * 0.001,
    'default': (n) => n
  };
  
  const pattern = patterns[timeComplexity] || patterns['default'];
  
  // Generate data points
  for (let i = 1; i <= 10; i++) {
    const inputSize = i * 100;
    const executionTime = Math.max(0.1, pattern(inputSize) + (Math.random() * 10)); // Add some randomness
    testData.push({
      inputSize,
      executionTime: parseFloat(executionTime.toFixed(2))
    });
  }
  
  return testData;
};

module.exports = {
  analyzeComplexity,
  generatePerformanceData
};