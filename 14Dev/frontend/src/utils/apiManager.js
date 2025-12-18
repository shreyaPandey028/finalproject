// Utility for managing API requests to prevent rate limiting

/**
 * Delay function to add pauses between requests
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Resolves after the delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Request Queue to manage API calls with controlled timing
 */
export class RequestQueue {
    constructor(delay = 1000) {
        this.delay = delay;
        this.lastRequest = 0;
        this.queue = [];
    }
    
    async add(request) {
        const now = Date.now();
        const timeSinceLast = now - this.lastRequest;
        
        if (timeSinceLast < this.delay) {
            await new Promise(resolve => 
                setTimeout(resolve, this.delay - timeSinceLast)
            );
        }
        
        this.lastRequest = Date.now();
        return request();
    }
}

/**
 * Call API with exponential backoff retry logic
 * @param {Function} apiCall - Async function to call
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise} - Resolves with API response
 */
export async function callWithRetry(apiCall, maxRetries = 3) {
    let retries = 0;
    let delay = 1000;
    
    while (retries <= maxRetries) {
        try {
            return await apiCall();
        } catch (error) {
            if (error.response?.status === 429 && retries < maxRetries) {
                await new Promise(resolve => 
                    setTimeout(resolve, delay * Math.pow(2, retries))
                );
                retries++;
                continue;
            }
            throw error;
        }
    }
}

/**
 * Simple response cache to avoid duplicate API calls
 */
export class ResponseCache {
    constructor() {
        this.cache = new Map();
    }
    
    /**
     * Get cached result or fetch new data
     * @param {string} key - Cache key
     * @param {Function} fetchFunction - Function to fetch data if not cached
     * @param {number} ttl - Time to live in milliseconds (default 1 minute)
     * @returns {Promise} - Resolves with cached or fresh data
     */
    async get(key, fetchFunction, ttl = 60000) {
        const cached = this.cache.get(key);
        const now = Date.now();
        
        // Check if cache entry exists and is still valid
        if (cached && (now - cached.timestamp) < ttl) {
            return cached.data;
        }
        
        // Fetch fresh data
        const result = await fetchFunction();
        
        // Store in cache with timestamp
        this.cache.set(key, {
            data: result,
            timestamp: now
        });
        
        return result;
    }
    
    /**
     * Clear expired cache entries
     * @param {number} ttl - Time to live in milliseconds
     */
    clearExpired(ttl = 60000) {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if ((now - value.timestamp) >= ttl) {
                this.cache.delete(key);
            }
        }
    }
    
    /**
     * Clear all cache entries
     */
    clearAll() {
        this.cache.clear();
    }
}

// Create a singleton instance for the application
export const apiCache = new ResponseCache();

// Create a request queue for the complexity analyzer with 1.5 second delays
export const complexityQueue = new RequestQueue(1500);