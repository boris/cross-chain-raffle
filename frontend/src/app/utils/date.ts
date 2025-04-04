/**
 * Format a date into a human-readable distance to now
 * e.g. "in 3 days", "in 2 hours", "ended 5 minutes ago"
 */
export function formatDistanceToNow(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    // If date is in the past
    if (diffSecs < 0) {
      const absDiffSecs = Math.abs(diffSecs);
      
      if (absDiffSecs < 60) return `${absDiffSecs} seconds ago`;
      if (absDiffSecs < 3600) return `${Math.floor(absDiffSecs / 60)} minutes ago`;
      if (absDiffSecs < 86400) return `${Math.floor(absDiffSecs / 3600)} hours ago`;
      return `${Math.floor(absDiffSecs / 86400)} days ago`;
    }
    
    // If date is in the future
    if (diffSecs < 60) return `in ${diffSecs} seconds`;
    if (diffSecs < 3600) return `in ${Math.floor(diffSecs / 60)} minutes`;
    if (diffSecs < 86400) return `in ${Math.floor(diffSecs / 3600)} hours`;
    return `in ${Math.floor(diffSecs / 86400)} days`;
  }
  
  /**
   * Format a Unix timestamp to a full date string
   */
  export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  }