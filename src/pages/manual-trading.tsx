import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';

const ManualTrading = observer(() => {
    const { client } = useStore();

    const [symbol, setSymbol] = React.useState('R_100');
    const [contract_type, setContractType] = React.useState('CALL');
    const [stake, setStake] = React.useState('1');
    const [duration, setDuration] = React.useState('5');
    const [status, setStatus] = React.useState('Ready');
    const [result, setResult] = React.useState('');
    const [is_trading, setIsTrading] = React.useState(false);

    const is_connected = !!api_base.api && api_base.is_authorized;
    const balance = client?.balance ?? api_base.account_info?.balance ?? 0;
    const currency =
        client?.currency ?? api_base.account_info?.currency ?? 'USD';

    React.useEffect(() => {
        if (!api_base.api) return;

        const subscription = api_base.api
            .onMessage()
            .subscribe(({ data }: any) => {
                if (data?.msg_type === 'proposal_open_contract') {
                    const contract = data.proposal_open_contract;

                    if (!contract) return;

                    if (contract.is_sold) {
                        const profit = Number(contract.profit ?? 0);

                        setIsTrading(false);
                        setStatus(profit >= 0 ? 'Won' : 'Lost');
                        setResult(
                            `${profit >= 0 ? '+' : ''}${profit.toFixed(
                                2
                            )} ${currency}`
                        );
                    }
                }

                if (data?.msg_type === 'buy' && data?.buy?.contract_id) {
                    setStatus('Trade opened');
                    setResult(`Contract #${data.buy.contract_id}`);

                    api_base.api?.send({
                        proposal_open_contract: 1,
                        contract_id: data.buy.contract_id,
                        subscribe: 1,
                    });
                }

                if (data?.error) {
                    setIsTrading(false);
                    setStatus('Error');
                    setResult(
                        data.error.message || 'Trade failed'
                    );
                }
            });

        return () => {
            subscription.unsubscribe();
        };
    }, [currency]);

    const buy_trade = async () => {
        if (!api_base.api || !api_base.is_authorized) {
            setStatus('Not connected');
            setResult('Connect your Deriv account first.');
            return;
        }

        const amount = Number(stake);
        const ticks = Number(duration);

        if (!amount || amount <= 0) {
            setStatus('Invalid stake');
            setResult('Enter a valid stake amount.');
            return;
        }

        if (!ticks || ticks <= 0) {
            setStatus('Invalid duration');
            setResult('Enter a valid duration.');
            return;
        }

        if (amount > Number(balance)) {
            setStatus('Insufficient balance');
            setResult(
                'Your stake is greater than your available balance.'
            );
            return;
        }

        try {
            setIsTrading(true);
            setStatus('Getting price...');
            setResult('');

            const proposal_response: any =
                await api_base.api.send({
                    proposal: 1,
                    amount,
                    basis: 'stake',
                    contract_type,
                    currency,
                    duration: ticks,
                    duration_unit: 't',
                    symbol,
                });

            if (proposal_response?.error) {
                throw new Error(
                    proposal_response.error.message
                );
            }

            const proposal = proposal_response?.proposal;

            if (!proposal?.id || !proposal?.ask_price) {
                throw new Error(
                    'No valid trade proposal was received.'
                );
            }

            setStatus('Buying...');

            const buy_response: any =
                await api_base.api.send({
                    buy: proposal.id,
                    price: Number(proposal.ask_price),
                });

            if (buy_response?.error) {
                throw new Error(
                    buy_response.error.message
                );
            }

            if (!buy_response?.buy?.contract_id) {
                throw new Error(
                    'Deriv did not return a contract.'
                );
            }

            setStatus('Trade opened');
            setResult(
                `Contract #${buy_response.buy.contract_id}`
            );
        } catch (error: any) {
            setIsTrading(false);
            setStatus('Error');
            setResult(
                error?.message || 'Unable to place trade.'
            );
        }
    };

    return (
        <div
            style={{
                minHeight: '100%',
                padding: '20px',
                background: '#080d1a',
                color: '#ffffff',
            }}
        >
            <div
                style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                }}
            >
                <h2 style={{ marginBottom: '8px' }}>
                    Manual Trading
                </h2>

                <p
                    style={{
                        marginTop: 0,
                        color: '#94a3b8',
                    }}
                >
                    Trade directly from Jixirio using your Deriv account.
                </p>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(2, minmax(0, 1fr))',
                        gap: '12px',
                        marginTop: '20px',
                    }}
                >
                    <div
                        style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: '#111827',
                            border: '1px solid #1f2937',
                        }}
                    >
                        <div
                            style={{
                                color: '#94a3b8',
                                fontSize: '13px',
                            }}
                        >
                            Connection
                        </div>

                        <div
                            style={{
                                marginTop: '6px',
                                fontWeight: 700,
                                color: is_connected
                                    ? '#22c55e'
                                    : '#f59e0b',
                            }}
                        >
                            {is_connected
                                ? 'Connected'
                                : 'Not connected'}
                        </div>
                    </div>

                    <div
                        style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: '#111827',
                            border: '1px solid #1f2937',
                        }}
                    >
                        <div
                            style={{
                                color: '#94a3b8',
                                fontSize: '13px',
                            }}
                        >
                            Balance
                        </div>

                        <div
                            style={{
                                marginTop: '6px',
                                fontWeight: 700,
                            }}
                        >
                            {Number(balance).toFixed(2)} {currency}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        marginTop: '20px',
                        padding: '20px',
                        borderRadius: '14px',
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>
                        Trading Workspace
                    </h3>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(2, minmax(0, 1fr))',
                            gap: '14px',
                        }}
                    >
                        <label>
                            <div
                                style={{
                                    marginBottom: '6px',
                                    color: '#94a3b8',
                                    fontSize: '13px',
                                }}
                            >
                                Market
                            </div>

                            <select
                                value={symbol}
                                onChange={e =>
                                    setSymbol(e.target.value)
                                }
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: '#111827',
                                    color: '#ffffff',
                                    border:
                                        '1px solid #334155',
                                }}
                            >
                                <option value="R_100">
                                    Volatility 100
                                </option>

                                <option value="R_75">
                                    Volatility 75
                                </option>

                                <option value="R_50">
                                    Volatility 50
                                </option>

                                <option value="R_25">
                                    Volatility 25
                                </option>

                                <option value="R_10">
                                    Volatility 10
                                </option>
                            </select>
                        </label>

                        <label>
                            <div
                                style={{
                                    marginBottom: '6px',
                                    color: '#94a3b8',
                                    fontSize: '13px',
                                }}
                            >
                                Contract
                            </div>

                            <select
                                value={contract_type}
                                onChange={e =>
                                    setContractType(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: '#111827',
                                    color: '#ffffff',
                                    border:
                                        '1px solid #334155',
                                }}
                            >
                                <option value="CALL">
                                    Rise
                                </option>

                                <option value="PUT">
                                    Fall
                                </option>
                            </select>
                        </label>

                        <label>
                            <div
                                style={{
                                    marginBottom: '6px',
                                    color: '#94a3b8',
                                    fontSize: '13px',
                                }}
                            >
                                Stake
                            </div>

                            <input
                                type="number"
                                min="0.35"
                                step="0.01"
                                value={stake}
                                onChange={e =>
                                    setStake(e.target.value)
                                }
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: '#111827',
                                    color: '#ffffff',
                                    border:
                                        '1px solid #334155',
                                }}
                            />
                        </label>

                        <label>
                            <div
                                style={{
                                    marginBottom: '6px',
                                    color: '#94a3b8',
                                    fontSize: '13px',
                                }}
                            >
                                Duration (ticks)
                            </div>

                            <select
                                value={duration}
                                onChange={e =>
                                    setDuration(e.target.value)
                                }
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: '#111827',
                                    color: '#ffffff',
                                    border:
                                        '1px solid #334155',
                                }}
                            >
                                <option value="1">
                                    1 tick
                                </option>

                                <option value="3">
                                    3 ticks
                                </option>

                                <option value="5">
                                    5 ticks
                                </option>

                                <option value="10">
                                    10 ticks
                                </option>
                            </select>
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={buy_trade}
                        disabled={
                            is_trading || !is_connected
                        }
                        style={{
                            width: '100%',
                            marginTop: '18px',
                            padding: '14px',
                            border: 0,
                            borderRadius: '10px',
                            background:
                                is_trading || !is_connected
                                    ? '#334155'
                                    : '#16a34a',
                            color: '#ffffff',
                            fontWeight: 700,
                            cursor:
                                is_trading || !is_connected
                                    ? 'not-allowed'
                                    : 'pointer',
                        }}
                    >
                        {is_trading
                            ? 'Trading...'
                            : 'Buy Trade'}
                    </button>

                    <div
                        style={{
                            marginTop: '18px',
                            padding: '14px',
                            borderRadius: '10px',
                            background: '#111827',
                            border: '1px solid #1f2937',
                        }}
                    >
                        <div
                            style={{
                                color: '#94a3b8',
                                fontSize: '13px',
                            }}
                        >
                            Status
                        </div>

                        <div
                            style={{
                                marginTop: '5px',
                                fontWeight: 700,
                            }}
                        >
                            {status}
                        </div>

                        {result && (
                            <div
                                style={{
                                    marginTop: '5px',
                                    color: '#cbd5e1',
                                }}
                            >
                                {result}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ManualTrading;
