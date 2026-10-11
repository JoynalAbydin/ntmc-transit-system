import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// Production API URL is injected at build time. Empty value keeps CRA's localhost proxy for development.
axios.defaults.baseURL = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
