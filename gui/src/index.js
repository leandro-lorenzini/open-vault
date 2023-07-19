import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { HashRouter } from 'react-router-dom';

const originalLog = console.log;
console.log = (message) => {
	window.electron.ipcRenderer.send('log-info', safeStringify(message));
	originalLog(message);
};

const originalError = console.error;
console.error = (message) => {
	window.electron.ipcRenderer.send('log-error', safeStringify(message));
	originalError(message);
};

const safeStringify = (arg) => {
	try {
		return JSON.stringify(arg,null,2);
	} catch {
		return String(arg);
	}
};
  
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<HashRouter>
			<App />
		</HashRouter>
	</React.StrictMode>
);