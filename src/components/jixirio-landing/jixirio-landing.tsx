import React from 'react';
import './jixirio-landing.scss';

interface JixirioLandingProps {
    onEnter: () => void;
}

const JixirioLanding = ({ onEnter }: JixirioLandingProps) => {
    return (
        <div className='jixirio-landing'>
            <div className='jixirio-landing__glow jixirio-landing__glow--one' />
            <div className='jixirio-landing__glow jixirio-landing__glow--two' />

            <header className='jixirio-landing__header'>
                <div className='jixirio-landing__logo'>
                    <span className='jixirio-landing__logo-mark'>J</span>
                    <span className='jixirio-landing__logo-text'>Jixirio</span>
                </div>

                <div className='jixirio-landing__status'>
                    <span className='jixirio-landing__status-dot' />
                    Markets live
                </div>
            </header>

            <main className='jixirio-landing__content'>
                <div className='jixirio-landing__badge'>
                    DERIV TRADING PLATFORM
                </div>

                <h1>
                    Read the market
                    <span> before you risk the trade.</span>
                </h1>

                <p>
                    Your hub for Deriv options, market analysis, scanners,
                    trading tools and smarter decision-making.
                </p>

                <button className='jixirio-landing__button' onClick={onEnter}>
                    <span>Enter Jixirio</span>
                    <span className='jixirio-landing__arrow'>→</span>
                </button>

                <div className='jixirio-landing__features'>
                    <div>
                        <strong>AI Analysis</strong>
                        <small>Market insights</small>
                    </div>

                    <div>
                        <strong>Pro Scanner</strong>
                        <small>Find opportunities</small>
                    </div>

                    <div>
                        <strong>Free Bots</strong>
                        <small>Trade smarter</small>
                    </div>
                </div>
            </main>

            <footer className='jixirio-landing__footer'>
                <span>Jixirio.COM</span>
                <span>Built for Deriv traders</span>
            </footer>
        </div>
    );
};

export default JixirioLanding;
