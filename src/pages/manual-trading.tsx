import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';

const ManualTrading = observer(() => {
    const { client } = useStore();

    const is_connected = !!api_base.api && api_base.is_authorized;
    const balance = client?.balance ?? api_base.account_info?.balance ?? 0;
    const currency = client?.currency ?? api_base.account_info?.currency ?? 'USD';

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
                <h2 style={{ marginBottom: '8px' }}>Manual Trading</h2>

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
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
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
                        <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                            Connection
                        </div>

                        <div
                            style={{
                                marginTop: '6px',
                                fontWeight: 700,
                                color: is_connected ? '#22c55e' : '#f59e0b',
                            }}
                        >
                            {is_connected ? 'Connected' : 'Not connected'}
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
                        <div style={{ color: '#94a3b8', fontSize: '13px' }}>
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
                    <h3 style={{ marginTop: 0 }}>Trading Workspace</h3>

                    <p style={{ color: '#94a3b8' }}>
                        Market selection, contract settings and the Buy
                        controls will be connected here next.
                    </p>
                </div>
            </div>
        </div>
    );
});

export default ManualTrading;
