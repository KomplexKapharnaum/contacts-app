const rateLimiter = {
    // Map to store user message counts
    userRates: new Map(),
    
    // Configuration options
    config: {
      windowMs: 60000, // 1 minute window
      maxMessages: 10,  // Max messages per window
      blockDuration: 60000 // Block duration in ms (1 minute)
    },
    
    // Clean up old rate limit data periodically
    cleanup() {
      const now = Date.now();
      for (const [userID, userData] of this.userRates.entries()) {
        if (userData.blockedUntil && userData.blockedUntil < now) {
          // User block has expired, remove them from the blocked list
          userData.blockedUntil = null;
        }
        
        // Remove message timestamps older than the window
        userData.timestamps = userData.timestamps.filter(
          time => now - time < this.config.windowMs
        );
        
        // If no timestamps left, remove user from map to prevent memory leaks
        if (userData.timestamps.length === 0 && !userData.blockedUntil) {
          this.userRates.delete(userID);
        }
      }
    },
    
    // Check if a user is allowed to send a message
    isAllowed(userID) {
      const now = Date.now();
      
      // Initialize user data if not exists
      if (!this.userRates.has(userID)) {
        this.userRates.set(userID, {
          timestamps: [],
          blockedUntil: null
        });
      }
      
      const userData = this.userRates.get(userID);
      
      // Check if user is currently blocked
      if (userData.blockedUntil && userData.blockedUntil > now) {
        return {
          allowed: false,
          timeRemaining: Math.ceil((userData.blockedUntil - now) / 1000)
        };
      }
      
      // Filter out old timestamps
      userData.timestamps = userData.timestamps.filter(
        time => now - time < this.config.windowMs
      );
      
      // Check if user has reached the limit
      if (userData.timestamps.length >= this.config.maxMessages) {
        // Block the user
        userData.blockedUntil = now + this.config.blockDuration;
        return {
          allowed: false,
          timeRemaining: Math.ceil(this.config.blockDuration / 1000)
        };
      }
      
      // User is allowed to send message
      userData.timestamps.push(now);
      return { allowed: true };
    },
    
    // Start periodic cleanup
    startCleanup(interval = 60000) {
      setInterval(() => this.cleanup(), interval);
    }
};
  
// Start the cleanup process
rateLimiter.startCleanup();

export default rateLimiter;