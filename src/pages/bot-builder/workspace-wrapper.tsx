import React from 'react';
import { observer } from 'mobx-react-lite';
import Flyout from '@/components/flyout';
import { useStore } from '@/hooks/useStore';
import StopBotModal from '../dashboard/stop-bot-modal';
import Toolbar from './toolbar';
import Toolbox from './toolbox';
import { auditComponents } from '@/utils/audit-components';
import './workspace.scss';

auditComponents('workspace-wrapper', {
    Flyout,
    StopBotModal,
    Toolbar,
    Toolbox,
});

// React error #130 means a JSX tag resolved to undefined. This guard names the
// offender in the on-screen diagnostic and skips only that piece.
const reported = new Set<string>();

const safe = (name: string, Component: unknown): React.ComponentType | null => {
    if (Component) return Component as React.ComponentType;
    if (!reported.has(name)) {
        reported.add(name);
        // eslint-disable-next-line no-console
        console.error(`[Jixirio] WorkspaceWrapper: "${name}" imported as undefined (bad import/export).`);
    }
    return null;
};

const WorkspaceWrapper = observer(() => {
    const { blockly_store } = useStore();
    const { onMount, onUnmount, is_loading } = blockly_store;

    React.useEffect(() => {
        onMount();
        return () => {
            onUnmount();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (is_loading) return null;
    if (!window.Blockly?.derivWorkspace) return null;

    const parts: Array<[string, React.ComponentType | null]> = [
        ['Toolbox', safe('Toolbox', Toolbox)],
        ['Toolbar', safe('Toolbar', Toolbar)],
        ['Flyout', safe('Flyout', Flyout)],
        ['StopBotModal', safe('StopBotModal', StopBotModal)],
    ];

    return (
        <React.Fragment>
            {parts.map(([name, Part]) => (Part ? <Part key={name} /> : null))}
        </React.Fragment>
    );
});

export default WorkspaceWrapper;
