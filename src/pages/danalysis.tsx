
import React from 'react';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';

const Danalysis = observer(() => {
    const [symbol, setSymbol] = React.useState('R_100');
    const [tick, setTick] = React.useState<number | null>(null);
    const [digits, setDigits] = React.useState<number[]>([]);
    const [sampleSize, setSampleSize] = React.useState(30);
    const [status, setStatus] = React.useState('Waiting for market data...');
    const [markets, setMarkets] = React.useState<Array<{ symbol: string; name: string }>>([]);

    React.useEffect(() => {
        let active = true;
        const loadMarkets = async () => {
            try {
                let available = api_base.active_symbols || [];
                if (!available.length && api_base.api) {
                    available = await api_base.getActiveSymbols();
                }
                if (!active) return;
                const derived = available
                    .filter((item: any) => {
                        const name = String(item.display_name || item.symbol || '');
                        return /volatility|jump|crash|boom|step|range break/i.test(name) ||
                            /^(R_|1HZ|JD|CR|BO|STPR|RDB)/i.test(String(item.symbol || ''));
                    })
                    .map((item: any) => ({
                        symbol: String(item.symbol || item.underlying_symbol || ''),
                        name: String(item.display_name || item.symbol || ''),
                    }))
                    .filter((item: any) => item.symbol);
                if (!active) return;
                setMarkets(derived);
                if (derived.length && !derived.some((item: any) => item.symbol === symbol)) {
                    setSymbol(derived[0].symbol);
                }
            } catch {
                if (active) setStatus('Unable to load Deriv markets. Check your connection.');
            }
        };
        loadMarkets();
        return () => { active = false; };
    }, []);

    React.useEffect(() => {
        if (!api_base.api) {
            setStatus('Connect Deriv to start analysis.');
            return;
        }

        let mounted = true;

        const subscribe = async () => {
            try {
                await api_base.api.send({ ticks: symbol, subscribe: 1 });
                if (mounted) setStatus('Live market data connected.');
            } catch {
                if (mounted) setStatus('Unable to connect to market data.');
            }
        };

        subscribe();

        const subscription = api_base.api.onMessage().subscribe((message: any) => {
            if (!mounted) return;

            const data = message?.data ?? message;
            if (data?.tick?.symbol !== symbol) return;

            const quote = String(data.tick.quote ?? '');
            const price = Number(data.tick.quote);

            if (!Number.isFinite(price)) return;

            const decimalPart = quote.includes('.') ? quote.split('.')[1] : '';
            const lastDigit = decimalPart.length > 0
                ? Number(decimalPart.slice(-1))
                : Number(String(Math.round(price)).slice(-1));

            if (!Number.isInteger(lastDigit) || lastDigit < 0 || lastDigit > 9) return;

            setTick(price);
            setDigits(previous => [...previous.slice(-999), lastDigit]);
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe?.();
        };
    }, [symbol]);

    const recentDigits = digits.slice(-sampleSize);
    const total = recentDigits.length;

    const counts = Array.from({ length: 10 }, (_, digit) =>
        recentDigits.filter(value => value === digit).length
    );

    const percentage = (count: number) =>
        total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0.0%';

    const evenCount = counts.filter((_, digit) => digit % 2 === 0)
        .reduce((sum, count) => sum + count, 0);
    const oddCount = total - evenCount;

    const overCount = (barrier: number) =>
        counts.slice(barrier + 1).reduce((sum, count) => sum + count, 0);

    const underCount = (barrier: number) =>
        counts.slice(0, barrier).reduce((sum, count) => sum + count, 0);

    const hottest = total > 0 ? counts.indexOf(Math.max(...counts)) : null;
    const coldest = total > 0 ? counts.indexOf(Math.min(...counts)) : null;
    const lastDigit = digits.length > 0 ? digits[digits.length - 1] : null;

    const panel: React.CSSProperties = {
        padding: '14px',
        borderRadius: '10px',
        background: 'var(--general-section-1)',
        minWidth: 0,
        boxSizing: 'border-box',
    };

    const control: React.CSSProperties = {
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid var(--border-normal)',
        background: 'var(--general-main-2)',
        color: 'var(--text-general)',
        maxWidth: '100%',
    };

    const tableRow: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '0.55fr 1fr 1fr',
        gap: '6px',
        alignItems: 'center',
        padding: '9px 7px',
        borderBottom: '1px solid var(--border-normal)',
        fontSize: '13px',
    };

    const heading: React.CSSProperties = {
        marginTop: 0,
        marginBottom: '12px',
        fontSize: '17px',
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '12px',
            boxSizing: 'border-box',
            overflowWrap: 'anywhere',
        }}>
            <h2 style={{ marginTop: 0 }}>AI Market Analysis</h2>
            <p style={{ opacity: 0.7 }}>
                Live digit statistics for your selected Deriv market.
            </p>

            <div style={{ ...panel, marginBottom: '14px' }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    alignItems: 'center',
                }}>
                    <label>
                        <div style={{ marginBottom: '5px' }}>Market</div>
                        <select
                            style={control}
                            value={symbol}
                            onChange={event => {
                                setSymbol(event.target.value);
                                setDigits([]);
                                setTick(null);
                                setStatus('Changing market...');
                            }}
                        >
                            {markets.map(market => (
                                <option key={market.symbol} value={market.symbol}>
                                    {market.name}
                                </option>
                            ))}
                            {!markets.length && <option value={symbol}>{symbol}</option>}
                        </select>
                    </label>

                    <label>
                        <div style={{ marginBottom: '5px' }}>Tick sample</div>
                        <select
                            style={control}
                            value={sampleSize}
                            onChange={event => setSampleSize(Number(event.target.value))}
                        >
                            {[10, 30, 50, 100, 500, 1000].map(size => (
                                <option key={size} value={size}>{size} ticks</option>
                            ))}
                        </select>
                    </label>
                </div>

                <p style={{
                    marginBottom: 0,
                    marginTop: '12px',
                    fontSize: '13px',
                    opacity: 0.75,
                }}>
                    {status} · Sample collected: {total}/{sampleSize}
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
                gap: '10px',
                marginBottom: '14px',
            }}>
                <div style={panel}>
                    <div>Current price</div>
                    <strong style={{ fontSize: '20px' }}>{tick ?? '--'}</strong>
                </div>
                <div style={panel}>
                    <div>Last digit</div>
                    <strong style={{ fontSize: '20px' }}>{lastDigit ?? '--'}</strong>
                </div>
                <div style={panel}>
                    <div>Even</div>
                    <strong style={{ fontSize: '20px' }}>{percentage(evenCount)}</strong>
                    <div>{evenCount} ticks</div>
                </div>
                <div style={panel}>
                    <div>Odd</div>
                    <strong style={{ fontSize: '20px' }}>{percentage(oddCount)}</strong>
                    <div>{oddCount} ticks</div>
                </div>
            </div>

            <div style={{ ...panel, marginBottom: '14px' }}>
                <h3 style={heading}>Digit frequency</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                    gap: '7px',
                }}>
                    {counts.map((count, digit) => (
                        <div key={digit} style={{
                            textAlign: 'center',
                            padding: '9px 2px',
                            borderRadius: '8px',
                            background: 'var(--general-main-1)',
                        }}>
                            <strong style={{ fontSize: '18px' }}>{digit}</strong>
                            <div style={{ fontSize: '12px' }}>{count} times</div>
                            <small style={{ opacity: 0.7 }}>{percentage(count)}</small>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ ...panel, marginBottom: '14px' }}>
                <h3 style={heading}>Over analysis</h3>
                <p style={{ fontSize: '12px', opacity: 0.7, marginTop: 0 }}>
                    Percentage of sampled digits strictly greater than each barrier.
                </p>

                <div style={tableRow}>
                    <strong>Barrier</strong>
                    <strong>Count</strong>
                    <strong>Percentage</strong>
                </div>

                {Array.from({ length: 9 }, (_, barrier) => (
                    <div key={barrier} style={tableRow}>
                        <strong>Over {barrier}</strong>
                        <span>{overCount(barrier)} / {total}</span>
                        <strong>{percentage(overCount(barrier))}</strong>
                    </div>
                ))}
            </div>

            <div style={{ ...panel, marginBottom: '14px' }}>
                <h3 style={heading}>Under analysis</h3>
                <p style={{ fontSize: '12px', opacity: 0.7, marginTop: 0 }}>
                    Percentage of sampled digits strictly lower than each barrier.
                </p>

                <div style={tableRow}>
                    <strong>Barrier</strong>
                    <strong>Count</strong>
                    <strong>Percentage</strong>
                </div>

                {Array.from({ length: 9 }, (_, index) => {
                    const barrier = index + 1;
                    return (
                        <div key={barrier} style={tableRow}>
                            <strong>Under {barrier}</strong>
                            <span>{underCount(barrier)} / {total}</span>
                            <strong>{percentage(underCount(barrier))}</strong>
                        </div>
                    );
                })}
            </div>

            <div style={{ ...panel, marginBottom: '14px' }}>
                <h3 style={heading}>Matches and Differs</h3>
                <p style={{ fontSize: '12px', opacity: 0.7, marginTop: 0 }}>
                    Matches means the exact digit. Differs means every other digit.
                    The two percentages add up to 100%.
                </p>

                <div style={tableRow}>
                    <strong>Digit</strong>
                    <strong>Matches</strong>
                    <strong>Differs</strong>
                </div>

                {counts.map((matchCount, digit) => {
                    const differCount = total - matchCount;

                    return (
                        <div key={digit} style={tableRow}>
                            <strong>{digit}</strong>
                            <span>
                                <strong>{percentage(matchCount)}</strong>
                                <small style={{ display: 'block', opacity: 0.65 }}>
                                    {matchCount} ticks
                                </small>
                            </span>
                            <span>
                                <strong>{percentage(differCount)}</strong>
                                <small style={{ display: 'block', opacity: 0.65 }}>
                                    {differCount} ticks
                                </small>
                            </span>
                        </div>
                    );
                })}
            </div>

            <div style={{ ...panel, marginBottom: '14px' }}>
                <h3 style={heading}>AI analysis</h3>

                {total < sampleSize ? (
                    <p>Collecting market data. More ticks are needed for the selected sample.</p>
                ) : (
                    <p>
                        In this sample, digit {hottest} appeared most frequently
                        and digit {coldest} appeared least frequently.
                        Even digits represented {percentage(evenCount)} of the sample,
                        while odd digits represented {percentage(oddCount)}.
                    </p>
                )}

                <p style={{ fontSize: '12px', opacity: 0.65 }}>
                    These percentages describe historical observations in the selected
                    sample. They are not predictions or guaranteed winning probabilities.
                </p>
            </div>

            <div style={panel}>
                <h3 style={heading}>Recent digits</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {recentDigits.length === 0
                        ? <span style={{ opacity: 0.6 }}>Waiting for ticks...</span>
                        : recentDigits.map((digit, index) => (
                            <span
                                key={`${index}-${digit}`}
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    background: 'var(--general-main-1)',
                                    fontWeight: 600,
                                }}
                            >
                                {digit}
                            </span>
                        ))}
                </div>
            </div>
        </div>
    );
});

export default Danalysis;
