
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
        if (!this.state.hasError) {
            return this.props.children;
        }

        const diagnostic_message = [
            this.state.error?.message || 'Unknown application error.',
            this.state.info?.componentStack
                ? `Component stack:\n${this.state.info.componentStack}`
                : 'Component stack unavailable.',
        ].join('\n\n');

        return (
            <ErrorComponent
                header="Jixirio diagnostic"
                message={diagnostic_message}
                should_show_refresh={true}
            />
        );
    };
}

ErrorBoundary.propTypes = {
    root_store: PropTypes.object,
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]),
};

export default ErrorBoundary;
