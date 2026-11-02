import React from 'react';
import './best-bots.scss';

type Bot = {
    number: number;
    name: string;
    description: string;
    supportedMarkets: string[];
};

const bots: Bot[] = [
    {
        number: 1,
        name: 'Jixirio Universal Strategy Bot',
        description:
            'A flexible manual trading bot designed for Even/Odd, Over/Under, Matches/Differs, Rise/Fall, Higher/Lower and other compatible Deriv contract types. Select your market and configure your trade before placing it.',
        supportedMarkets: [
            'Even/Odd',
            'Over/Under',
            'Matches/Differs',
            'Rise/Fall',
            'Higher/Lower',
        ],
    },
    {
        number: 2,
        name: 'Jixirio Precision Entry Bot',
        description:
            'A selective Rise/Fall strategy that uses moving-average trend confirmation to help identify potential entries. Includes configurable trade settings and risk controls. Test on a demo account before using real funds.',
        supportedMarkets: ['Rise/Fall'],
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
                <span className='best-bots__eyebrow'>JIXIRIO STRATEGY LIBRARY</span>
                <h2>Free Bots</h2>
                <p>
                    Explore trading strategies designed for different Deriv
                    market types.
                </p>
            </div>

            <div className='best-bots__list'>
                {bots.map(bot => (
                    <article className='best-bots__card' key={bot.number}>
                        <div className='best-bots__number'>
                            BOT {bot.number}
                        </div>

                        <section className='best-bots__section'>
                            <h3>BOT NAME</h3>
                            <h2>{bot.name}</h2>
                        </section>

                        <section className='best-bots__section'>
                            <h3>DESCRIPTION</h3>
                            <p>{bot.description}</p>
                            <div className='best-bots__markets'>
                                {bot.supportedMarkets.map(market => (
                                    <span key={market}>{market}</span>
                                ))}
                            </div>
                        </section>

                        <section className='best-bots__section best-bots__action'>
                            <h3>ACTION</h3>
                            <button
                                type='button'
                                onClick={() => handleLoad(bot.name)}
                            >
                                LOAD
                            </button>
                        </section>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default BestBots;
