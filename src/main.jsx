import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import './index.css'

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const root = ReactDOM.createRoot(document.getElementById('root'));

if (!convexUrl) {
    root.render(
        <React.StrictMode>
            <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
                <h1 style={{ margin: '0 0 12px' }}>Configuration Error</h1>
                <p style={{ margin: 0 }}>
                    Missing <code>VITE_CONVEX_URL</code>. Set it in your deployment environment variables.
                </p>
            </div>
        </React.StrictMode>,
    );
} else {
    const convex = new ConvexReactClient(convexUrl);

    root.render(
        <React.StrictMode>
            <AppErrorBoundary>
                <ConvexProvider client={convex}>
                    <App />
                </ConvexProvider>
            </AppErrorBoundary>
        </React.StrictMode>,
    );
}
