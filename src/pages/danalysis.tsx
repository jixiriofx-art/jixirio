import React from 'react';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { useStore } from '@/hooks/useStore';

type ContractTab = 'EVEN_ODD' | 'OVER_UNDER' | 'MATCH_DIFF' | 'RISE_FALL';
const MARKETS = [
    ['1HZ10V', 'Volatility 10 (1s)'], ['1HZ25V', 'Volatility 25 (1s)'],
    ['1HZ50V', 'Volatility 50 (1s)'], ['1HZ75V', 'Volatility 75 (1s)'],
    ['1HZ100V', 'Volatility 100 (1s)'], ['R_10', 'Volatility 10'],
    ['R_25', 'Volatility 25'], ['R_50', 'Volatility 50'], ['R_75', 'Volatility 75'],
    ['R_100', 'Volatility 100'], ['JD10', 'Jump 10'], ['JD25', 'Jump 25'],
    ['JD50', 'Jump 50'], ['JD75', 'Jump 75'], ['JD100', 'Jump 100'], ['stpRNG', 'Step Index'],
] as const;
const TABS: { key: ContractTab; label: string; names: [string, string]; types: [string, string] }[] = [
    { key: 'EVEN_ODD', label: 'Even/Odd', names: ['BUY EVEN', 'BUY ODD'], types: ['DIGITEVEN', 'DIGITODD'] },
    { key: 'OVER_UNDER', label: 'Over/Under', names: ['BUY OVER', 'BUY UNDER'], types: ['DIGITOVER', 'DIGITUNDER'] },
    { key: 'MATCH_DIFF', label: 'Matches/Differs', names: ['BUY MATCH', 'BUY DIFFERS'], types: ['DIGITMATCH', 'DIGITDIFF'] },
    { key: 'RISE_FALL', label: 'Rise/Fall', names: ['BUY RISE', 'BUY FALL'], types: ['CALL', 'PUT'] },
];
const COLORS: Record<string, string> = { high: '#10B981', second: '#06B6D4', low: '#EF4444', secondLow: '#F59E0B', neutral: '#2D3748' };

