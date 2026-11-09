import React from 'react';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';

type TickPoint = { price: number; epoch: number };

const AIAnalysis = observer(() => {
    const [symbol, setSymbol] = React.useState('R_100');
    const [markets, setMarkets] = React.useState<Array<{ symbol: string; name: string }>>([]);
    const [points, setPoints] = React.useState<TickPoint[]>([]);
    const [status, setStatus] = React.useState('Waiting for Deriv connection...');
    const [currentPrice, setCurrentPrice] = React.useState<number | null>(null);

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
                setMarkets(derived);
                if (derived.length && !derived.some((item: any) => item.symbol === symbol)) {
                    setSymbol(derived[0].symbol);
                }
                setStatus(derived.length ? 'Deriv markets loaded. Select a market to begin.' : 'No derived markets are available yet. Connect to Deriv and retry.');
            } catch {
                if (active) setStatus('Could not load Deriv markets. Check your connection.');
            }
        };
        loadMarkets();
        return () => { active = false; };
    }, []);

    React.useEffect(() => {
        const api = api_base.api;
        if (!api) {
            setStatus('Connect your Deriv account to receive live market data.');
            return;
        }
        let active = true;
        setPoints([]);
        setCurrentPrice(null);
        setStatus('Connecting to live tick stream...');
        const listener = api.onMessage().subscribe((message: any) => {
            if (!active) return;
            const data = message?.data ?? message;
            if (data?.tick?.symbol !== symbol) return;
            const price = Number(data.tick.quote);
            const epoch = Number(data.tick.epoch || Date.now() / 1000);
            if (!Number.isFinite(price)) return;
            setCurrentPrice(price);
            setPoints(previous => [...previous.slice(-99), { price, epoch }]);
            setStatus('Live Deriv data received.');
        });
        Promise.resolve(api.send({ ticks: symbol, subscribe: 1 })).catch(() => {
            if (active) setStatus('Market subscription failed. Try selecting the market again.');
        });
        return () => {
            active = false;
            listener?.unsubscribe?.();
        };
    }, [symbol]);

    const prices = points.map(point => point.price);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = prices.length > 1 ? last - first : 0;
    const changePct = first ? (change / first) * 100 : 0;
    const high = prices.length ? Math.max(...prices) : null;
    const low = prices.length ? Math.min(...prices) : null;
    const range = high !== null && low !== null ? high - low : null;
    const direction = prices.length < 10 ? 'Collecting data' : change > 0 ? 'Upward movement' : change < 0 ? 'Downward movement' : 'Sideways movement';
    const panel: React.CSSProperties = { background: 'var(--general-section-1)', border: '1px solid var(--border-normal)', borderRadius: 12, padding: 16, minWidth: 0 };
    const control: React.CSSProperties = { padding: 10, borderRadius: 8, border: '1px solid var(--border-normal)', background: 'var(--general-main-2)', color: 'var(--text-general)', maxWidth: '100%' };

    return (
        <section style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: 14, boxSizing: 'border-box' }}>
            <h2 style={{ margin: '4px 0 8px' }}>AI Market Analysis</h2>
            <p style={{ opacity: 0.72, marginTop: 0 }}>Live market conditions from Deriv ticks. This is market research, not an automatic trade signal.</p>
            <div style={{ ...panel, marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 7 }}>Derived market</label>
                <select value={symbol} onChange={event => setSymbol(event.target.value)} style={control}>
                    {markets.map(market => <option key={market.symbol} value={market.symbol}>{market.name}</option>)}
                    {!markets.length && <option value={symbol}>{symbol}</option>}
                </select>
                <p style={{ marginBottom: 0, fontSize: 12, opacity: 0.7 }}>{status} · {points.length}/100 ticks collected</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginBottom: 14 }}>
                <div style={panel}><small>Current price</small><h3 style={{ margin: '7px 0 0', overflowWrap: 'anywhere' }}>{currentPrice ?? '—'}</h3></div>
                <div style={panel}><small>Recent direction</small><h3 style={{ margin: '7px 0 0', fontSize: 17 }}>{direction}</h3></div>
                <div style={panel}><small>Change across sample</small><h3 style={{ margin: '7px 0 0', fontSize: 17 }}>{prices.length > 1 ? `${change >= 0 ? '+' : ''}${change.toFixed(5)} (${changePct.toFixed(3)}%)` : '—'}</h3></div>
                <div style={panel}><small>Observed price range</small><h3 style={{ margin: '7px 0 0', fontSize: 17 }}>{range === null ? '—' : range.toFixed(5)}</h3></div>
            </div>
            <div style={panel}>
                <h3 style={{ marginTop: 0 }}>Market conditions</h3>
                {points.length < 10 ? <p>Collecting at least 10 live ticks before describing short-term movement.</p> : (
                    <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                        <li>Direction over the collected sample: <strong>{direction}</strong>.</li>
                        <li>Highest observed price: <strong>{high}</strong>.</li>
                        <li>Lowest observed price: <strong>{low}</strong>.</li>
                        <li>Sample size: <strong>{points.length} live ticks</strong>.</li>
                    </ul>
                )}
                <p style={{ fontSize: 12, opacity: 0.65, marginBottom: 0 }}>A short-term move can reverse at any time. Historical tick movement does not establish the next contract outcome or guarantee profitability.</p>
            </div>
        </section>
    );
});

export default AIAnalysis;
