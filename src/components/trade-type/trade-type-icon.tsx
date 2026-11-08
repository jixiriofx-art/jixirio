
import { lazy, Suspense, type ComponentType } from 'react';
import type { IconSize } from '@deriv/quill-icons';

const loadTradeTypeIcon = (iconName: string) =>
    lazy(() =>
        Promise.all([
            import('@deriv/quill-icons/TradeTypes'),
            import('@deriv/quill-icons/Illustrative'),
        ]).then(([tradeTypes, illustrative]) => ({
            default:
                (tradeTypes as Record<string, ComponentType<any>>)[iconName] ??
                illustrative.IllustrativeMarketsIcon,
        }))
    );

const TRADE_TYPE_ICONS = {
    ACCU: loadTradeTypeIcon('TradeTypesAccumulatorStayInIcon'),
    DIGITDIFF: loadTradeTypeIcon('TradeTypesDigitsDiffersIcon'),
    DIGITEVEN: loadTradeTypeIcon('TradeTypesDigitsEvenIcon'),
    DIGITMATCH: loadTradeTypeIcon('TradeTypesDigitsMatchesIcon'),
    DIGITODD: loadTradeTypeIcon('TradeTypesDigitsOddIcon'),
    DIGITOVER: loadTradeTypeIcon('TradeTypesDigitsOverIcon'),
    DIGITUNDER: loadTradeTypeIcon('TradeTypesDigitsUnderIcon'),
    TICKHIGH: loadTradeTypeIcon('TradeTypesHighsAndLowsHighIcon'),
    TICKLOW: loadTradeTypeIcon('TradeTypesHighsAndLowsLowIcon'),
    NOTOUCH: loadTradeTypeIcon('TradeTypesHighsAndLowsNoTouchIcon'),
    ONETOUCH: loadTradeTypeIcon('TradeTypesHighsAndLowsTouchIcon'),
    EXPIRYRANGE: loadTradeTypeIcon('TradeTypesInsAndOutsEndsInIcon'),
    EXPIRYMISS: loadTradeTypeIcon('TradeTypesInsAndOutsEndsOutIcon'),
    UPORDOWN: loadTradeTypeIcon('TradeTypesInsAndOutsGoesOutIcon'),
    RANGE: loadTradeTypeIcon('TradeTypesInsAndOutsStaysInIcon'),
    MULTDOWN: loadTradeTypeIcon('TradeTypesMultipliersDownIcon'),
    MULTUP: loadTradeTypeIcon('TradeTypesMultipliersUpIcon'),
    CALLSPREAD: loadTradeTypeIcon('TradeTypesSpreadsCallIcon'),
    PUTSPREAD: loadTradeTypeIcon('TradeTypesSpreadsPutIcon'),
    ASIAND: loadTradeTypeIcon('TradeTypesUpsAndDownsAsianDownIcon'),
    ASIANU: loadTradeTypeIcon('TradeTypesUpsAndDownsAsianUpIcon'),
    PUT: loadTradeTypeIcon('TradeTypesUpsAndDownsFallIcon'),
    PUTE: loadTradeTypeIcon('TradeTypesUpsAndDownsFallIcon'),
    RUNLOW: loadTradeTypeIcon('TradeTypesUpsAndDownsOnlyDownsIcon'),
    RUNHIGH: loadTradeTypeIcon('TradeTypesUpsAndDownsOnlyUpsIcon'),
    RESETPUT: loadTradeTypeIcon('TradeTypesUpsAndDownsResetDownIcon'),
    RESETCALL: loadTradeTypeIcon('TradeTypesUpsAndDownsResetUpIcon'),
    CALL: loadTradeTypeIcon('TradeTypesUpsAndDownsRiseIcon'),
    CALLE: loadTradeTypeIcon('TradeTypesUpsAndDownsRiseIcon'),
    HIGHER: loadTradeTypeIcon('TradeTypesHighsAndLowsHigherIcon'),
    LOWER: loadTradeTypeIcon('TradeTypesHighsAndLowsLowerIcon'),
    unknown: loadTradeTypeIcon(''),
};

export const TradeTypeIcon = ({
    type,
    size,
    className,
}: {
    type: string;
    size?: IconSize;
    className?: string;
}) => {
    const Icon =
        TRADE_TYPE_ICONS[type?.toUpperCase() as keyof typeof TRADE_TYPE_ICONS] ||
        TRADE_TYPE_ICONS.unknown;

    return (
        <Suspense fallback={null}>
            <Icon iconSize={size ?? 'xs'} className={className} />
        </Suspense>
    );
};
