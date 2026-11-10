import { configure } from 'mobx';
import ReactDOM from 'react-dom/client';
import { AuthWrapper } from './app/AuthWrapper';
// Removed AnalyticsInitializer import - analytics dependency removed
// See migrate-docs/ANALYTICS_IMPLEMENTATION_GUIDE.md for re-implementation
import {
    applyBrandFontFromConfig,
    applyDocumentTitle,
    applyFaviconFromLogo,
    applyPrimaryColorFromConfig,
} from './utils/document-branding';
import { applyReact19DomPolyfills } from './utils/react19-dom-polyfills';
import { performVersionCheck } from './utils/version-check';
import './styles/index.scss';

applyReact19DomPolyfills();

// Configure MobX to handle multiple instances in production builds
configure({ isolateGlobalState: true });

// Perform version check FIRST - before any other operations
performVersionCheck();

// Apply deploy-time document branding (tab title, favicon, web font, and primary color).
applyDocumentTitle();
applyFaviconFromLogo();
applyBrandFontFromConfig();
applyPrimaryColorFromConfig();

// Removed AnalyticsInitializer() call - analytics dependency removed

// App Builder preview branding (incl. PREVIEW_READY handshake) is handled by the
// src/preview/ listener, mounted from app-content only in the preview deployment
// (NEXT_PUBLIC_APP_BUILD === 'true') and stripped from standalone partner deploys.
const showError = (title: string, error: unknown, stack?: string | null) => {
    const existing = document.getElementById('jixirio-runtime-error');
    existing?.remove();

    const el = document.createElement('pre');
    el.id = 'jixirio-runtime-error';
    el.style.cssText =
        'position:fixed;inset:0;z-index:99999;margin:0;padding:16px;overflow:auto;' +
        'background:#000;color:#ff6b6b;font:12px/1.4 monospace;white-space:pre-wrap;';
    el.textContent =
        `[Jixirio] ${title}\n\n` +
        `${error instanceof Error ? error.stack || error.message : String(error)}\n\n` +
        `${stack ?? ''}`;
    document.body.appendChild(el);
};

window.addEventListener('error', event => {
    showError('window error', event.error ?? event.message);
});

window.addEventListener('unhandledrejection', event => {
    showError('unhandled rejection', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!, {
    onUncaughtError: (error, info) =>
        showError('React render error', error, info.componentStack),
    onCaughtError: (error, info) =>
        showError('React caught error', error, info.componentStack),
}).render(<AuthWrapper />);
