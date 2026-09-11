import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { PortalDataProvider } from './context/PortalDataContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <PortalDataProvider>
        <App />
      </PortalDataProvider>
    </LanguageProvider>
  </React.StrictMode>
);
