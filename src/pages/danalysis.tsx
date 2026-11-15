import React from 'react';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';

type Tick = { digit: number; quote: number; epoch: number };
type Market = { symbol: string; display_name: string; market_display_name?: string; submarket_display_name?: string; pip?: number };
type Contract = 'Even/Odd' | 'Over/Under' | 'Matches/Differs' | 'Rise/Fall';
const SAMPLE_OPTIONS = [30, 50, 100, 500, 1000];
const CONTRACTS: Contract[] = ['Even/Odd', 'Over/Under', 'Matches/Differs', 'Rise/Fall'];
const COLORS: Record<string, string> = { high: '#10B981', second: '#06B6D4', low: '#EF4444', secondLow: '#F59E0B', neutral: '#2D3748' };

const SmartAnalyzer = observer(() => {
    const [symbol, setSymbol] = React.useState('1HZ25V');
    const [markets, setMarkets] = React.useState<Market[]>([]);
    const [marketSearch, setMarketSearch] = React.useState('');
    const [sampleSize, setSampleSize] = React.useState(1000);
    const [ticks, setTicks] = React.useState<Tick[]>([]);
    const [status, setStatus] = React.useState('Connecting to Deriv...');
    const [marketStatus, setMarketStatus] = React.useState('Loading Deriv markets...');
    const [lastDigit, setLastDigit] = React.useState<number | null>(null);
    const [lastTickTime, setLastTickTime] = React.useState(0);
    const [contract, setContract] = React.useState<Contract>('Even/Odd');
    const [selectedSide, setSelectedSide] = React.useState('EVEN');
    const [barrier, setBarrier] = React.useState(5);

    const digitOf = React.useCallback((quote: number, precision?: number) => {
        const decimals = Number.isInteger(precision) && Number(precision) >= 0 && Number(precision) <= 10
            ? Number(precision)
            : ((String(quote).split('.')[1] || '').length);
        return Number(Number(quote).toFixed(decimals).replace('.', '').slice(-1));
    }, []);

    const normalizeMarkets = React.useCallback((items: any[]): Market[] => items
        .filter((item: any) => item?.symbol && item?.display_name)
        .map((item: any) => ({
            symbol: String(item.symbol),
            display_name: String(item.display_name),
            market_display_name: item.market_display_name,
            submarket_display_name: item.submarket_display_name,
            pip: Number(item.pip),
        }))
        .sort((a: Market, b: Market) => a.display_name.localeCompare(b.display_name)), []);

    // Deriv's API send() is event-based (it does not return a response promise).
    // Listen first, then request active_symbols through the shared WebSocket.
    React.useEffect(() => {
        const api = api_base.api;
        if (!api) { setMarketStatus('Deriv connection is not ready yet.'); return; }
        let alive = true;
        if (Array.isArray(api_base.active_symbols) && api_base.active_symbols.length) {
            const cached = normalizeMarkets(api_base.active_symbols);
            if (cached.length) { setMarkets(cached); setMarketStatus(cached.length + ' Deriv markets loaded'); }
        }
        const stream = api.onMessage().subscribe(({ data }: any) => {
            if (!alive) return;
            if (data?.msg_type === 'active_symbols' && Array.isArray(data.active_symbols)) {
                const available = normalizeMarkets(data.active_symbols);
                if (available.length) {
                    setMarkets(available);
                    setMarketStatus(available.length + ' Deriv markets loaded');
                } else setMarketStatus('Deriv returned no markets.');
            }
            if (data?.error && data?.echo_req?.active_symbols) {
                setMarketStatus(data.error.message || 'Unable to load Deriv markets.');
            }
        });
        try {
            api.send({ active_symbols: 'brief' });
        } catch (error: any) {
            setMarketStatus(error?.message || 'Unable to request Deriv markets.');
        }
        return () => { alive = false; stream.unsubscribe(); };
    }, [normalizeMarkets]);

    // Keep the latest 1,000 ticks for the selected market; sample-size changes do not reconnect.
    React.useEffect(() => {
        const api = api_base.api;
        if (!api) { setStatus('Connect to Deriv to load market data.'); return; }
        let alive = true;
        let lastEpoch = 0;
        let subscriptionId: string | undefined;
        const selectedMarket = markets.find(item => item.symbol === symbol);
        const precision = selectedMarket?.pip;
        setTicks([]);
        setLastDigit(null);
        setStatus('Loading latest 1,000 ticks...');
        const stream = api.onMessage().subscribe(({ data }: any) => {
            if (!alive) return;
            if (data?.error && data?.echo_req?.ticks_history === symbol) {
                setStatus(data.error.message || 'Market data error');
                return;
            }
            if (data?.msg_type === 'history' && data?.echo_req?.ticks_history === symbol && data.history) {
                const initial = (data.history.prices || []).map((quote: number, index: number) => ({
                    quote: Number(quote),
                    digit: digitOf(Number(quote), precision),
                    epoch: Number(data.history.times?.[index] ?? index),
                })).slice(-1000);
                lastEpoch = initial.length ? initial[initial.length - 1].epoch : 0;
                setTicks(initial);
                if (initial.length) setLastDigit(initial[initial.length - 1].digit);
                setStatus('Live market data connected');
            }
            if (data?.msg_type === 'tick' && data.tick?.symbol === symbol) {
                const epoch = Number(data.tick.epoch);
                if (epoch <= lastEpoch) return;
                lastEpoch = epoch;
                const quote = Number(data.tick.quote);
                if (!Number.isFinite(quote)) return;
                const digit = digitOf(quote, precision);
                setTicks(previous => [...previous.slice(-999), { quote, digit, epoch }]);
                setLastDigit(digit);
                setLastTickTime(epoch);
                if (data.tick.id) subscriptionId = data.tick.id;
            }
        });
        try {
            api.send({ ticks_history: symbol, end: 'latest', count: 1000, style: 'ticks', subscribe: 1 });
        } catch (error: any) {
            setStatus(error?.message || 'Unable to request market history.');
        }
        return () => {
            alive = false;
            stream.unsubscribe();
            if (subscriptionId) api.forget(subscriptionId).catch(() => undefined);
        };
    }, [symbol, markets, digitOf]);

    React.useEffect(() => {
        if (contract === 'Even/Odd') setSelectedSide('EVEN');
        if (contract === 'Over/Under') setSelectedSide('OVER');
        if (contract === 'Matches/Differs') setSelectedSide('MATCHES');
        if (contract === 'Rise/Fall') setSelectedSide('RISE');
    }, [contract]);

    const selectedTicks = ticks.slice(-sampleSize);
    const total = selectedTicks.length;
    const last25 = selectedTicks.slice(-25);
    const counts = Array.from({ length: 10 }, (_, digit) => selectedTicks.filter(tick => tick.digit === digit).length);
    const ranking = counts.map((count, digit) => ({ count, digit })).sort((a, b) => b.count - a.count || a.digit - b.digit);
    const rankFor = (digit: number) => {
        if (!total) return 'neutral';
        if (ranking[0].digit === digit) return 'high';
        if (ranking[1].digit === digit) return 'second';
        if (ranking[9].digit === digit) return 'low';
        if (ranking[8].digit === digit) return 'secondLow';
        return 'neutral';
    };
    const percent = (count: number, size: number) => size ? count / size * 100 : 0;
    const pairStats = (source: Tick[]) => {
        const n = source.length;
        let first = 0, second = 0, tie = 0;
        if (contract === 'Even/Odd') {
            first = source.filter(tick => tick.digit % 2 === 0).length;
            second = n - first;
        } else if (contract === 'Over/Under') {
            first = source.filter(tick => tick.digit > barrier).length;
            second = source.filter(tick => tick.digit < barrier).length;
            tie = source.filter(tick => tick.digit === barrier).length;
        } else if (contract === 'Matches/Differs') {
            first = source.filter(tick => tick.digit === barrier).length;
            second = n - first;
        } else {
            for (let i = 1; i < source.length; i++) {
                if (source[i].quote > source[i - 1].quote) first++;
                else if (source[i].quote < source[i - 1].quote) second++;
                else tie++;
            }
        }
        const denominator = contract === 'Rise/Fall' ? Math.max(0, n - 1) : n;
        return { first, second, tie, denominator, firstPct: percent(first, denominator), secondPct: percent(second, denominator), tiePct: percent(tie, denominator) };
    };
    const shortStats = pairStats(last25);
    const sampleStats = pairStats(selectedTicks);
    const sides = contract === 'Even/Odd' ? ['EVEN', 'ODD']
        : contract === 'Over/Under' ? ['OVER', 'UNDER']
        : contract === 'Matches/Differs' ? ['MATCHES', 'DIFFERS'] : ['RISE', 'FALL'];
    const firstLabel = sides[0], secondLabel = sides[1];
    const signalSide = shortStats.denominator >= 20 && Math.max(shortStats.firstPct, shortStats.secondPct) >= 60
        ? (shortStats.firstPct >= shortStats.secondPct ? firstLabel : secondLabel) : '';
    const last = ticks[ticks.length - 1];
    const chosenMarket = markets.find(item => item.symbol === symbol);
    const filteredMarkets = markets.filter(item => (item.display_name + ' ' + item.symbol + ' ' + (item.market_display_name || '') + ' ' + (item.submarket_display_name || '')).toLowerCase().includes(marketSearch.toLowerCase()));

    const panel: React.CSSProperties = { background: '#131B24', border: '1px solid #202C38', borderRadius: 14, padding: 13, minWidth: 0, boxSizing: 'border-box' };
    const muted: React.CSSProperties = { color: '#91A0AE' };
    const control: React.CSSProperties = { background: '#101820', color: '#E8EEF4', border: '1px solid #2D3945', borderRadius: 9, padding: '9px 10px', minWidth: 0, maxWidth: '100%' };
    const choiceStyle = (side: string): React.CSSProperties => ({
        ...control, flex: 1, fontSize: 11, textAlign: 'left', minHeight: 42,
        borderColor: selectedSide === side ? '#06B6D4' : '#2D3945',
        background: selectedSide === side ? '#12313A' : '#101820',
        color: selectedSide === side ? '#67E8F9' : '#C5D0DA',
        fontWeight: 700,
    });

    return <div style={{ background: '#0B1117', color: '#E8EEF4', minHeight: '100%', padding: '12px 12px 24px', boxSizing: 'border-box', width: '100%', maxWidth: 850, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div><div style={{ fontSize: 18, fontWeight: 800 }}>Smart Analyzer</div><div style={{ ...muted, fontSize: 11 }}>Live market statistics · Deriv</div></div>
            <span style={{ color: status.toLowerCase().includes('connected') ? '#34D399' : '#FBBF24', fontSize: 10, fontWeight: 800 }}>● {status.toLowerCase().includes('connected') ? 'LIVE' : 'CONNECTING'}</span>
        </div>

        <div style={{ ...panel, marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 9 }}>
                <label style={{ minWidth: 0 }}><div style={{ ...muted, fontSize: 9, marginBottom: 5 }}>MARKET</div><select value={symbol} onChange={event => setSymbol(event.target.value)} style={{ ...control, width: '100%', fontSize: 11 }}>{markets.some(item => item.symbol === symbol) ? null : <option value={symbol}>Volatility 25 (1s) Index</option>}{markets.map(item => <option key={item.symbol} value={item.symbol}>{item.display_name}</option>)}</select></label>
                <label style={{ minWidth: 0 }}><div style={{ ...muted, fontSize: 9, marginBottom: 5 }}>ANALYSIS TICKS</div><select value={sampleSize} onChange={event => setSampleSize(Number(event.target.value))} style={{ ...control, width: '100%', fontSize: 11 }}>{SAMPLE_OPTIONS.map(size => <option key={size} value={size}>{size.toLocaleString()} ticks</option>)}</select></label>
            </div>
            <div style={{ ...muted, fontSize: 9, marginTop: 8 }}>{chosenMarket?.display_name || 'Volatility 25 (1s) Index'} · {marketStatus} · {total}/{sampleSize} sample ticks ready</div>
            <label style={{ display: 'block', marginTop: 9, minWidth: 0 }}><div style={{ ...muted, fontSize: 9, marginBottom: 4 }}>FIND A MARKET</div><input value={marketSearch} onChange={event => setMarketSearch(event.target.value)} placeholder="Search markets or symbols..." style={{ ...control, width: '100%', boxSizing: 'border-box', fontSize: 11 }} /></label>
            {marketSearch && <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #2D3945', borderRadius: 9, background: '#101820', marginTop: 5 }}>{filteredMarkets.slice(0, 80).map(item => <button key={item.symbol} onClick={() => { setSymbol(item.symbol); setMarketSearch(''); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 10px', color: item.symbol === symbol ? '#67E8F9' : '#D8E1E9', background: item.symbol === symbol ? '#15333A' : 'transparent', border: 0, borderBottom: '1px solid #263440', fontSize: 11 }}>{item.display_name} <span style={{ color: '#82919F' }}>· {item.symbol}</span></button>)}{filteredMarkets.length === 0 && <div style={{ padding: 10, ...muted, fontSize: 11 }}>No matching markets.</div>}</div>}
            <div style={{ ...muted, fontSize: 10, marginTop: 8 }}>{status}</div>
        </div>

        <div style={{ display: 'flex', overflowX: 'auto', gap: 6, marginBottom: 8, paddingBottom: 2 }}>
            {CONTRACTS.map(item => <button key={item} onClick={() => setContract(item)} style={{ ...control, whiteSpace: 'nowrap', flex: '0 0 auto', fontSize: 10, fontWeight: 800, borderColor: contract === item ? '#06B6D4' : '#2D3945', background: contract === item ? '#12313A' : '#131B24', color: contract === item ? '#67E8F9' : '#AAB7C4' }}>{item}</button>)}
        </div>
        <div style={{ ...panel, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            {sides.map(side => <button key={side} onClick={() => setSelectedSide(side)} style={choiceStyle(side)}>{side}</button>)}
            {(contract === 'Over/Under' || contract === 'Matches/Differs') && <label style={{ flex: '0 0 76px' }}><div style={{ ...muted, fontSize: 8, marginBottom: 3 }}>DIGIT</div><select value={barrier} onChange={event => setBarrier(Number(event.target.value))} style={{ ...control, width: '100%', fontSize: 11, padding: '10px 6px' }}>{Array.from({ length: 10 }, (_, digit) => <option key={digit} value={digit}>{digit}</option>)}</select></label>}
        </div>

        <div style={{ ...panel, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center', marginBottom: 12 }}>
                <strong style={{ fontSize: 14 }}>Last Digit Heatmap</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '3px 7px', maxWidth: 170 }}>{[['#10B981','1st High'],['#06B6D4','2nd High'],['#EF4444','1st Low'],['#F59E0B','2nd Low']].map(([color, label]) => <span key={label} style={{ ...muted, fontSize: 8, whiteSpace: 'nowrap' }}><b style={{ color }}>●</b> {label}</span>)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: '12px 5px' }}>
                {counts.map((count, digit) => {
                    const rank = rankFor(digit);
                    const color = COLORS[rank];
                    const label = ({ high: '1ST HIGH', second: '2ND HIGH', low: '1ST LOW', secondLow: '2ND LOW', neutral: '' } as any)[rank];
                    const justTicked = lastDigit === digit && lastTickTime > 0;
                    return <div key={digit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                        <div style={{ width: 'clamp(48px,13vw,66px)', height: 'clamp(48px,13vw,66px)', borderRadius: '50%', border: '2px solid ' + color, background: rank === 'neutral' ? '#1A222B' : color + '18', boxShadow: rank === 'neutral' ? 'none' : '0 0 12px ' + color + '55', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: rank === 'neutral' ? '#CBD5E1' : color, outline: justTicked ? '2px solid #E8EEF4' : 'none', outlineOffset: 3 }}>
                            <strong style={{ fontSize: 21, lineHeight: 1 }}>{digit}</strong><span style={{ fontSize: 10, fontWeight: 800, marginTop: 3 }}>{percent(count, total).toFixed(1)}%</span>
                        </div>
                        <span style={{ minHeight: 12, marginTop: 3, fontSize: 8, fontWeight: 800, color }}>{label || ' '}</span><span style={{ ...muted, fontSize: 9 }}>{count} ticks</span>
                    </div>;
                })}
            </div>
            <div style={{ ...muted, fontSize: 9, borderTop: '1px solid #293541', paddingTop: 9, marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10 }}><span><b style={{ color: COLORS.high }}>●</b> Highest</span><span><b style={{ color: COLORS.second }}>●</b> 2nd highest</span><span><b style={{ color: COLORS.low }}>●</b> Lowest</span><span><b style={{ color: COLORS.secondLow }}>●</b> 2nd lowest</span></div>
        </div>

        <div style={{ ...panel, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 5, marginBottom: 10 }}><strong style={{ fontSize: 13 }}>{contract} Comparison</strong><span style={{ ...muted, fontSize: 9 }}>{sampleSize.toLocaleString()} tick sample</span></div>
            {[{ label: 'Last 25 ticks', stats: shortStats }, { label: 'Selected sample · ' + sampleSize.toLocaleString() + ' ticks', stats: sampleStats }].map(row => <div key={row.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, ...muted, fontSize: 9, marginBottom: 5 }}><span>{row.label} ({row.stats.denominator})</span><span>{firstLabel} {row.stats.firstPct.toFixed(1)}% | {secondLabel} {row.stats.secondPct.toFixed(1)}%</span></div>
                <div style={{ height: 7, display: 'flex', background: '#263440', borderRadius: 10, overflow: 'hidden' }}><div style={{ width: row.stats.firstPct + '%', background: '#10B981' }} /><div style={{ flex: 1, background: '#06B6D4' }} /></div>
                {row.stats.tie > 0 && <div style={{ ...muted, fontSize: 8, marginTop: 3 }}>Equal / unchanged: {row.stats.tie} ({row.stats.tiePct.toFixed(1)}%)</div>}
            </div>)}
        </div>

        <div style={{ ...panel, marginBottom: 10, borderColor: signalSide ? '#087B58' : '#202C38', background: signalSide ? 'linear-gradient(120deg,#102A25,#13232B)' : '#131B24' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}><strong style={{ fontSize: 13 }}>Market Insight</strong><span style={{ color: signalSide ? '#34D399' : '#9BAAB7', fontSize: 9, fontWeight: 800 }}>{signalSide ? signalSide + ' MOMENTUM' : 'WAIT / NEUTRAL'}</span></div>
            <div style={{ color: signalSide ? '#34D399' : '#C4CED8', fontSize: 14, fontWeight: 800, marginTop: 7 }}>{signalSide ? signalSide + ' IS LEADING' : 'NO CLEAR MOMENTUM'}</div>
            <div style={{ ...muted, fontSize: 11, marginTop: 4 }}>{shortStats.denominator < 20 ? 'Collecting enough ticks for a 25-tick comparison.' : 'Last 25 ticks: ' + firstLabel + ' ' + shortStats.firstPct.toFixed(1) + '% · ' + secondLabel + ' ' + shortStats.secondPct.toFixed(1) + '%.'}</div>
            <div style={{ ...muted, fontSize: 9, marginTop: 6 }}>Historical frequency and movement only; this is not a prediction or guarantee of the next contract result.</div>
        </div>

        <div style={{ ...panel, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div><div style={{ ...muted, fontSize: 9 }}>CURRENT PRICE</div><strong>{last ? last.quote : '—'}</strong></div>
            <div><div style={{ ...muted, fontSize: 9 }}>LAST DIGIT</div><strong>{last ? last.digit : '—'}</strong></div>
            <div><div style={{ ...muted, fontSize: 9 }}>SAMPLE LOADED</div><strong>{total}/{sampleSize}</strong></div>
        </div>
    </div>;
});
export default SmartAnalyzer;
