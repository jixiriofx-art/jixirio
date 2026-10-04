type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    BEST_BOTS: 2,
    AI_ANALYSIS: 3,
    DANALYSIS: 4,
    AUTO_TRADES: 5,
    CHART: 6,
    MANUAL_TRADING: 7,
    RISK_MANAGEMENT: 8,
    TUTORIAL: 9,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-dbot-dashboard',
    'id-bot-builder',
    'id-best-bots',
    'id-ai-analysis',
    'id-danalysis',
    'id-auto-trades',
    'id-charts',
    'id-manual-trading',
    'id-risk-management',
    'id-tutorials',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
