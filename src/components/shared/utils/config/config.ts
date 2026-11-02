
import {
    buildAuthorizationUrl,
    buildSignUpUrl,
    getAuthInfo,
    parseReferralLink,
    parseLandingParams,
    resolveReferralViaProxy,
} from '@/external/deriv-core';
import type { AuthConfig } from '@/external/deriv-core';
import { getInitialLanguage } from '@deriv-com/translations';
import { DerivWSAccountsService } from '@/services/derivws-accounts.service';
import brandConfig from '../../../../../brand.config.json';

export const PRODUCTION_DOMAINS = {
    COM: brandConfig.platform.hostname.production.com,
} as const;

export const STAGING_DOMAINS = {
    COM: brandConfig.platform.hostname.staging.com,
} as const;

export const WS_SERVERS = {
    STAGING: `${brandConfig.platform.derivws.url.staging}options/ws/public`,
    PRODUCTION: `${brandConfig.platform.derivws.url.production}options/ws/public`,
} as const;

export const isProduction = () => {
    const env = process.env.NEXT_PUBLIC_DERIV_ENV;

    if (env === 'production') return true;
    if (env === 'preview' || env === 'staging') return false;

    const hostname = window.location.hostname;
    const productionDomains = Object.values(PRODUCTION_DOMAINS) as string[];

    return productionDomains.includes(hostname);
};

export const isLocal = () =>
    /localhost(:\d+)?$/i.test(window.location.hostname);

const getDefaultServerURL = () => {
    return isProduction() ? WS_SERVERS.PRODUCTION : WS_SERVERS.STAGING;
};

/**
 * Returns the authenticated WebSocket URL when an OAuth token exists.
 * Public WebSocket is used only when there is no valid stored access token.
 * Authentication failures are propagated instead of silently falling back.
 */
export const getSocketURL = async (): Promise<string> => {
    const authInfo = getAuthInfo();

    if (!authInfo?.access_token) {
        return getDefaultServerURL();
    }

    try {
        return await DerivWSAccountsService.getAuthenticatedWebSocketURL(
            authInfo.access_token
        );
    } catch (error) {
        console.error(
            '[DerivWS] Authenticated WebSocket URL request failed:',
            error
        );

        throw error;
    }
};

export const getDebugServiceWorker = () => {
    const debug_service_worker_flag = window.localStorage.getItem(
        'debug_service_worker'
    );

    if (debug_service_worker_flag) {
        return !!parseInt(debug_service_worker_flag);
    }

    return false;
};

export const generateOAuthURL = async (prompt?: string): Promise<string> => {
    try {
        const clientId = process.env.NEXT_PUBLIC_DERIV_APP_ID;

        if (!clientId) return '';

        const config: AuthConfig = {
            clientId,
            redirectUri: window.location.origin,
            scopes: 'trade',
            lang: getInitialLanguage(),
        };

        const referralLink = process.env.NEXT_PUBLIC_DERIV_REFERRAL_LINK;

        if (referralLink) {
            const referral = parseReferralLink(referralLink);

            if (referral) {
                config.affiliateToken = referral.affiliateToken;
                config.affiliateTokenParam = referral.affiliateTokenParam;
                config.utmCampaign = referral.utmCampaign;

                if (referral.utmSource) {
                    config.utmSource = referral.utmSource;
                }

                if (referral.utmMedium) {
                    config.utmMedium = referral.utmMedium;
                }
            }
        }

        const landing = parseLandingParams();

        if (landing) {
            if (landing.affiliateToken) {
                config.affiliateToken = landing.affiliateToken;
                config.affiliateTokenParam = landing.affiliateTokenParam;
            }

            if (landing.utmSource) config.utmSource = landing.utmSource;
            if (landing.utmMedium) config.utmMedium = landing.utmMedium;
            if (landing.utmCampaign) config.utmCampaign = landing.utmCampaign;
        }

        if (!config.affiliateToken && referralLink) {
            const resolved = await resolveReferralViaProxy(referralLink);

            if (resolved) {
                config.affiliateToken = resolved.affiliateToken;
                config.affiliateTokenParam = resolved.affiliateTokenParam;

                if (resolved.utmSource) config.utmSource = resolved.utmSource;
                if (resolved.utmMedium) config.utmMedium = resolved.utmMedium;
                if (resolved.utmCampaign) config.utmCampaign = resolved.utmCampaign;
            }
        }

        if (prompt === 'registration') {
            return await buildSignUpUrl(config);
        }

        return await buildAuthorizationUrl(config);
    } catch (error) {
        console.error('[Jixirio] Error generating OAuth URL:', error);
        return '';
    }
};
