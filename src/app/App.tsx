 
import { lazy, Suspense } from 'react';
import React from 'react';
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    RouterProvider,
} from 'react-router';
import {
    cleanupUrl,
    fetchAccounts,
    handleOAuthCallback,
} from '@/external/deriv-core';
import ChunkLoader from '@/components/loader/chunk-loader';
import LocalStorageSyncWrapper from '@/components/localStorage-sync-wrapper';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { useAccountSwitching } from '@/hooks/useAccountSwitching';
import { useLanguageFromURL } from '@/hooks/useLanguageFromURL';
import { StoreProvider } from '@/hooks/useStore';
import { isPreviewMode, PREVIEW_BASE_PATH } from '@/utils/is-preview-mode';
import { localize, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import i18nInstance from './i18n';
import './app-root.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));

const LanguageHandler = ({ children }: { children: React.ReactNode }) => {
    useLanguageFromURL();
    return <>{children}</>;
};

const routerBasename = isPreviewMode() ? PREVIEW_BASE_PATH : undefined;

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={
                <Suspense
                    fallback={
                        <ChunkLoader
                            message={localize('Please wait while we connect to the server...')}
                        />
                    }
                >
                    <TranslationProvider
                        defaultLang='EN'
                        i18nInstance={i18nInstance}
                    >
                        <LanguageHandler>
                            <StoreProvider>
                                <LocalStorageSyncWrapper>
                                    <RoutePromptDialog />
                                    <CoreStoreProvider>
                                        <Layout />
                                    </CoreStoreProvider>
                                </LocalStorageSyncWrapper>
                            </StoreProvider>
                        </LanguageHandler>
                    </TranslationProvider>
                </Suspense>
            }
        >
            <Route index element={<AppRoot />} />
            <Route path='preview' element={<AppRoot />} />
        </Route>
    ),
    { basename: routerBasename }
);

function App() {
    useAccountSwitching();

    const [isOAuthCallbackProcessing, setIsOAuthCallbackProcessing] =
        React.useState(() => {
            const params = new URLSearchParams(window.location.search);
            return (
                params.has('code') ||
                params.has('error') ||
                params.has('error_description')
            );
        });

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const hasCallback =
            params.has('code') ||
            params.has('error') ||
            params.has('error_description');

        if (!hasCallback) return;

        const handleCallback = async () => {
            try {
                const clientId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '';
                if (!clientId) {
                    throw new Error('Jixirio is missing its Deriv App ID configuration.');
                }

                const authInfo = await handleOAuthCallback(
                    window.location.href,
                    {
                        clientId,
                        redirectUri: window.location.origin,
                        scopes: 'trade',
                    }
                );

                if (!authInfo?.access_token) {
                    throw new Error('Deriv did not return an access token.');
                }

                // Use the shared Deriv OAuth account helper. It stores the
                // authoritative account_type and active login ID from Deriv's
                // account response, rather than guessing from account ID prefixes.
                const accounts = await fetchAccounts(authInfo, clientId);

                if (!accounts.length) {
                    throw new Error('No Deriv accounts were returned.');
                }

                // The WebSocket bootstrap reads this sessionStorage copy.
                const { DerivWSAccountsService } = await import(
                    '@/services/derivws-accounts.service'
                );
                DerivWSAccountsService.storeAccounts(accounts);
            } catch (error) {
                console.error('[Jixirio] OAuth callback failed:', error);
            } finally {
                cleanupUrl(window.location.origin);
                setIsOAuthCallbackProcessing(false);
            }
        };

        void handleCallback();
    }, []);

    if (isOAuthCallbackProcessing) {
        return (
            <ChunkLoader
                message={localize(
                    'Please wait while we connect to the server...'
                )}
            />
        );
    }

    return <RouterProvider router={router} />;
}

export default App;
