import React from 'react';
import PropTypes from 'prop-types';
import ErrorComponent from './index';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    componentDidCatch = (error, info) => {
        console.error('[Jixirio] Uncaught React error:', error);
        console.error('[Jixirio] Component stack:', info?.componentStack);

        if (window.TrackJS) window.TrackJS.console.log(this.props.root_store);

        this.setState({
            hasError: true,
            error,
            info,
        });
    };

    render = () => {
        if (!this.state.hasError) return this.props.children;

        const importAudit = window.__JIXIRIO_IMPORT_AUDIT__ || [];
        const diagnosticLines = [
            this.state.error?.message || 'Unknown application error.',
            this.state.info?.componentStack
                ? `Component stack:\n${this.state.info.componentStack}`
                : 'Component stack unavailable.',
            importAudit.length
                ? `Missing component imports:\n${importAudit.join('\n')}`
                : 'Import audit: no undefined imports detected in audited modules.',
        ];

        return (
            <ErrorComponent
                header="Jixirio diagnostic"
                message={diagnosticLines.join('\n\n')}
                should_show_refresh={true}
            />
        );
    };
}

ErrorBoundary.propTypes = {
    root_store: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
};

export default ErrorBoundary;
