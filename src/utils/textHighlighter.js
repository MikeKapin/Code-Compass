// Utility function to highlight search terms in text
export const highlightSearchTerms = (text, searchQuery) => {
  if (!text || !searchQuery) return text;

  const query = searchQuery.toLowerCase().trim();
  if (!query) return text;

  // Split query into individual terms for better matching
  const terms = query.split(/\s+/).filter(term => term.length > 1);

  if (terms.length === 0) return text;

  // Create a regex pattern that matches any of the search terms (case insensitive)
  const pattern = new RegExp(`(${terms.map(term =>
    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex characters
  ).join('|')})`, 'gi');

  // Replace matches with highlighted spans
  return text.replace(pattern, (match) =>
    `<mark style="background-color: #4CAF50; color: white; padding: 2px 4px; border-radius: 3px; font-weight: 500;">${match}</mark>`
  );
};

// Function to create highlighted JSX element
export const createHighlightedText = (text, searchQuery) => {
  const highlightedHTML = highlightSearchTerms(text, searchQuery);

  // Return a JSX element with dangerouslySetInnerHTML
  return {
    __html: highlightedHTML
  };
};

// Alternative function that returns React elements instead of HTML string
// Note: This function would need to be in a .jsx file to work properly with JSX
export const createHighlightedReactText = (text, searchQuery) => {
  // For now, we'll use the HTML version since this is a .js file
  // If needed in the future, move this to a .jsx file or use React.createElement
  return createHighlightedText(text, searchQuery);
};