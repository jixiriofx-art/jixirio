
import React, { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { save_types } from '@/external/bot-skeleton/constants/save-type';
import './best-bots.scss';

type Bot = {
    number: number;
    name: string;
    description: string;
    strategy: 'MARTINGALE' | 'D_ALEMBERT' | 'MAMBA_XMAN';
};

const bots: Bot[] = [
    {
        number: 1,
        name: 'Jixirio Universal Strategy Bot',
        description:
            'Martingale strategy with configurable market, contract, stake and risk controls.',
        strategy: 'MARTINGALE',
    },
    {
        number: 2,
        name: 'Jixirio D’Alembert Strategy Bot',
        description:
            'D’Alembert strategy with configurable market, contract, stake and risk controls.',
        strategy: 'D_ALEMBERT',
    },
    {
        number: 3,
        name: 'MAMBA X-MAN PRO V1',
        description:
            'Jixirio recreation with configurable trading and risk-management settings.',
        strategy: 'MAMBA_XMAN',
    },
];

const waitForBlocklyWorkspace = async (
    blocklyStore: { is_loading: boolean },
    timeout = 15000
) => {
    const started = Date.now();

    while (Date.now() - started < timeout) {
        const workspace = window.Blockly?.derivWorkspace;

        if (workspace && !blocklyStore.is_loading) {
            return workspace;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    throw new Error('Blockly workspace failed to initialize.');
};

const BestBots = () => {
    const { dashboard, load_modal, blockly_store } = useStore();
    const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleLoad = async (bot: Bot) => {
        if (loadingStrategy) return;

        setLoadingStrategy(bot.strategy);
        setError('');

        try {
            if (bot.strategy === 'MAMBA_XMAN') {
                throw new Error(
                    'MAMBA X-MAN PRO V1 requires its own Blockly strategy template.'
                );
            }

            dashboard.setActiveTab(1);

            await waitForBlocklyWorkspace(blockly_store);

            const strategyModule =
                bot.strategy === 'MARTINGALE'
                    ? await import('../../xml/martingale_max-stake.xml')
                    : await import('../../xml/dalembert_max-stake.xml');

            const strategyId = `jixirio-${bot.strategy.toLowerCase()}-${Date.now()}`;

            await load_modal.loadStrategyToBuilder(
                {
                    id: strategyId,
                    name: bot.name,
                    xml: strategyModule.default,
                    save_type: save_types.UNSAVED,
                },
                true
            );

            dashboard.setActiveTab(1);
        } catch (err) {
            console.error('Failed to load Jixirio bot:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load the selected bot.'
            );
        } finally {
            setLoadingStrategy(null);
        }
    };

    return (
        <div className='best-bots'>
            <div className='best-bots__header'>
                <h2>Best Bots</h2>
                <p>
                    Choose a bot to load its strategy into the visual Blockly
                    Bot Builder.
                </p>
            </div>

            <div className='best-bots__table-wrap'>
                <table className='best-bots__table'>
                    <thead>
                        <tr>
                            <th>Bot Name</th>
                            <th>Description</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {bots.map(bot => (
                            <tr key={bot.number}>
                                <td className='best-bots__name'>
                                    <span>{bot.number}.</span> {bot.name}
                                </td>

                                <td className='best-bots__description'>
                                    {bot.description}
                                </td>

                                <td className='best-bots__action'>
                                    <button
                                        type='button'
                                        onClick={() => handleLoad(bot)}
                                        disabled={loadingStrategy !== null}
                                    >
                                        {loadingStrategy === bot.strategy
                                            ? 'LOADING...'
                                            : 'LOAD'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {error && (
                <div className='best-bots__error' role='alert'>
                    {error}
                </div>
            )}
        </div>
    );
};

export default BestBots;
