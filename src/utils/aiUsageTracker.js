// AI Explanation Usage Tracker for Free Users
// Tracks AI explanation usage across all search types (Regulations, B149.1, B149.2)

const AI_USAGE_KEY = 'code_compass_ai_usage';
const FREE_AI_LIMIT = 10;

// Get current AI usage count
export const getAIUsageCount = () => {
  try {
    const stored = localStorage.getItem(AI_USAGE_KEY);
    if (!stored) return 0;

    const data = JSON.parse(stored);

    // Check if the stored data is from today (reset daily for better UX)
    const today = new Date().toDateString();
    if (data.date !== today) {
      // Reset count if it's a new day (optional feature for better free experience)
      // Comment out these lines if you want permanent tracking
      // resetAIUsage();
      // return 0;
    }

    return data.count || 0;
  } catch (error) {
    console.error('Error reading AI usage data:', error);
    return 0;
  }
};

// Get remaining free AI explanations
export const getRemainingFreeAI = () => {
  const used = getAIUsageCount();
  const remaining = FREE_AI_LIMIT - used;
  return Math.max(0, remaining);
};

// Check if user has free AI explanations remaining
export const hasFreeAIRemaining = () => {
  return getRemainingFreeAI() > 0;
};

// Check if user has reached the free limit
export const hasReachedFreeLimit = () => {
  return getAIUsageCount() >= FREE_AI_LIMIT;
};

// Increment AI usage count
export const incrementAIUsage = () => {
  try {
    const currentCount = getAIUsageCount();
    const newCount = currentCount + 1;
    const today = new Date().toDateString();

    const data = {
      count: newCount,
      date: today,
      lastUsed: new Date().toISOString()
    };

    localStorage.setItem(AI_USAGE_KEY, JSON.stringify(data));

    // Return the new count and remaining
    return {
      count: newCount,
      remaining: Math.max(0, FREE_AI_LIMIT - newCount),
      hasReachedLimit: newCount >= FREE_AI_LIMIT
    };
  } catch (error) {
    console.error('Error updating AI usage data:', error);
    return {
      count: FREE_AI_LIMIT,
      remaining: 0,
      hasReachedLimit: true
    };
  }
};

// Reset AI usage (for testing or admin purposes)
export const resetAIUsage = () => {
  try {
    localStorage.removeItem(AI_USAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error resetting AI usage data:', error);
    return false;
  }
};

// Get AI usage statistics
export const getAIUsageStats = () => {
  const count = getAIUsageCount();
  const remaining = getRemainingFreeAI();
  const hasReachedLimit = hasReachedFreeLimit();
  const hasFreeRemaining = hasFreeAIRemaining();

  return {
    used: count,
    remaining,
    limit: FREE_AI_LIMIT,
    hasReachedLimit,
    hasFreeRemaining,
    percentage: Math.min(100, (count / FREE_AI_LIMIT) * 100)
  };
};

// Format AI usage text for display
export const formatAIUsageText = () => {
  const stats = getAIUsageStats();

  if (stats.hasReachedLimit) {
    return "Free AI explanations used up - Upgrade for unlimited";
  }

  return `${stats.remaining} free AI explanations remaining`;
};

// Check if user can use AI explanation (either premium or has free uses)
export const canUseAIExplanation = (isPremiumUser) => {
  if (isPremiumUser) return true;
  return hasFreeAIRemaining();
};

export { FREE_AI_LIMIT };