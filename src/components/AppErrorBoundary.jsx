import React from 'react';

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            errorMessage: error?.message || 'Unexpected runtime error.',
        };
    }

    componentDidCatch(error) {
        // Keep logging so deployment logs can surface the stack trace.
        console.error(error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
                    <h1 style={{ margin: '0 0 12px' }}>Runtime Error</h1>
                    <p style={{ margin: 0 }}>
                        {this.state.errorMessage}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;
