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

        const subscription = api_base.api.onMessage().subscribe((message: any) => {
            if (!mounted) return;

            const data = message?.data ?? message;

            if (data?.tick?.symbol === symbol) {
                const price = Number(data.tick.quote);

                if (Number.isFinite(price)) {
                    const last_digit = Number(String(price).replace('.', '').slice(-1));

                    setTick(price);
                    setDigits(prev => [...prev.slice(-99), last_digit]);
                }
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe?.();
        };
    }, [symbol]);

    const even_count = digits.filter(digit => digit % 2 === 0).length;
    const odd_count = digits.length - even_count;

    const over_2_count = digits.filter(digit => digit > 2).length;
    const under_2_count = digits.filter(digit => digit < 2).length;

    const last_digit = digits.length ? digits[digits.length - 1] : null;

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
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
                    <strong style={{ fontSize: '20px' }}>{even_count}</strong>
                </div>

                <div
                    style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--general-section-1)',
                    }}
                >
                    <div>Odd</div>
                    <strong style={{ fontSize: '20px' }}>{odd_count}</strong>
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
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
                        digits.slice(-30).map((digit, index) => (
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
