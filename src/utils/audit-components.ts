export const auditComponents = (scope: string, items: Record<string, unknown>) => {
    Object.entries(items).forEach(([name, value]) => {
        if (value === undefined || value === null) {
            const finding = `${scope}.${name} is ${value}`;

            if (typeof window !== 'undefined') {
                const auditWindow = window as Window & { __JIXIRIO_IMPORT_AUDIT__?: string[] };
                const entries = auditWindow.__JIXIRIO_IMPORT_AUDIT__ ?? [];
                if (!entries.includes(finding)) {
                    auditWindow.__JIXIRIO_IMPORT_AUDIT__ = [...entries, finding];
                }
            }

            // eslint-disable-next-line no-console
            console.error(`[Jixirio][audit] ${finding}`);
        }
    });
};