const Danalysis = observer(() => {
    const { client } = useStore();
    const [symbol, setSymbol] = React.useState('1HZ25V');
    const [ticks, setTicks] = React.useState<{ digit: number; quote: number; epoch: number }[]>([]);
    const [status, setStatus] = React.useState('Connecting to Deriv...');
    const [tab, setTab] = React.useState<ContractTab>('EVEN_ODD');
    const [side, setSide] = React.useState(0);
    const [barrier, setBarrier] = React.useState(5);
    const [duration, setDuration] = React.useState(1);
    const [stake, setStake] = React.useState('1.00');
    const [proposal, setProposal] = React.useState<any>(null);
    const [busy, setBusy] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [riskOpen, setRiskOpen] = React.useState(false);
    const [takeProfit, setTakeProfit] = React.useState('10');
    const [stopLoss, setStopLoss] = React.useState('5');
    const [maxLosses, setMaxLosses] = React.useState('3');

    const currency = client?.currency || api_base.account_info?.currency || 'USD';
    const balance = Number(client?.balance ?? api_base.account_info?.balance ?? 0);
    const loginId = client?.loginid || api_base.account_info?.loginid || '';
    const activeTab = TABS.find(item => item.key === tab)!;
    const needsBarrier = tab === 'OVER_UNDER' || tab === 'MATCH_DIFF';
    const isAuthorized = !!api_base.api && !!api_base.is_authorized;

    const digitOf = (quote: number) => Number(Number(quote).toFixed(2).slice(-1));
    React.useEffect(() => {
        if (!api_base.api) { setStatus('Connect Deriv to load live market data.'); return; }
        let alive = true;
        let historyLoaded = false;
        let lastEpoch = 0;
        let subscriptionId: string | undefined;
        const stream = api_base.api.onMessage().subscribe(({ data }: any) => {
            if (!alive) return;
            if (data?.error && data?.echo_req?.ticks_history === symbol) {
                setStatus(data.error.message || 'Market data error');
                return;
            }
            if (data?.msg_type === 'history' && data?.echo_req?.ticks_history === symbol && data.history) {
                const initial = (data.history.prices || []).map((quote: number, index: number) => ({
                    quote: Number(quote), digit: digitOf(Number(quote)), epoch: Number(data.history.times?.[index] || index),
                })).slice(-1000);
                lastEpoch = initial.length ? initial[initial.length - 1].epoch : 0;
                setTicks(initial);
                historyLoaded = true;
                setStatus('Live market data connected');
            }
            if (data?.msg_type === 'tick' && data.tick?.symbol === symbol) {
                const epoch = Number(data.tick.epoch);
                if (epoch <= lastEpoch) return;
                lastEpoch = epoch;
                const quote = Number(data.tick.quote);
                if (!Number.isFinite(quote)) return;
                setTicks(previous => [...previous.slice(-999), { quote, digit: digitOf(quote), epoch }]);
                if (data.tick.id) subscriptionId = data.tick.id;
                if (!historyLoaded) setStatus('Receiving live ticks...');
            }
        });
        setTicks([]);
        setStatus('Loading latest 1,000 ticks...');
        api_base.api.send({ ticks_history: symbol, end: 'latest', count: 1000, style: 'ticks', subscribe: 1 })
            .then((response: any) => {
                if (!alive) return;
                if (response?.error) { setStatus(response.error.message); return; }
                if (response?.history) {
                    const initial = (response.history.prices || []).map((quote: number, index: number) => ({
                        quote: Number(quote), digit: digitOf(Number(quote)), epoch: Number(response.history.times?.[index] || index),
                    })).slice(-1000);
                    lastEpoch = initial.length ? initial[initial.length - 1].epoch : 0;
                    setTicks(initial);
                    historyLoaded = true;
                    setStatus('Live market data connected');
                }
            }).catch(() => alive && setStatus('Unable to load market history'));
        return () => {
            alive = false;
            stream.unsubscribe();
            if (subscriptionId && api_base.api) api_base.api.forget(subscriptionId).catch(() => undefined);
        };
    }, [symbol]);

    const total = ticks.length;
    const last25 = ticks.slice(-25);
    const counts = Array.from({ length: 10 }, (_, digit) => ticks.filter(t => t.digit === digit).length);
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
    const even25 = last25.filter(t => t.digit % 2 === 0).length;
    const even1000 = ticks.filter(t => t.digit % 2 === 0).length;
    const evenShort = percent(even25, last25.length);
    const oddShort = 100 - evenShort;
    const evenLong = percent(even1000, total);
    const oddLong = 100 - evenLong;
    const signal = last25.length === 25 && Math.max(evenShort, oddShort) >= 60 ? (evenShort >= oddShort ? 'EVEN' : 'ODD') : '';
    const last = ticks[ticks.length - 1];
    const contractType = activeTab.types[side];

    React.useEffect(() => {
        if (!isAuthorized || Number(stake) < 0.35 || !Number.isFinite(Number(stake))) { setProposal(null); return; }
        let alive = true;
        const request: any = { proposal: 1, amount: Number(stake), basis: 'stake', contract_type: contractType, currency, duration, duration_unit: 't', symbol };
        if (needsBarrier) request.barrier = String(barrier);
        api_base.api.send(request).then((response: any) => {
            if (alive) setProposal(response?.proposal || null);
        }).catch(() => alive && setProposal(null));
        return () => { alive = false; };
    }, [symbol, contractType, currency, duration, stake, barrier, needsBarrier, isAuthorized]);

    const buy = async () => {
        if (!isAuthorized || !proposal?.id || busy) { setMessage('Connect Deriv and wait for a live payout quote.'); return; }
        if (Number(stake) > balance) { setMessage('Stake exceeds your available balance.'); return; }
        setBusy(true);
        setMessage('Submitting trade...');
        try {
            const result: any = await api_base.api.send({ buy: proposal.id, price: Number(proposal.ask_price) });
            if (result?.error) throw new Error(result.error.message);
            setMessage(result?.buy?.contract_id ? 'Trade opened · #' + result.buy.contract_id : 'Trade request submitted.');
        } catch (error: any) { setMessage(error?.message || 'Trade failed.'); }
        finally { setBusy(false); }
    };

    const panel: React.CSSProperties = { background: '#131B24', border: '1px solid #202C38', borderRadius: 14, padding: 13, minWidth: 0, boxSizing: 'border-box' };
    const muted: React.CSSProperties = { color: '#91A0AE' };
    const control: React.CSSProperties = { background: '#101820', color: '#E8EEF4', border: '1px solid #2D3945', borderRadius: 9, padding: '9px 10px', minWidth: 0, maxWidth: '100%' };
    const smallButton: React.CSSProperties = { background: '#18232D', border: '1px solid #2D3945', color: '#C9D4DE', borderRadius: 9, padding: '9px 10px', fontSize: 11, whiteSpace: 'nowrap' };

    return <div style={{ background: '#0B1117', color: '#E8EEF4', minHeight: '100%', padding: '12px 12px 124px', boxSizing: 'border-box', width: '100%', maxWidth: 850, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <div><div style={{ fontSize: 18, fontWeight: 800 }}>Smart Analyzer</div><div style={{ ...muted, fontSize: 11 }}>Live market statistics · Deriv</div></div>
            <span style={{ color: status.toLowerCase().includes('connected') ? '#34D399' : '#FBBF24', fontSize: 10, fontWeight: 800 }}>● {status.toLowerCase().includes('connected') ? 'LIVE' : 'CONNECTING'}</span>
        </div>
        <div style={{ ...panel, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 9, marginBottom: 10 }}>
            <div><div style={{ ...muted, fontSize: 9 }}>ACCOUNT BALANCE</div><strong style={{ fontSize: 17 }}>{currency} {balance.toFixed(2)}</strong><div style={{ color: loginId.startsWith('VRTC') ? '#FBBF24' : '#34D399', fontSize: 10 }}>{loginId ? (loginId.startsWith('VRTC') ? 'Demo account' : 'Real account') : 'Not connected'}</div></div>
            <label><div style={{ ...muted, fontSize: 9, marginBottom: 4 }}>MARKET</div><select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ ...control, width: '100%', fontSize: 11 }}>{MARKETS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <div style={{ gridColumn: '1 / -1', ...muted, fontSize: 10 }}>{status} · {total}/1,000 ticks loaded</div>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
            {TABS.map(item => <button key={item.key} onClick={() => { setTab(item.key); setSide(0); }} style={{ ...smallButton, background: tab === item.key ? '#123A3A' : '#131B24', borderColor: tab === item.key ? '#06B6D4' : '#2D3945', color: tab === item.key ? '#67E8F9' : '#AAB7C4', fontWeight: 700 }}>{item.label}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
            {activeTab.names.map((name, index) => <button key={name} onClick={() => setSide(index)} style={{ ...smallButton, flex: 1, background: side === index ? '#15333A' : '#131B24', borderColor: side === index ? '#06B6D4' : '#2D3945' }}>{name.replace('BUY ', '')}</button>)}
            {needsBarrier && <select value={barrier} onChange={e => setBarrier(Number(e.target.value))} style={control}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i}>Digit {i}</option>)}</select>}
        </div>
        <div style={{ ...panel, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center', marginBottom: 12 }}><strong style={{ fontSize: 14 }}>Last Digit Heatmap</strong><div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '3px 7px', maxWidth: 170 }}>{[['#10B981','1st High'],['#06B6D4','2nd High'],['#EF4444','1st Low'],['#F59E0B','2nd Low']].map(([color, label]) => <span key={label} style={{ ...muted, fontSize: 8, whiteSpace: 'nowrap' }}><b style={{ color }}>●</b> {label}</span>)}</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: '12px 5px' }}>
                {counts.map((count, digit) => {
                    const rank = rankFor(digit);
                    const color = COLORS[rank];
                    const label = ({ high: '1ST HIGH', second: '2ND HIGH', low: '1ST LOW', secondLow: '2ND LOW', neutral: '' } as any)[rank];
                    return <div key={digit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                        <div style={{ width: 'clamp(48px,13vw,66px)', height: 'clamp(48px,13vw,66px)', borderRadius: '50%', border: '2px solid ' + color, background: rank === 'neutral' ? '#1A222B' : color + '18', boxShadow: rank === 'neutral' ? 'none' : '0 0 12px ' + color + '55', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: rank === 'neutral' ? '#CBD5E1' : color }}>
                            <strong style={{ fontSize: 21, lineHeight: 1 }}>{digit}</strong><span style={{ fontSize: 10, fontWeight: 800, marginTop: 3 }}>{percent(count, total).toFixed(1)}%</span>
                        </div>
                        <span style={{ minHeight: 12, marginTop: 3, fontSize: 8, fontWeight: 800, color }}>{label || ' '}</span><span style={{ ...muted, fontSize: 9 }}>{count} ticks</span>
                    </div>;
                })}
            </div>
            <div style={{ ...muted, fontSize: 9, borderTop: '1px solid #293541', paddingTop: 9, marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10 }}><span><b style={{ color: COLORS.high }}>●</b> Highest</span><span><b style={{ color: COLORS.second }}>●</b> 2nd highest</span><span><b style={{ color: COLORS.low }}>●</b> Lowest</span><span><b style={{ color: COLORS.secondLow }}>●</b> 2nd lowest</span></div>
        </div>
        <div style={{ ...panel, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 5, marginBottom: 10 }}><strong style={{ fontSize: 13 }}>Dual Tick Comparison</strong><span style={{ ...muted, fontSize: 9 }}>W: 0 | L: 0 | Net: {currency} 0.00</span></div>
            {[{ label: 'Last 25 ticks', even: evenShort, odd: oddShort, n: last25.length }, { label: 'Last 1,000 ticks', even: evenLong, odd: oddLong, n: total }].map(row => <div key={row.label} style={{ marginBottom: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, ...muted, fontSize: 9, marginBottom: 5 }}><span>{row.label} ({row.n})</span><span>Even {row.even.toFixed(1)}% | Odd {row.odd.toFixed(1)}%</span></div><div style={{ height: 7, display: 'flex', background: '#263440', borderRadius: 10, overflow: 'hidden' }}><div style={{ width: row.even + '%', background: '#10B981' }} /><div style={{ flex: 1, background: '#06B6D4' }} /></div></div>)}
        </div>
        <div style={{ ...panel, marginBottom: 10, borderColor: signal ? '#087B58' : '#2D3945', background: signal ? 'linear-gradient(120deg,#102A25,#13232B)' : '#131B24' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}><strong style={{ fontSize: 13 }}>Trading Signal</strong><span style={{ color: signal ? '#34D399' : '#9BAAB7', fontSize: 9, fontWeight: 800 }}>{signal ? signal + ' MOMENTUM' : 'WAIT'}</span></div>
            <div style={{ color: signal ? '#34D399' : '#C4CED8', fontSize: 15, fontWeight: 800, marginTop: 7 }}>{signal ? 'SIGNAL: BUY ' + signal : 'WAIT · NO CLEAR MOMENTUM'}</div>
            <div style={{ ...muted, fontSize: 11, marginTop: 4 }}>{last25.length < 25 ? 'Collecting the first 25 ticks (' + last25.length + '/25).' : 'Even ' + evenShort.toFixed(1) + '% · Odd ' + oddShort.toFixed(1) + '% over the last 25 ticks.'}</div>
            <div style={{ ...muted, fontSize: 9, marginTop: 6 }}>Historical momentum only; it does not predict or guarantee the next result.</div>
        </div>
        <div style={{ ...panel, display: 'flex', justifyContent: 'space-between', gap: 8 }}><div><div style={{ ...muted, fontSize: 9 }}>CURRENT PRICE</div><strong>{last ? last.quote.toFixed(2) : '—'}</strong></div><div><div style={{ ...muted, fontSize: 9 }}>LAST DIGIT</div><strong>{last ? last.digit : '—'}</strong></div><div><div style={{ ...muted, fontSize: 9 }}>SAMPLE SIZE</div><strong>{total}/1000</strong></div></div>

        <div style={{ position: 'fixed', zIndex: 50, left: 0, right: 0, bottom: 0, background: 'rgba(8,14,20,.97)', borderTop: '1px solid #263541', padding: '9px 12px calc(9px + env(safe-area-inset-bottom))', backdropFilter: 'blur(14px)' }}>
            <div style={{ maxWidth: 850, margin: '0 auto', display: 'grid', gridTemplateColumns: 'auto minmax(70px,1fr) auto minmax(100px,1.2fr)', gap: 7, alignItems: 'end' }}>
                <label><div style={{ ...muted, fontSize: 9, marginBottom: 4 }}>TICKS</div><select value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ ...control, padding: '9px 6px', fontSize: 11 }}>{[1,2,3,5].map(n => <option key={n} value={n}>{n}T</option>)}</select></label>
                <label><div style={{ ...muted, fontSize: 9, marginBottom: 4 }}>STAKE ({currency})</div><input type="number" min="0.35" step="0.01" value={stake} onChange={e => setStake(e.target.value)} style={{ ...control, width: '100%', padding: '9px 6px', boxSizing: 'border-box' }} /></label>
                <button onClick={() => setRiskOpen(true)} style={{ ...smallButton, padding: '10px 8px' }}>🛡 Risk</button>
                <button onClick={buy} disabled={busy || !proposal?.id || !isAuthorized} style={{ background: busy || !proposal?.id || !isAuthorized ? '#35434E' : 'linear-gradient(100deg,#06B6D4,#10B981)', border: 0, borderRadius: 10, color: '#04151A', fontWeight: 900, padding: 11, fontSize: 11 }}>{busy ? 'WAIT...' : activeTab.names[side]}</button>
            </div>
            <div style={{ maxWidth: 850, margin: '6px auto 0', display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 9, color: '#9BAAB7' }}><span>{message || (proposal ? 'Payout: ' + currency + ' ' + Number(proposal.payout || 0).toFixed(2) + ' · Profit: ' + currency + ' ' + (Number(proposal.payout || 0) - Number(proposal.ask_price || 0)).toFixed(2) : 'Fetching live payout quote...')}</span><span>{isAuthorized ? 'Authorized' : 'Connect Deriv'}</span></div>
        </div>
        {riskOpen && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div style={{ ...panel, width: '100%', maxWidth: 340, boxShadow: '0 20px 70px #000' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong>Risk Shield</strong><button onClick={() => setRiskOpen(false)} style={smallButton}>Close</button></div><p style={{ ...muted, fontSize: 11 }}>Personal session limits. These are saved in this screen only and do not automatically stop trades yet.</p>
                {[['Take profit', takeProfit, setTakeProfit], ['Stop loss', stopLoss, setStopLoss], ['Max consecutive losses', maxLosses, setMaxLosses]].map(([label, value, setter]: any) => <label key={label} style={{ display: 'block', marginTop: 9 }}><div style={{ fontSize: 11, marginBottom: 4 }}>{label}</div><input type="number" min="1" value={value} onChange={e => setter(e.target.value)} style={{ ...control, width: '100%', boxSizing: 'border-box' }} /></label>)}
                <button onClick={() => setRiskOpen(false)} style={{ width: '100%', marginTop: 14, padding: 11, border: 0, borderRadius: 10, background: '#0D9F78', color: '#031B17', fontWeight: 800 }}>Save limits</button>
            </div>
        </div>}
    </div>;
});
export default Danalysis;
