React Base
https://medium.com/@claudeando/setting-up-a-react-project-without-create-react-app-6ff7fea9ca51
React router
https://medium.com/getpieces/react-router-v6-a-comprehensive-guide-to-page-routing-in-react-8f6078d69991

import React from 'react';

import { createRoot } from 'react-dom/client';
import App from './App';  

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
