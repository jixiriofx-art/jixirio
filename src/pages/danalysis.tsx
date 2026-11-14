
import React from 'react';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';

const Danalysis = observer(() => {
    const [symbol, setSymbol] = React.useState('R_100');
    const [tick, setTick] = React.useState<number | null>(null);
    const [digits, setDigits] = React.useState<number[]>([]);
    const [sampleSize, setSampleSize] = React.useState(30);
    const [status, setStatus] = React.useState('Waiting for market data...');

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

    const rankedDigits = counts
        .map((count, digit) => ({ digit, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
        .sort((a, b) => b.count - a.count || a.digit - b.digit);
    const hottest = total > 0 ? rankedDigits[0].digit : null;
    const secondHottest = total > 0 ? rankedDigits[1].digit : null;
    const coldest = total > 0 ? rankedDigits[9].digit : null;
    const secondColdest = total > 0 ? rankedDigits[8].digit : null;
    const lastDigit = digits.length > 0 ? digits[digits.length - 1] : null;

    const getDigitRank = (digit: number): 'highest' | 'second-highest' | 'lowest' | 'second-lowest' | 'neutral' => {
        if (total === 0) return 'neutral';
        if (digit === hottest) return 'highest';
        if (digit === secondHottest) return 'second-highest';
        if (digit === coldest) return 'lowest';
        if (digit === secondColdest) return 'second-lowest';
        return 'neutral';
    };

    const digitRankStyles: Record<string, React.CSSProperties> = {
        highest: {
            background: 'linear-gradient(145deg, rgba(0, 230, 118, 0.24), rgba(0, 230, 118, 0.08))',
            border: '2px solid #00e676',
            color: '#5dffa9',
            boxShadow: '0 0 16px rgba(0, 230, 118, 0.16)',
        },
        'second-highest': {
            background: 'linear-gradient(145deg, rgba(56, 189, 248, 0.22), rgba(56, 189, 248, 0.07))',
            border: '2px solid #38bdf8',
            color: '#7dd3fc',
            boxShadow: '0 0 14px rgba(56, 189, 248, 0.13)',
        },
        lowest: {
            background: 'linear-gradient(145deg, rgba(248, 75, 85, 0.22), rgba(248, 75, 85, 0.07))',
            border: '2px solid #f84b55',
            color: '#ff8b91',
            boxShadow: '0 0 14px rgba(248, 75, 85, 0.13)',
        },
        'second-lowest': {
            background: 'linear-gradient(145deg, rgba(255, 171, 64, 0.22), rgba(255, 171, 64, 0.07))',
            border: '2px solid #ffab40',
            color: '#ffd08a',
            boxShadow: '0 0 14px rgba(255, 171, 64, 0.12)',
        },
        neutral: {
            background: 'rgba(255, 255, 255, 0.035)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--text-general)',
        },
    };

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
                            <option value="R_100">Volatility 100</option>
                            <option value="R_75">Volatility 75</option>
                            <option value="R_50">Volatility 50</option>
                            <option value="R_25">Volatility 25</option>
                            <option value="R_10">Volatility 10</option>
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
                <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '-4px', marginBottom: '14px' }}>
                    Live percentage share for each digit in the selected tick sample.
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                    gap: '12px 8px',
                }}>
                    {counts.map((count, digit) => {
                        const rank = getDigitRank(digit);
                        const rankLabel = {
                            highest: 'HIGHEST',
                            'second-highest': '2ND HIGH',
                            lowest: 'LOWEST',
                            'second-lowest': '2ND LOW',
                            neutral: '',
                        }[rank];

                        return (
                            <div key={digit} style={{
                                minWidth: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '5px',
                            }}>
                                <div style={{
                                    width: 'clamp(48px, 13vw, 72px)',
                                    height: 'clamp(48px, 13vw, 72px)',
                                    borderRadius: '50%',
                                    boxSizing: 'border-box',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1px',
                                    ...digitRankStyles[rank],
                                }}>
                                    <strong style={{ fontSize: '20px', lineHeight: 1.1 }}>{digit}</strong>
                                    <span style={{ fontSize: '10px', fontWeight: 800, lineHeight: 1.2 }}>
                                        {percentage(count)}
                                    </span>
                                </div>
                                <small style={{
                                    minHeight: '12px',
                                    fontSize: '8px',
                                    fontWeight: 800,
                                    letterSpacing: '0.035em',
                                    textAlign: 'center',
                                    color: rank === 'neutral' ? 'var(--text-less-prominent)' : digitRankStyles[rank].color,
                                }}>
                                    {rankLabel || '\u00a0'}
                                </small>
                                <small style={{ fontSize: '10px', opacity: 0.6 }}>
                                    {count} ticks
                                </small>
                            </div>
                        );
                    })}
                </div>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '9px 14px',
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-normal)',
                }}>
                    {[
                        ['#00e676', 'Highest'],
                        ['#38bdf8', '2nd highest'],
                        ['#f84b55', 'Lowest'],
                        ['#ffab40', '2nd lowest'],
                    ].map(([color, label]) => (
                        <span key={label} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '10px',
                            color: 'var(--text-less-prominent)',
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: color,
                                display: 'inline-block',
                            }} />
                            {label}
                        </span>
                    ))}
                </div>
                {total === 0 && (
                    <p style={{ marginBottom: 0, fontSize: '12px', opacity: 0.65 }}>
                        Circles will show live percentages once market ticks arrive.
                    </p>
                )}
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
