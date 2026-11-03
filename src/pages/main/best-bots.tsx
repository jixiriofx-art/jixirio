
import React from 'react';
import './best-bots.scss';

type Bot = {
    number: number;
    name: string;
    description: string;
};

const bots: Bot[] = [
    {
        number: 1,
        name: 'Jixirio Universal Strategy Bot',
        description:
            'A flexible manual trading bot designed for Even/Odd, Over/Under, Matches/Differs, Rise/Fall, Higher/Lower and other compatible Deriv contract types. Select your market and configure your trade before placing it.',
    },
    {
        number: 2,
        name: 'Jixirio Precision Entry Bot',
        description:
            'A selective Rise/Fall strategy that uses moving-average trend confirmation to help identify potential entries. Includes configurable trade settings and risk controls. Test on a demo account before using real funds.',
    },
];

const BestBots = () => {
    const handleLoad = (botName: string) => {
        window.alert(
            `${botName} is being prepared. Its working Blockly strategy will be connected in the next implementation step.`
        );
    };

    return (
        <div className='best-bots'>
            <div className='best-bots__header'>
                <h2>Best Bots</h2>
                <p>
                    Discover our trading strategies designed for different
                    Deriv market types.
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
                                        onClick={() => handleLoad(bot.name)}
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
