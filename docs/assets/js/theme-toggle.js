// Function to toggle theme
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    
    // Update body background and text color
    document.body.style.backgroundColor = newTheme === 'dark' ? '#1b1b1d' : '#ffffff';
    document.body.style.color = newTheme === 'dark' ? '#ffffff' : '#000000';
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
}

// Initialize theme from saved preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Apply initial theme styles
    if (savedTheme === 'dark') {
        document.body.style.backgroundColor = '#1b1b1d';
        document.body.style.color = '#ffffff';
    }
}

// Add click event listener to theme toggle button when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    // Initialize theme when page loads
    initTheme();
});
