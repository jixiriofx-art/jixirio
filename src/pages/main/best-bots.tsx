import React, { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { DBOT_TABS } from '@/constants/bot-contents';
import { save_types } from '@/external/bot-skeleton/constants/save-type';
import './best-bots.scss';

type Bot = {
    number: number;
    name: string;
    description: string;
    strategy: 'MARTINGALE' | 'D_ALEMBERT' | 'MAMBA_XMAN';
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
        name: 'MAMBA X-MAN PRO V1',
        description:
            'Jixirio recreation with configurable trading and risk-management settings.',
        strategy: 'MAMBA_XMAN',
        comingSoon: true,
    },
];

const waitForBlocklyWorkspace = async (
    blocklyStore: { is_loading: boolean },
    timeout = 20000
) => {
    const started = Date.now();

    while (Date.now() - started < timeout) {
        const workspace = window.Blockly?.derivWorkspace;
        const builder = document.getElementById('scratch_div');
        const builderIsVisible =
            !!builder && builder.getBoundingClientRect().width > 0;

        if (
            workspace &&
            typeof workspace.getTopBlocks === 'function' &&
            builderIsVisible &&
            !blocklyStore.is_loading
        ) {
            await new Promise(resolve => setTimeout(resolve, 150));
            window.Blockly.svgResize(workspace);
            return workspace;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    throw new Error(
        'The Bot Builder did not finish opening. Please try loading the bot again.'
    );
};

const BestBots = () => {
    const { dashboard, load_modal, blockly_store } = useStore();
    const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleLoad = async (bot: Bot) => {
        if (loadingStrategy || bot.comingSoon) return;

        setLoadingStrategy(bot.strategy);
        setError('');

        try {
            dashboard.setActiveTab(DBOT_TABS.BOT_BUILDER);

            const workspace = await waitForBlocklyWorkspace(blockly_store);

            const strategyModule =
                bot.strategy === 'MARTINGALE'
                    ? await import('../../xml/martingale_max-stake.xml')
                    : await import('../../xml/dalembert_max-stake.xml');

            let strategyXml = strategyModule.default;

            if (
                typeof strategyXml !== 'string' ||
                !strategyXml.trim()
            ) {
                throw new Error(
                    'The selected bot strategy file is empty or could not be loaded.'
                );
            }

            // Correct the stale D’Alembert variable ID before loading.
            if (bot.strategy === 'D_ALEMBERT') {
                const staleVariableId = 'o((rBg*rL/qm;RU%PM7_';
                const correctVariableId = 'Xv=?/_{i5i7(YfFJqUM2';

                if (!strategyXml.includes(staleVariableId)) {
                    throw new Error(
                        'The D’Alembert strategy template has changed. Loading was stopped to prevent an invalid bot.'
                    );
                }

                strategyXml = strategyXml
                    .split(staleVariableId)
                    .join(correctVariableId);

                if (strategyXml.includes(staleVariableId)) {
                    throw new Error(
                        'The D’Alembert variable correction failed.'
                    );
                }
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
