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
        description: 'Configure your market, contract, stake and Martingale settings.',
        strategy: 'MARTINGALE',
    },
    {
        number: 2,
        name: 'Jixirio D’Alembert Strategy Bot',
        description: 'Configure your market, contract, stake and D’Alembert settings.',
        strategy: 'D_ALEMBERT',
    },
    {
        number: 3,
        name: 'MAMBA X-MAN PRO V1',
        description: 'Jixirio recreation with configurable trading and risk-management settings.',
        strategy: 'MAMBA_XMAN',
    },
];

const BestBots = () => {
    const { dashboard } = useStore();

    const handleLoad = () => {
        dashboard.setActiveTab(1);
    };

    return (
        <div className='best-bots'>
            <div className='best-bots__header'>
                <h2>Best Bots</h2>
                <p>Choose a bot to configure in the visual Blockly Bot Builder.</p>
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
                                    <button type='button' onClick={handleLoad}>
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
