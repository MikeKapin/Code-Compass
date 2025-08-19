// Manual fix to enable search bar after authentication
// Run this in the browser console after signing in

function enableSearchBar() {
    console.log('Looking for search bar...');
    
    // Find the search input
    const searchInput = document.querySelector('input[type="text"]') || 
                       document.querySelector('input[placeholder*="search"]') || 
                       document.querySelector('input[placeholder*="Search"]') ||
                       document.querySelector('input[placeholder*="CSA"]');
    
    if (searchInput) {
        console.log('Found search input:', searchInput);
        
        // Enable the input
        searchInput.disabled = false;
        searchInput.style.pointerEvents = 'auto';
        searchInput.style.backgroundColor = 'white';
        searchInput.style.color = 'black';
        searchInput.style.opacity = '1';
        
        // Remove any disabled attributes
        searchInput.removeAttribute('disabled');
        searchInput.removeAttribute('readonly');
        
        console.log('✅ Search bar enabled!');
        
        // Test focus
        searchInput.focus();
        
        return true;
    } else {
        console.log('❌ Search input not found');
        console.log('Available inputs:', document.querySelectorAll('input'));
        return false;
    }
}

// Also try to remove any blocking overlays
function removeBlockingElements() {
    console.log('Removing potential blocking elements...');
    
    // Remove any disabled overlays
    const overlays = document.querySelectorAll('[class*="disabled"], [class*="blocked"], [class*="overlay"]');
    overlays.forEach(overlay => {
        if (overlay.style.pointerEvents === 'none' || overlay.classList.contains('disabled')) {
            overlay.remove();
            console.log('Removed blocking element:', overlay);
        }
    });
    
    // Force enable all inputs
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.disabled = false;
        input.style.pointerEvents = 'auto';
    });
}

// Main function to run
function fixSearchAccess() {
    console.log('🔧 Running manual search bar fix...');
    
    removeBlockingElements();
    enableSearchBar();
    
    console.log('✅ Manual fix complete! Try typing in the search bar now.');
}

// Run the fix
fixSearchAccess();

// Also expose it globally so you can run it again if needed
window.fixSearchAccess = fixSearchAccess;