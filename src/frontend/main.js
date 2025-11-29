import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/styles.css';

const app = createApp(App);

app.use(router);

// Global error handlers to aid debugging runtime issues
app.config.errorHandler = (err, vm, info) => {
	console.error('Vue errorHandler:', { err, info, vm });
};

window.addEventListener('error', (event) => {
	console.error('Window error event:', event.error || event.message, event);
});

window.addEventListener('unhandledrejection', (ev) => {
	console.error('Unhandled promise rejection:', ev.reason);
});

app.mount('#app');

console.log('Food Business Management System - Vue App Initialized');
console.log('Environment:', process.env.NODE_ENV);
