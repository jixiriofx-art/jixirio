import React from 'react';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';

const Danalysis = observer(() => {
    const [symbol, setSymbol] = React.useState('R_100');
    const [tick, setTick] = React.useState<number | null>(null);
    const [digits, setDigits] = React.useState<number[]>([]);
    const [status, setStatus] = React.useState('Waiting for market data...');

    React.useEffect(() => {
        if (!api_base.api) {
            setStatus('Connect Deriv to start analysis.');
            return;
        }

        let mounted = true;

        const subscribe = async () => {
            try {
                await api_base.api.send({
                    ticks: symbol,
                    subscribe: 1,
                });

                if (mounted) {
                    setStatus('Live market data connected.');
                }
            } catch {
                if (mounted) {
                    setStatus('Unable to connect to market data.');
                }
            }
        };

        subscribe();

        const subscription = api_base.api
            .onMessage()
            .subscribe((message: any) => {
                if (!mounted) return;

                const data = message?.data ?? message;

                if (data?.tick?.symbol === symbol) {
                    const quote = String(data.tick.quote ?? '');
                    const price = Number(data.tick.quote);

                    if (Number.isFinite(price)) {
                        const numeric_part = quote.replace(/[^0-9]/g, '');
                        const last_digit = numeric_part
                            ? Number(numeric_part.slice(-1))
                            : null;

                        if (last_digit !== null && Number.isFinite(last_digit)) {
                            setTick(price);

                            setDigits(prev => [
                                ...prev.slice(-999),
                                last_digit,
                            ]);
                        }
                    }
                }
            });

        return () => {
            mounted = false;
            subscription?.unsubscribe?.();
        };
    }, [symbol]);

    const total_ticks = digits.length;

    const digit_counts = Array.from({ length: 10 }, (_, digit) =>
        digits.filter(value => value === digit).length
    );

    const even_count = digits.filter(digit => digit % 2 === 0).length;
    const odd_count = total_ticks - even_count;

    const over_2_count = digits.filter(digit => digit > 2).length;
    const under_2_count = digits.filter(digit => digit < 2).length;

    const under_5_count = digits.filter(digit => digit < 5).length;
    const under_6_count = digits.filter(digit => digit < 6).length;
    const under_7_count = digits.filter(digit => digit < 7).length;
    const over_4_count = digits.filter(digit => digit > 4).length;

    const last_digit =
        digits.length > 0 ? digits[digits.length - 1] : null;

    const even_percentage =
        total_ticks > 0
            ? ((even_count / total_ticks) * 100).toFixed(1)
            : '0.0';

    const odd_percentage =
        total_ticks > 0
            ? ((odd_count / total_ticks) * 100).toFixed(1)
            : '0.0';

    const get_percentage = (count: number) =>
        total_ticks > 0
            ? `${((count / total_ticks) * 100).toFixed(1)}%`
            : '0.0%';

    const hottest_digit =
        total_ticks > 0
            ? digit_counts.indexOf(Math.max(...digit_counts))
            : null;

    const coldest_digit =
        total_ticks > 0
            ? digit_counts.indexOf(Math.min(...digit_counts))
            : null;

    const get_analysis = () => {
        if (total_ticks < 20) {
            return 'Collecting more ticks for a stronger analysis.';
        }

        if (even_count > odd_count * 1.15) {
            return 'Even digits are currently appearing more frequently.';
        }

        if (odd_count > even_count * 1.15) {
            return 'Odd digits are currently appearing more frequently.';
        }

        if (over_2_count > under_2_count * 1.5) {
            return 'Digits above 2 are dominating the recent sample.';
        }

        if (under_2_count > over_2_count * 1.5) {
            return 'Digits below 2 are dominating the recent sample.';
        }

        return 'No strong digit imbalance detected yet.';
    };

    return (
        <div
            style={{
                width: '100%',
                maxWidth: '1100px',
                margin: '0 auto',
                padding: '16px',
                boxSizing: 'border-box',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '16px',
                }}
            >
                <div>
                    <h2 style={{ margin: 0 }}>Danalysis</h2>

                    <p
                        style={{
                            margin: '6px 0 0',
                            opacity: 0.7,
                        }}
                    >
                        Analyze Deriv markets before risking a trade.
                    </p>
                </div>

                <select
                    value={symbol}
                    onChange={event => {
                        setSymbol(event.target.value);
                        setDigits([]);
                        setTick(null);
                        setStatus('Changing market...');
                    }}
                    style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--general-section-1)',
                        background: 'var(--general-main-2)',
                        color: 'var(--text-general)',
                    }}
                >
                    <option value="R_100">Volatility 100</option>
                    <option value="R_75">Volatility 75</option>
                    <option value="R_50">Volatility 50</option>
                    <option value="R_25">Volatility 25</option>
                    <option value="R_10">Volatility 10</option>
                </select>
            </div>

            <div
                style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    background: 'var(--general-section-1)',
                }}
            >
                <strong>{status}</strong>

                <div
                    style={{
                        marginTop: '5px',
                        opacity: 0.7,
                        fontSize: '13px',
                    }}
                >
                    Sample: {total_ticks} / 1000 ticks
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px',
                }}
            >
                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Current price</div>

                    <strong style={{ fontSize: '20px' }}>
                        {tick !== null ? tick : '--'}
                    </strong>
                </div>

                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Last digit</div>

                    <strong style={{ fontSize: '20px' }}>
                        {last_digit !== null ? last_digit : '--'}
                    </strong>
                </div>

                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Even</div>

                    <strong style={{ fontSize: '20px' }}>
                        {even_count}
                    </strong>

                    <div style={{ opacity: 0.7 }}>
                        {even_percentage}%
                    </div>
                </div>

                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Odd</div>

                    <strong style={{ fontSize: '20px' }}>
                        {odd_count}
                    </strong>

                    <div style={{ opacity: 0.7 }}>
                        {odd_percentage}%
                    </div>
                </div>
            </div>

            <div
                style={{
                    padding: '16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    background: 'var(--general-section-1)',
                }}
            >
                <h3 style={{ marginTop: 0 }}>Digit frequency</h3>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(5, minmax(0, 1fr))',
                        gap: '8px',
                    }}
                >
                    {digit_counts.map((count, digit) => (
                        <div
                            key={digit}
                            style={{
                                textAlign: 'center',
                                padding: '10px 4px',
                                borderRadius: '8px',
                                background:
                                    'var(--general-main-1)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 700,
                                }}
                            >
                                {digit}
                            </div>

                            <div
                                style={{
                                    fontSize: '13px',
                                    marginTop: '3px',
                                }}
                            >
                                {count}
                            </div>

                            <div
                                style={{
                                    fontSize: '11px',
                                    opacity: 0.65,
                                }}
                            >
                                {get_percentage(count)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px',
                }}
            >
                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Over 2</div>

                    <strong style={{ fontSize: '20px' }}>
                        {over_2_count}
                    </strong>

                    <div style={{ opacity: 0.7 }}>
                        {get_percentage(over_2_count)}
                    </div>
                </div>

                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Under 2</div>

                    <strong style={{ fontSize: '20px' }}>
                        {under_2_count}
                    </strong>

                    <div style={{ opacity: 0.7 }}>
                        {get_percentage(under_2_count)}
                    </div>
                </div>

                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Under 5</div>

                    <strong style={{ fontSize: '20px' }}>
                        {under_5_count}
                    </strong>

                    <div style={{ opacity: 0.7 }}>
                        {get_percentage(under_5_count)}
                    </div>
                </div>

                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Under 6</div>

                    <strong style={{ fontSize: '20px' }}>
                        {under_6_count}
                    </strong>

                    <div style={{ opacity: 0.7 }}>
                        {get_percentage(under_6_count)}
                    </div>
                </div>

                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Under 7</div>

                    <strong style={{ fontSize: '20px' }}>
                        {under_7_count}
                    </strong>

                    <div style={{ opacity: 0.7 }}>
                        {get_percentage(under_7_count)}
                    </div>
                </div>

                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Over 4</div>

                    <strong style={{ fontSize: '20px' }}>
                        {over_4_count}
                    </strong>

                    <div style={{ opacity: 0.7 }}>
                        {get_percentage(over_4_count)}
                    </div>
                </div>
            </div>

            <div
                style={{
                    padding: '16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    background: 'var(--general-section-1)',
                }}
            >
                <h3 style={{ marginTop: 0 }}>AI-style analysis</h3>

                <div
                    style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                    }}
                >
                    {get_analysis()}
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                    }}
                >
                    <div
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'var(--general-main-1)',
                        }}
                    >
                        <div style={{ opacity: 0.7 }}>
                            Hottest digit
                        </div>

                        <strong style={{ fontSize: '22px' }}>
                            {hottest_digit !== null
                                ? hottest_digit
                                : '--'}
                        </strong>
                    </div>

                    <div
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'var(--general-main-1)',
                        }}
                    >
                        <div style={{ opacity: 0.7 }}>
                            Coldest digit
                        </div>

                        <strong style={{ fontSize: '22px' }}>
                            {coldest_digit !== null
                                ? coldest_digit
                                : '--'}
                        </strong>
                    </div>
                </div>
            </div>

            <div
                style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'var(--general-section-1)',
                }}
            >
                <h3 style={{ marginTop: 0 }}>Recent digits</h3>

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                    }}
                >
                    {digits.length === 0 ? (
                        <span style={{ opacity: 0.6 }}>
                            Waiting for ticks...
                        </span>
                    ) : (
                        digits.slice(-50).map((digit, index) => (
                            <span
                                key={`${index}-${digit}`}
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    background:
                                        digit % 2 === 0
                                            ? 'var(--general-main-1)'
                                            : 'var(--general-section-2)',
                                    fontWeight: 600,
                                }}
                            >
                                {digit}
                            </span>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
});

export default Danalysis;
