import React from 'react';
import './jixirio-landing.scss';

interface JixirioLandingProps {
    onEnter: () => void;
}

const search_words = [
    'Trade with better tools',
    'Built for every kind of trader',
    'Welcome to Jixirio',
];

const testimonials = [
    {
        initials: 'MG',
        name: 'Marcus G.',
        title: 'Options Trader',
        quote: 'Better tools make better decisions.',
    },
    {
        initials: 'KM',
        name: 'Kevin M.',
        title: 'Crypto Investor',
        quote: 'Everything I need to analyse the market in one place.',
    },
    {
        initials: 'SL',
        name: 'Sarah L.',
        title: 'Market Trader',
        quote: 'Simple, focused and built around the trader.',
    },
    {
        initials: 'RP',
        name: 'Ryan P.',
        title: 'Options Trader',
        quote: 'The right information at the right time changes everything.',
    },
];

const get_time_greeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return 'Good morning';
    }

    if (hour >= 12 && hour < 17) {
        return 'Good afternoon';
    }

    return 'Good evening';
};

const JixirioLanding = ({ onEnter }: JixirioLandingProps) => {
    const [search_text, setSearchText] = React.useState('');
    const [search_index, setSearchIndex] = React.useState(0);
    const [is_deleting, setIsDeleting] = React.useState(false);
    const [show_more, setShowMore] = React.useState(false);
    const [greeting, setGreeting] = React.useState(get_time_greeting);

    React.useEffect(() => {
        const update_greeting = () => {
            setGreeting(get_time_greeting());
        };

        update_greeting();

        const greeting_timer = window.setInterval(
            update_greeting,
            60 * 1000
        );

        return () => window.clearInterval(greeting_timer);
    }, []);

    React.useEffect(() => {
        const current_word = search_words[search_index];

        const typing_speed = is_deleting ? 45 : 85;
        const pause_after_word =
            !is_deleting && search_text === current_word;

        const timer = setTimeout(
            () => {
                if (pause_after_word) {
                    setIsDeleting(true);
                } else if (is_deleting && search_text === '') {
                    setIsDeleting(false);
                    setSearchIndex(
                        (previous) =>
                            (previous + 1) % search_words.length
                    );
                } else {
                    setSearchText(
                        is_deleting
                            ? current_word.substring(
                                  0,
                                  search_text.length - 1
                              )
                            : current_word.substring(
                                  0,
                                  search_text.length + 1
                              )
                    );
                }
            },
            pause_after_word ? 1400 : typing_speed
        );

        return () => clearTimeout(timer);
    }, [search_text, search_index, is_deleting]);

    const handle_enter = () => {
        onEnter();
    };

    return (
        <div className='jixirio-landing'>
            {/* Background effects */}
            <div className='jixirio-landing__glow jixirio-landing__glow--one' />
            <div className='jixirio-landing__glow jixirio-landing__glow--two' />
            <div className='jixirio-landing__grid' />

            {/* HEADER */}
            <header className='jixirio-landing__header'>
                <div className='jixirio-landing__logo'>
                    <span className='jixirio-landing__logo-mark'>
                        J
                    </span>

                    <span className='jixirio-landing__logo-text'>
                        <strong>Jixirio</strong>
                        <small>.COM</small>
                    </span>
                </div>

                <nav className='jixirio-landing__nav'>
                    <button
                        className='jixirio-landing__login'
                        onClick={handle_enter}
                    >
                        Login Now
                        <span>→</span>
                    </button>

                    <button
                        className='jixirio-landing__signup'
                        onClick={handle_enter}
                    >
                        Sign Up
                    </button>
                </nav>
            </header>

            {/* HERO */}
            <main>
                <section className='jixirio-landing__hero'>
                    <div className='jixirio-landing__hero-content'>
                        <div className='jixirio-landing__greeting'>
                            <span className='jixirio-landing__live-dot' />
                            {greeting}
                        </div>

                        <div className='jixirio-landing__search'>
                            <span className='jixirio-landing__search-icon'>
                                ⌕
                            </span>

                            <span className='jixirio-landing__search-text'>
                                {search_text}
                                <span className='jixirio-landing__cursor' />
                            </span>
                        </div>

                        <h1>
                            Read the market.
                            <span> Risk with intention.</span>
                        </h1>

                        <p className='jixirio-landing__hero-description'>
                            From manual trades to full automation,
                            Jixirio adapts to the way you work.
                        </p>

                        <div className='jixirio-landing__hero-actions'>
                            <button
                                className='jixirio-landing__primary-button'
                                onClick={handle_enter}
                            >
                                Explore Jixirio
                                <span>→</span>
                            </button>

                            <button
                                className='jixirio-landing__secondary-button'
                                onClick={handle_enter}
                            >
                                Create an account for free
                            </button>
                        </div>

                        <div className='jixirio-landing__hero-note'>
                            <span>✦</span>
                            Built for traders who want more control.
                        </div>
                    </div>
                </section>

                {/* TESTIMONIALS */}
                <section className='jixirio-landing__social-proof'>
                    <div className='jixirio-landing__section-intro'>
                        <span className='jixirio-landing__section-badge'>
                            COMMUNITY
                        </span>

                        <h2>
                            Trusted by Traders
                            <span> Worldwide</span>
                        </h2>

                        <div className='jixirio-landing__rating'>
                            <strong>4.9</strong>

                            <span className='jixirio-landing__stars'>
                                ★★★★★
                            </span>

                            <small>Average trader rating</small>
                        </div>

                        <div className='jixirio-landing__trust-tags'>
                            <span>50,000+ traders</span>
                            <span>Verified reviews</span>
                        </div>
                    </div>

                    <div className='jixirio-landing__testimonial-track'>
                        <div className='jixirio-landing__testimonial-row'>
                            {[...testimonials, ...testimonials].map(
                                (testimonial, index) => (
                                    <article
                                        className='jixirio-landing__testimonial'
                                        key={`${testimonial.initials}-${index}`}
                                    >
                                        <div className='jixirio-landing__testimonial-top'>
                                            <div className='jixirio-landing__avatar'>
                                                {testimonial.initials}
                                            </div>

                                            <div>
                                                <strong>
                                                    {testimonial.name}
                                                </strong>

                                                <small>
                                                    {testimonial.title}
                                                </small>
                                            </div>

                                            <span className='jixirio-landing__quote-icon'>
                                                “
                                            </span>
                                        </div>

                                        <div className='jixirio-landing__testimonial-stars'>
                                            ★★★★★
                                        </div>

                                        <p>
                                            {testimonial.quote}
                                        </p>
                                    </article>
                                )
                            )}
                        </div>
                    </div>

                    {/* STATS */}
                    <div className='jixirio-landing__stats'>
                        <div>
                            <strong>50K+</strong>
                            <span>Active Traders</span>
                        </div>

                        <div>
                            <strong>15K+</strong>
                            <span>Trading Volume</span>
                        </div>

                        <div>
                            <strong>99.9%</strong>
                            <span>Uptime</span>
                        </div>

                        <div>
                            <strong>150+</strong>
                            <span>Trading Pairs</span>
                        </div>
                    </div>
                </section>

                {/* FEATURES */}
                <section className='jixirio-landing__features-section'>
                    <span className='jixirio-landing__section-badge jixirio-landing__section-badge--blue'>
                        PLATFORM
                    </span>

                    <h2>
                        Powerful Features for
                        <span> Modern Traders</span>
                    </h2>

                    <p className='jixirio-landing__section-description'>
                        Everything you need to succeed in today's
                        fast-paced markets.
                    </p>

                    <div className='jixirio-landing__feature-grid'>
                        <article className='jixirio-landing__feature-card'>
                            <div className='jixirio-landing__feature-icon'>
                                ✦
                            </div>

                            <span className='jixirio-landing__card-label'>
                                AUTOMATION
                            </span>

                            <h3>AI-Powered Trading Bots</h3>

                            <p>Automate Your Success</p>

                            <span className='jixirio-landing__card-arrow'>
                                →
                            </span>
                        </article>

                        <article className='jixirio-landing__feature-card'>
                            <div className='jixirio-landing__feature-icon'>
                                ◈
                            </div>

                            <span className='jixirio-landing__card-label'>
                                ANALYSIS
                            </span>

                            <h3>Real-Time Market Analysis</h3>

                            <p>Data-Driven Decisions</p>

                            <span className='jixirio-landing__card-arrow'>
                                →
                            </span>
                        </article>

                        <article className='jixirio-landing__feature-card'>
                            <div className='jixirio-landing__feature-icon'>
                                ◎
                            </div>

                            <span className='jixirio-landing__card-label'>
                                COMMUNITY
                            </span>

                            <h3>Copy Trading Network</h3>

                            <p>Follow Top Performers</p>

                            <span className='jixirio-landing__card-arrow'>
                                →
                            </span>
                        </article>

                        <article className='jixirio-landing__feature-card'>
                            <div className='jixirio-landing__feature-icon'>
                                ◉
                            </div>

                            <span className='jixirio-landing__card-label'>
                                PROTECTION
                            </span>

                            <h3>Risk Management Tools</h3>

                            <p>Protect Your Capital</p>

                            <span className='jixirio-landing__card-arrow'>
                                →
                            </span>
                        </article>
                    </div>
                </section>

                {/* REFERRAL */}
                <section className='jixirio-landing__referral'>
                    <div className='jixirio-landing__referral-content'>
                        <span className='jixirio-landing__section-badge jixirio-landing__section-badge--blue'>
                            CLIENT REFERRAL
                        </span>

                        <h2>
                            Revenue
                            <span> Share</span>
                        </h2>

                        <div className='jixirio-landing__revenue-pill'>
                            Up to 45%
                        </div>

                        <p>
                            Grow with Jixirio by referring traders to
                            the platform and earning revenue share from
                            eligible referred activity.
                        </p>

                        <button
                            className='jixirio-landing__referral-button'
                            onClick={handle_enter}
                        >
                            Refer a trader
                            <span>→</span>
                        </button>

                        <button
                            className='jixirio-landing__show-more'
                            onClick={() => setShowMore(!show_more)}
                        >
                            {show_more ? 'Show less ↑' : 'Show more ↓'}
                        </button>

                        {show_more && (
                            <div className='jixirio-landing__referral-more'>
                                <p>
                                    Share Jixirio with traders who can
                                    benefit from better analysis,
                                    automation and trading tools.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* WHY JIXIRIO */}
                <section className='jixirio-landing__why'>
                    <span className='jixirio-landing__section-badge'>
                        WHY JIXIRIO
                    </span>

                    <h2>
                        Why Choose
                        <span> Jixirio?</span>
                    </h2>

                    <div className='jixirio-landing__why-list'>
                        <div className='jixirio-landing__why-item'>
                            <span>✓</span>
                            <p>
                                Bank-grade security with encrypted
                                sessions
                            </p>
                        </div>

                        <div className='jixirio-landing__why-item'>
                            <span>✓</span>
                            <p>
                                Lightning-fast execution under 50ms
                            </p>
                        </div>

                        <div className='jixirio-landing__why-item'>
                            <span>✓</span>
                            <p>
                                Virtual account for risk-free testing
                            </p>
                        </div>

                        <div className='jixirio-landing__why-item'>
                            <span>✓</span>
                            <p>
                                24/7 customer support and trading
                                resources
                            </p>
                        </div>

                        <div className='jixirio-landing__why-item'>
                            <span>✓</span>
                            <p>
                                Multi-asset trading across forex,
                                crypto, and indices
                            </p>
                        </div>

                        <div className='jixirio-landing__why-item'>
                            <span>✓</span>
                            <p>
                                Mobile app for trading on the go
                            </p>
                        </div>
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className='jixirio-landing__final-cta'>
                    <span className='jixirio-landing__section-badge'>
                        GET STARTED
                    </span>

                    <h2>
                        Ready to Transform
                        <span> Your Trading?</span>
                    </h2>

                    <p>
                        Join 50,000+ traders who are already
                        discovering a better way to approach the
                        markets.
                    </p>

                    <button
                        className='jixirio-landing__final-button'
                        onClick={handle_enter}
                    >
                        Start Free Trial
                        <span>→</span>
                    </button>

                    <div className='jixirio-landing__trust-badges'>
                        <span>✓ No Credit Card</span>
                        <span>✓ $10K Virtual Money</span>
                        <span>✓ Full Platform Access</span>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className='jixirio-landing__footer'>
                <div className='jixirio-landing__risk'>
                    <span>⚠</span>

                    <div>
                        <strong>Risk Disclaimer</strong>

                        <p>
                            Trading complex financial instruments
                            involves significant risk and may not be
                            suitable for every trader. Past
                            performance is not indicative of future
                            results. Only trade with funds you can
                            afford to lose.
                        </p>
                    </div>
                </div>

                <div className='jixirio-landing__footer-bottom'>
                    <span>© {new Date().getFullYear()} Jixirio.COM</span>
                    <span>Built for traders.</span>
                </div>
            </footer>
        </div>
    );
};

export default JixirioLanding;
