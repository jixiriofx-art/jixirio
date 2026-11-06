import React from 'react';
import { useStore } from '@/hooks/useStore';
import './best-bots.scss';

type Bot = {
    number: number;
    name: string;
    description: string;
    strategy: string;
};

const bots: Bot[] = [
    {
        number: 1,
        name: 'Jixirio Universal Strategy Bot',
        description:
            'Open the Quick Strategy builder to configure a Deriv contract and use the Martingale stake-management strategy. Choose your market, contract type and trade settings before running.',
        strategy: 'MARTINGALE',
    },
    {
        number: 2,
        name: 'Jixirio D’Alembert Strategy Bot',
        description:
            'Open the Quick Strategy builder with the D’Alembert stake-management strategy selected. Configure your market, contract type and trade settings before running.',
        strategy: 'D_ALEMBERT',
    },
];

const BestBots = () => {
    const { dashboard, quick_strategy } = useStore();

    const handleLoad = (strategy: string) => {
        quick_strategy.setSelectedStrategy(strategy);

        quick_strategy.setAdditionalData({
            open_at_configuration: true,
        });

        dashboard.setActiveTab(1);
        quick_strategy.setFormVisibility(true);
    };

    return (
        <div className='best-bots'>
            <div className='best-bots__header'>
                <h2>Best Bots</h2>
                <p>
                    Choose a strategy to configure in the Jixirio Bot Builder.
                    Always test with a demo account first.
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
                                        onClick={() => handleLoad(bot.strategy)}
                                    >
                                        LOAD
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BestBots;
