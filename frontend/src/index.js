import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

axios.defaults.baseURL = 'https://ntmc-transit-system.onrender.com';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
<<<<<<< Updated upstream
);
=======
);
>>>>>>> Stashed changes
