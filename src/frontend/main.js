import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/styles.css';

const app = createApp(App);

app.use(router);

app.mount('#app');

console.log('Food Business Management System - Vue App Initialized');
console.log('Environment:', process.env.NODE_ENV);
