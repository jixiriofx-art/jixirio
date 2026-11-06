
import React from 'react';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';

const Danalysis = observer(() => {
    const [symbol, setSymbol] = React.useState('R_100');
    const [tick, setTick] = React.useState<number | null>(null);
    const [digits, setDigits] = React.useState<number[]>([]);
    const [sampleSize, setSampleSize] = React.useState(30);
    const [contractType, setContractType] = React.useState<'over' | 'under'>('under');
    const [barrier, setBarrier] = React.useState(2);
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

            const decimals = quote.includes('.') ? quote.split('.')[1].length : 0;
            const lastDigit = decimals > 0
                ? Number(quote.replace(/[^0-9]/g, '').slice(-1))
                : Number(String(Math.round(price)).slice(-1));

            if (!Number.isFinite(lastDigit)) return;

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
        total ? `${((count / total) * 100).toFixed(1)}%` : '0.0%';

    const evenCount = recentDigits.filter(value => value % 2 === 0).length;
    const oddCount = total - evenCount;

    const qualifyingDigits = recentDigits.filter(value =>
        contractType === 'under' ? value <= barrier : value > barrier
    );

    const contractPercentage = percentage(qualifyingDigits.length);

    const hottest = total ? counts.indexOf(Math.max(...counts)) : null;
    const coldest = total ? counts.indexOf(Math.min(...counts)) : null;
    const lastDigit = digits.length ? digits[digits.length - 1] : null;

    const analysis = total < sampleSize
        ? `Collecting ticks: ${total} of ${sampleSize}.`
        : qualifyingDigits.length / total >= 0.6
            ? `${contractType === 'under' ? 'Under' : 'Over'} ${barrier} digits are frequent in this sample.`
            : qualifyingDigits.length / total <= 0.4
                ? `${contractType === 'under' ? 'Under' : 'Over'} ${barrier} digits are less frequent in this sample.`
                : 'No strong imbalance detected in this sample.';

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

    return (
        <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '12px', boxSizing: 'border-box' }}>
            <h2 style={{ marginTop: 0 }}>AI Market Analysis</h2>
            <p style={{ opacity: 0.7 }}>Live digit statistics from your selected Deriv market.</p>

            <div style={{ ...panel, marginBottom: '14px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <label>
                        <div style={{ marginBottom: '5px' }}>Market</div>
                        <select style={control} value={symbol} onChange={event => {
                            setSymbol(event.target.value);
                            setDigits([]);
                            setTick(null);
                            setStatus('Changing market...');
                        }}>
                            <option value="R_100">Volatility 100</option>
                            <option value="R_75">Volatility 75</option>
                            <option value="R_50">Volatility 50</option>
                            <option value="R_25">Volatility 25</option>
                            <option value="R_10">Volatility 10</option>
                        </select>
                    </label>

                    <label>
                        <div style={{ marginBottom: '5px' }}>Tick sample</div>
                        <select style={control} value={sampleSize} onChange={event => setSampleSize(Number(event.target.value))}>
                            {[10, 30, 50, 100, 500, 1000].map(size =>
                                <option key={size} value={size}>{size} ticks</option>
                            )}
                        </select>
                    </label>

                    <label>
                        <div style={{ marginBottom: '5px' }}>Contract</div>
                        <select style={control} value={contractType} onChange={event => setContractType(event.target.value as 'over' | 'under')}>
                            <option value="under">Under</option>
                            <option value="over">Over</option>
                        </select>
                    </label>

                    <label>
                        <div style={{ marginBottom: '5px' }}>Barrier digit</div>
                        <select style={control} value={barrier} onChange={event => setBarrier(Number(event.target.value))}>
                            {Array.from({ length: 10 }, (_, digit) =>
                                <option key={digit} value={digit}>{digit}</option>
                            )}
                        </select>
                    </label>
                </div>

                <p style={{ marginBottom: 0, marginTop: '12px', fontSize: '13px', opacity: 0.75 }}>
                    {status} · Sample: {total}/{sampleSize} ticks
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px', marginBottom: '14px' }}>
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
                    <strong style={{ fontSize: '20px' }}>{evenCount}</strong>
                    <div>{percentage(evenCount)}</div>
                </div>
                <div style={panel}>
                    <div>Odd</div>
                    <strong style={{ fontSize: '20px' }}>{oddCount}</strong>
                    <div>{percentage(oddCount)}</div>
                </div>
            </div>

            <div style={{ ...panel, marginBottom: '14px' }}>
                <h3 style={{ marginTop: 0 }}>Digit frequency</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px' }}>
                    {counts.map((count, digit) => (
                        <div key={digit} style={{ textAlign: 'center', padding: '10px 3px', borderRadius: '8px', background: 'var(--general-main-1)' }}>
                            <strong style={{ fontSize: '18px' }}>{digit}</strong>
                            <div>{count} times</div>
                            <small style={{ opacity: 0.7 }}>{percentage(count)}</small>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ ...panel, marginBottom: '14px' }}>
                <h3 style={{ marginTop: 0 }}>{contractType === 'under' ? 'Under' : 'Over'} {barrier} analysis</h3>
                <strong style={{ fontSize: '28px' }}>{contractPercentage}</strong>
                <p style={{ margin: '5px 0 12px', opacity: 0.75 }}>
                    {qualifyingDigits.length} of {total} sampled digits qualify.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '6px' }}>
                    {Array.from({ length: 10 }, (_, digit) => {
                        const qualifies = contractType === 'under' ? digit <= barrier : digit > barrier;
                        return (
                            <div key={digit} style={{
                                textAlign: 'center',
                                padding: '8px 2px',
                                borderRadius: '7px',
                                background: qualifies ? 'var(--status-success)' : 'var(--general-main-1)',
                                color: qualifies ? 'white' : 'var(--text-general)',
                                opacity: qualifies ? 1 : 0.65,
                            }}>
                                <strong>{digit}</strong>
                                <div style={{ fontSize: '11px' }}>{percentage(counts[digit])}</div>
                            </div>
                        );
                    })}
                </div>
                <p style={{ fontSize: '12px', opacity: 0.65, marginBottom: 0 }}>
                    Under includes digits up to and including the selected barrier. Over includes digits above it.
                </p>
            </div>

            <div style={{ ...panel, marginBottom: '14px' }}>
                <h3 style={{ marginTop: 0 }}>AI analysis</h3>
                <strong>{analysis}</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                    <div style={panel}>
                        <div>Hottest digit</div>
                        <strong style={{ fontSize: '22px' }}>{hottest ?? '--'}</strong>
                    </div>
                    <div style={panel}>
                        <div>Coldest digit</div>
                        <strong style={{ fontSize: '22px' }}>{coldest ?? '--'}</strong>
                    </div>
                </div>
                <p style={{ fontSize: '12px', opacity: 0.65 }}>
                    Historical frequencies are observations, not predictions or guaranteed winning probabilities.
                </p>
            </div>

            <div style={panel}>
                <h3 style={{ marginTop: 0 }}>Recent digits</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {recentDigits.length === 0
                        ? <span style={{ opacity: 0.6 }}>Waiting for ticks...</span>
                        : recentDigits.map((digit, index) => (
                            <span key={`${index}-${digit}`} style={{
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                background: digit % 2 === 0 ? 'var(--general-main-1)' : 'var(--general-section-2)',
                                fontWeight: 600,
                            }}>{digit}</span>
                        ))}
                </div>
            </div>
        </div>
    );
});

export default Danalysis;
