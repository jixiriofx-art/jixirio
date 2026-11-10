import React from 'react';

const reported = new Set<string>();
const MissingComponent: React.FC = () => null;

/**
 * Keeps one undefined nested import from crashing the complete Bot Builder tree.
 * The exact module/component is reported once per page load for diagnosis.
 */
export const safeReactComponent = (name: string, Component: unknown): React.ElementType => {
    if (Component !== undefined && Component !== null) {
        return Component as React.ElementType;
    }

    if (!reported.has(name)) {
        reported.add(name);
        // eslint-disable-next-line no-console
        console.error(`[Jixirio] ${name} imported as undefined (bad import/export).`);
    }

    return MissingComponent;
};
