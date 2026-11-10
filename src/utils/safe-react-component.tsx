import React from 'react';

const reported = new Set<string>();

const recordMissingComponent = (name: string) => {
    if (typeof window !== 'undefined') {
        const auditWindow = window as Window & { __JIXIRIO_IMPORT_AUDIT__?: string[] };
        const entries = auditWindow.__JIXIRIO_IMPORT_AUDIT__ ?? [];
        if (!entries.includes(name)) {
            auditWindow.__JIXIRIO_IMPORT_AUDIT__ = [...entries, name];
        }
    }
};

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
 * The exact module/component is also exposed in the on-screen Jixirio diagnostic.
 */
export const safeReactComponent = (name: string, Component: unknown): React.ElementType => {
    if (Component !== undefined && Component !== null) {
        return Component as React.ElementType;
    }

    recordMissingComponent(name);

    if (!reported.has(name)) {
        reported.add(name);
        // eslint-disable-next-line no-console
        console.error(`[Jixirio] ${name} imported as undefined (bad import/export).`);
    }

    return MissingComponent;
};
