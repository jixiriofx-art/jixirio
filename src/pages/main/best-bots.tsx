import React, { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { DBOT_TABS } from '@/constants/bot-contents';
import { save_types } from '@/external/bot-skeleton/constants/save-type';
import './best-bots.scss';

type Bot = {
    number: number;
    name: string;
    description: string;
    strategy: 'MARTINGALE' | 'D_ALEMBERT' | 'MAMBA_XMAN' | 'VIPER_55' | 'PARITY_PULSE' | 'TRICYCLE_OVER_012';
    comingSoon?: boolean;
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
        name: 'Jixirio Viper 5.5 Pro',
        description:
            '1HZ100V Digit Over 1 strategy with 5.5× recovery, a three-loss recovery-cycle limit, $5 take-profit and $15 session stop-loss.',
        strategy: 'VIPER_55',
    },
    {
        number: 4,
        name: 'Jixirio Parity Pulse Switcher',
        description:
            '1HZ100V one-tick Even/Odd alternator with 2.1× recovery, a five-loss recovery-cycle reset and $5 take-profit.',
        strategy: 'PARITY_PULSE',
    },
    {
        number: 5,
        name: 'Jixirio TriCycle Over 0–1–2',
        description:
            '1HZ100V Digit Over one-tick rotation through barriers 0, 1 and 2, with 5.5× recovery, a three-loss cycle reset and $5 take-profit.',
        strategy: 'TRICYCLE_OVER_012',
    },
    {
        number: 6,
        name: 'MAMBA X-MAN PRO V1',
        description:
            'Jixirio recreation with configurable trading and risk-management settings.',
        strategy: 'MAMBA_XMAN',
        comingSoon: true,
    },
];

const waitForVisibleBuilder = async (timeout = 15000) => {
    const started = Date.now();

    while (Date.now() - started < timeout) {
        const builder = document.getElementById('scratch_div');
        const builderPanel = builder?.closest('.bot-builder');
        const bounds = builder?.getBoundingClientRect();
        const isActivePanel =
            builderPanel?.classList.contains('bot-builder--active') &&
            !builderPanel.classList.contains('bot-builder--inactive');

        // The inactive panel is positioned off-screen but still has dimensions.
        // Require its active class as well as measurable bounds before Blockly injects.
        if (isActivePanel && bounds && bounds.width > 0 && bounds.height > 0) {
            await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(
        'The Bot Builder tab did not become visible. Please reopen it and try again.'
    );
};

const waitForBlocklyWorkspace = async (
    blocklyStore: { is_loading: boolean },
    timeout = 30000
) => {
    const started = Date.now();

    while (Date.now() - started < timeout) {
        const workspace = window.Blockly?.derivWorkspace;
        const builder = document.getElementById('scratch_div');
        const builderIsVisible =
            !!builder && builder.getBoundingClientRect().width > 0;

        if (
            workspace &&
            typeof workspace.getVariableMap === 'function' &&
            typeof workspace.getTopBlocks === 'function' &&
            builderIsVisible &&
            !blocklyStore.is_loading
        ) {
            await new Promise(resolve => setTimeout(resolve, 200));

            if (typeof window.Blockly?.svgResize === 'function') {
                window.Blockly.svgResize(workspace);
            }

            return workspace;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    throw new Error(
        'The Bot Builder did not finish opening. Please try loading the bot again.'
    );
};

const BestBots = () => {
    const { dashboard, app, load_modal, blockly_store } = useStore();
    const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleLoad = async (bot: Bot) => {
        if (loadingStrategy || bot.comingSoon) return;

        setLoadingStrategy(bot.strategy);
        setError('');

        try {
            dashboard.setActiveTab(DBOT_TABS.BOT_BUILDER);

            // Wait until the builder is visible before initializing Blockly.
            await waitForVisibleBuilder();
            await app.onMount();
            const workspace = await waitForBlocklyWorkspace(blockly_store);

            const strategyModule =
                bot.strategy === 'MARTINGALE'
                    ? await import('../../xml/martingale_max-stake.xml')
                    : bot.strategy === 'D_ALEMBERT'
                      ? await import('../../xml/dalembert_max-stake.xml')
                      : bot.strategy === 'VIPER_55'
                        ? await import('../../xml/jixirio_viper_55_over.xml')
                        : bot.strategy === 'PARITY_PULSE'
                          ? await import('../../xml/jixirio_parity_pulse_switcher.xml')
                          : bot.strategy === 'TRICYCLE_OVER_012'
                            ? await import('../../xml/jixirio_tricycle_over_012.xml')
                            : null;

            if (!strategyModule?.default) {
                throw new Error('This bot does not have a published strategy file yet.');
            }

            const strategyXml = strategyModule.default;

            if (typeof strategyXml !== 'string' || !strategyXml.trim()) {
                throw new Error(
                    'The selected bot strategy file is empty or could not be loaded.'
                );
            }

            const strategyId =
                `jixirio-${bot.strategy.toLowerCase()}-${Date.now()}`;

            await load_modal.loadStrategyToBuilder(
                {
                    id: strategyId,
                    name: bot.name,
                    xml: strategyXml,
                    save_type: save_types.UNSAVED,
                },
                false
            );

            window.Blockly.svgResize(workspace);

            const loadedBlocks = workspace.getAllBlocks(false);
            const hasTradeDefinition = loadedBlocks.some(
                block => block.type === 'trade_definition'
            );

            if (!hasTradeDefinition) {
                throw new Error(
                    'The bot did not load into the workspace. The strategy has not been started.'
                );
            }

            dashboard.setActiveTab(DBOT_TABS.BOT_BUILDER);
        } catch (err) {
            console.error('Failed to load Jixirio bot:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load the selected bot. Please try again.'
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
                                        disabled={
                                            loadingStrategy !== null ||
                                            !!bot.comingSoon
                                        }
                                    >
                                        {bot.comingSoon
                                            ? 'COMING SOON'
                                            : loadingStrategy === bot.strategy
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
