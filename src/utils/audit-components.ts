export const auditComponents = (scope: string, items: Record<string, unknown>) => {
    Object.entries(items).forEach(([name, value]) => {
        if (value === undefined || value === null) {
            // eslint-disable-next-line no-console
            console.error(`[Jixirio][audit] ${scope}: "${name}" is ${value}`);
        }
    });
};
