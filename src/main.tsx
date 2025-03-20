
import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root';
import './index.css';
import './components/tour/tour.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Failed to find the root element');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  );
}
