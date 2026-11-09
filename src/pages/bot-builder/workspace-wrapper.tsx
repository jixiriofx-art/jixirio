import React from 'react';
import { observer } from 'mobx-react-lite';
import Flyout from '@/components/flyout';
import { useStore } from '@/hooks/useStore';
import StopBotModal from '../dashboard/stop-bot-modal';
import Toolbar from './toolbar';
import Toolbox from './toolbox';
import './workspace.scss';

const WorkspaceWrapper = observer(() => {
    const { blockly_store } = useStore();
    const { onMount, onUnmount, is_loading } = blockly_store;

    // Identify broken default/named imports before React attempts to render them.
    React.useEffect(() => {
        const imported_components = {
            Toolbox,
            Toolbar,
            Flyout,
            StopBotModal,
        };
        const undefined_components = Object.entries(imported_components)
            .filter(([, component]) => component === undefined)
            .map(([name]) => name);

        if (undefined_components.length > 0) {
            console.error(
                '[Jixirio] Undefined Bot Builder child component imports:',
                undefined_components
            );
        } else {
            console.info('[Jixirio] Bot Builder child component import audit passed.');
        }
    }, []);

    React.useEffect(() => {
        onMount();
        return () => {
            onUnmount();
        };
    }, []);

    if (is_loading) return null;

    if (window.Blockly?.derivWorkspace)
        return (
            <React.Fragment>
                <Toolbox />
                <Toolbar />
                <Flyout />
                <StopBotModal />
            </React.Fragment>
        );

    return null;
});

export default WorkspaceWrapper;
