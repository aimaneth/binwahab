// API Client with caching and retry logic for better performance
class APIClient {
  private cache = new Map();
  private retryDelay = 1000; // 1 second
  private maxRetries = 3;

  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = 0): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok && retries < this.maxRetries) {
        // Retry on 5xx errors or network issues
        if (response.status >= 500) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
          return this.fetchWithRetry(url, options, retries + 1);
        }
      }

      return response;
    } catch (error) {
      if (retries < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }

  async get(endpoint: string, useCache = true) {
    const cacheKey = `GET:${endpoint}`;
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) { // 30 second cache
        return cached.data;
      }
    }

    try {
      const response = await this.fetchWithRetry(`/api${endpoint}`);
      const data = await response.json();
      
      if (response.ok && useCache) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      // Return cached data if available as fallback
      if (useCache && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      throw error;
    }
  }

  async post(endpoint: string, data: any) {
    try {
      const response = await this.fetchWithRetry(`/api${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // Clear related cache entries
      this.clearCachePattern(endpoint);
      
      return await response.json();
    } catch (error) {
      console.error(`API Error for POST ${endpoint}:`, error);
      throw error;
    }
  }

  private clearCachePattern(pattern: string) {
    // Clear cache entries that might be affected by this update
    for (const key of this.cache.keys()) {
      if (key.includes(pattern.split('/')[1])) {
        this.cache.delete(key);
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

export const apiClient = new APIClient(); 