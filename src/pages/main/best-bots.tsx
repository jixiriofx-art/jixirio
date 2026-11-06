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
        description: 'Open the visual Bot Builder workspace to configure your market, stake and trading strategy.',
        strategy: 'MARTINGALE',
    },
    {
        number: 2,
        name: 'Jixirio D’Alembert Strategy Bot',
        description: 'Open the visual Bot Builder workspace to configure your market, stake and trading strategy.',
        strategy: 'D_ALEMBERT',
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
                <p>Choose a strategy to configure in the visual Bot Builder.</p>
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
