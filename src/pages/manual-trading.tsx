import React, { useEffect, useState } from 'react';
import { api_base } from '@/external/bot-skeleton';

const ManualTrading = () => {
    const [balance, setBalance] = useState<number | null>(null);
    const [currency, setCurrency] = useState('USD');
    const [connection, setConnection] = useState('Checking...');

    useEffect(() => {
        const checkConnection = () => {
            if (api_base.api?.connection?.readyState === 1) {
                setConnection('Connected');
            } else {
                setConnection('Not connected');
            }
        };

        checkConnection();

        const interval = window.setInterval(checkConnection, 1000);

        const subscription = api_base.api?.onMessage()?.subscribe((message: any) => {
            const data = message?.data;

            if (data?.msg_type === 'balance' && data?.balance) {
                setBalance(Number(data.balance.balance));
                setCurrency(data.balance.currency || 'USD');
            }
        });

        return () => {
            window.clearInterval(interval);
            subscription?.unsubscribe?.();
        };
    }, []);

    return (
        <div
            style={{
                minHeight: '100%',
                padding: '24px',
                background: '#080d1a',
                color: '#ffffff',
            }}
        >
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}
            >
                <div style={{ marginBottom: '24px' }}>
                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            color: '#00e676',
                            marginBottom: '8px',
                        }}
                    >
                        JIXIRIO
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: '28px',
                        }}
                    >
                        Manual Trading
                    </h1>

                    <p
                        style={{
                            marginTop: '8px',
                            color: '#94a3b8',
                        }}
                    >
                        Trade directly from Jixirio using your Deriv account.
                    </p>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px',
                    }}
                >
                    <div
                        style={{
                            padding: '20px',
                            borderRadius: '14px',
                            background: '#0d1526',
                            border: '1px solid #1e293b',
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
                                marginTop: '8px',
                                fontSize: '20px',
                                fontWeight: 700,
                                color:
                                    connection === 'Connected'
                                        ? '#00e676'
                                        : '#f59e0b',
                            }}
                        >
                            {connection}
                        </div>
                    </div>

                    <div
                        style={{
                            padding: '20px',
                            borderRadius: '14px',
                            background: '#0d1526',
                            border: '1px solid #1e293b',
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
                                marginTop: '8px',
                                fontSize: '20px',
                                fontWeight: 700,
                            }}
                        >
                            {balance === null
                                ? '--'
                                : `${currency} ${balance.toFixed(2)}`}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        padding: '24px',
                        borderRadius: '16px',
                        background: '#0d1526',
                        border: '1px solid #1e293b',
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0,
                            fontSize: '20px',
                        }}
                    >
                        Trade Setup
                    </h2>

                    <p style={{ color: '#94a3b8' }}>
                        Your manual trading controls will be connected here.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ManualTrading;
