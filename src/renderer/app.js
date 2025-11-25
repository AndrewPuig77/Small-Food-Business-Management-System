// Frontend application logic
console.log('Food Business Management System - Initialized');
console.log('Electron version:', process.versions.electron);
console.log('Chrome version:', process.versions.chrome);
console.log('Node version:', process.versions.node);

// This file will contain Vue.js application logic in the future
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded - Ready to initialize Vue app');
  
  // Add some interactivity
  const cards = document.querySelectorAll('.info-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      console.log('Card clicked:', card.querySelector('h3').textContent);
    });
  });
});
