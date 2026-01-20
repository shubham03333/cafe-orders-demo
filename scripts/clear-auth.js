// Script to clear authentication data from localStorage
console.log('Clearing authentication data from localStorage...');

// Clear localStorage items related to authentication
localStorage.removeItem('isLoggedIn');
localStorage.removeItem('userRole');

console.log('Authentication data cleared successfully!');
console.log('Please refresh your browser to see the login form.');
