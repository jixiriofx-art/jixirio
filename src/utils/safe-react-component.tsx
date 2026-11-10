import React from 'react';

const reported = new Set<string>();

// Compound UI components (Modal.Body, Modal.Footer, RadioGroup.Item) also
// receive harmless fallbacks if their parent import is missing.
const MissingComponent = (() => null) as React.FC & {
    Body: React.FC;
    Footer: React.FC;
    Item: React.FC;
};
MissingComponent.Body = MissingComponent;
MissingComponent.Footer = MissingComponent;
MissingComponent.Item = MissingComponent;

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
