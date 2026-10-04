// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
import React, { lazy, Suspense, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router';
import ChunkLoader from '@/components/loader/chunk-loader';
import { generateOAuthURL } from '@/components/shared';
import DesktopWrapper from '@/components/shared_ui/desktop-wrapper';
import Dialog from '@/components/shared_ui/dialog';
import MobileWrapper from '@/components/shared_ui/mobile-wrapper';
import Tabs from '@/components/shared_ui/tabs/tabs';
import TradeTypeConfirmationModal from '@/components/trade-type-confirmation-modal';
import TradingViewModal from '@/components/trading-view-chart/trading-view-modal';
import { DBOT_TABS, TAB_IDS } from '@/constants/bot-contents';
import { api_base, updateWorkspaceName } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { isDbotRTL } from '@/external/bot-skeleton/utils/workspace';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import {
    disableUrlParameterApplication,
    enableUrlParameterApplication,
    setupTradeTypeChangeListener,
} from '@/utils/blockly-url-param-handler';
import {
    checkAndShowTradeTypeModal,
    getModalState,
    handleTradeTypeCancel,
    handleTradeTypeConfirm,
    resetUrlParamProcessing,
    setModalStateChangeCallback,
} from '@/utils/trade-type-modal-handler';
import {
    LabelPairedChartLineCaptionRegularIcon,
    LabelPairedObjectsColumnCaptionRegularIcon,
    LabelPairedPuzzlePieceTwoCaptionBoldIcon,
} from '@deriv/quill-icons/LabelPaired';
import { LegacyGuide1pxIcon } from '@deriv/quill-icons/Legacy';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';
import './main.scss';

const ChartWrapper = lazy(() => import('../chart/chart-wrapper'));
const Tutorial = lazy(() => import('../tutorials'));

const JixirioSection = ({
    id,
    title,
    description,
    children,
}: {
    id: string;
    title: string;
    description: string;
    children?: React.ReactNode;
}) => {
    return (
        <div id={id} className='jixirio-section'>
            <div className='jixirio-section__header'>
                <div>
                    <div className='jixirio-section__eyebrow'>JIXIRIO</div>
                    <h1 className='jixirio-section__title'>{title}</h1>
                    <p className='jixirio-section__description'>{description}</p>
                </div>
            </div>

            {children || (
                <div className='jixirio-section__empty'>
                    <div className='jixirio-section__empty-icon'>✦</div>
                    <h2>Coming together</h2>
                    <p>This Jixirio workspace is ready for us to build.</p>
                </div>
            )}
        </div>
    );
};

const AIFloatingButton = ({ onClick }: { onClick: () => void }) => {
    const [position, setPosition] = useState({ x: 24, y: 24 });
    const [dragging, setDragging] = useState(false);
    const [has_moved, setHasMoved] = useState(false);

    const drag_start = React.useRef({ x: 0, y: 0 });
    const initial_position = React.useRef({ x: 24, y: 24 });

    const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
        setDragging(true);
        setHasMoved(false);

        drag_start.current = {
            x: event.clientX,
            y: event.clientY,
        };

        initial_position.current = {
            x: position.x,
            y: position.y,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!dragging) return;

        const delta_x = event.clientX - drag_start.current.x;
        const delta_y = event.clientY - drag_start.current.y;

        if (Math.abs(delta_x) > 4 || Math.abs(delta_y) > 4) {
            setHasMoved(true);
        }

        const next_x = initial_position.current.x - delta_x;
        const next_y = initial_position.current.y - delta_y;

        setPosition({
            x: Math.max(12, Math.min(window.innerWidth - 72, next_x)),
            y: Math.max(12, Math.min(window.innerHeight - 72, next_y)),
        });
    };

    const handlePointerUp = () => {
        setDragging(false);
    };

    const handleClick = () => {
        if (!has_moved) {
            onClick();
        }

        setHasMoved(false);
    };

    return (
        <button
            type='button'
            aria-label='Open Jixirio AI'
            className={classNames('jixirio-ai-float', {
                'jixirio-ai-float--dragging': dragging,
            })}
            style={{
                right: `${position.x}px`,
                bottom: `${position.y}px`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleClick}
        >
            <span>AI</span>
        </button>
    );
};

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();

    const {
        dashboard,
        load_modal,
        run_panel,
        quick_strategy,
        summary_card,
        blockly_store,
    } = useStore();

    const { is_loading } = blockly_store;

    const {
        active_tab,
        active_tour,
        is_chart_modal_visible,
        is_trading_view_modal_visible,
        setActiveTab,
        setWebSocketState,
        setActiveTour,
        setTourDialogVisibility,
    } = dashboard;

    const { dashboard_strategies } = load_modal;

    const {
        is_dialog_open,
        is_drawer_open,
        dialog_options,
        onCancelButtonClick,
        onCloseDialog,
        onOkButtonClick,
        stopBot,
    } = run_panel;

    const { is_open } = quick_strategy;

    const {
        cancel_button_text,
        ok_button_text,
        title,
        message,
        dismissable,
        is_closed_on_cancel,
    } = dialog_options as {
        [key: string]: string;
    };

    const { clear } = summary_card;

    const {
        DASHBOARD,
        BOT_BUILDER,
        BEST_BOTS,
        AI_ANALYSIS,
        DANALYSIS,
        AUTO_TRADES,
        CHART,
        MANUAL_TRADING,
        RISK_MANAGEMENT,
        TUTORIAL,
    } = DBOT_TABS;

    const init_render = React.useRef(true);

    const hash = [
        'dashboard',
        'bot_builder',
        'best_bots',
        'ai_analysis',
        'danalysis',
        'auto_trades',
        'chart',
        'manual_trading',
        'risk_management',
        'tutorial',
    ];

    const { isDesktop } = useDevice();
    const location = useLocation();
    const navigate = useNavigate();

    const [left_tab_shadow, setLeftTabShadow] = useState<boolean>(false);
    const [right_tab_shadow, setRightTabShadow] = useState<boolean>(false);
    const [tradeTypeModalState, setTradeTypeModalState] = useState(getModalState());

    const getTradeTypeModalProps = () => {
        const { tradeTypeData } = tradeTypeModalState;

        return {
            is_visible: tradeTypeModalState.isVisible,
            trade_type_display_name: tradeTypeData?.displayName || '',

            current_trade_type: tradeTypeData?.currentTradeType
                ? `${tradeTypeData.currentTradeType.tradeTypeCategory}/${tradeTypeData.currentTradeType.tradeType}`
                : 'N/A',

            current_trade_type_display_name:
                tradeTypeData?.currentTradeTypeDisplayName || 'N/A',

            onConfirm: handleTradeTypeConfirm,
            onCancel: handleTradeTypeCancel,
        };
    };

    const is_preview_mode = window.location.pathname.includes('/preview');

    let tab_value: number | string = active_tab;

    const GetHashedValue = (tab: number) => {
        tab_value = location.hash?.split('#')[1];

        if (!tab_value) return is_preview_mode ? BOT_BUILDER : tab;

        const hash_index = hash.indexOf(String(tab_value));

        return hash_index >= 0 ? hash_index : tab;
    };

    const active_hash_tab = GetHashedValue(active_tab);

    React.useEffect(() => {
        setModalStateChangeCallback(new_state => {
            setTradeTypeModalState(new_state);
        });
    }, [is_loading]);

    React.useEffect(() => {
        resetUrlParamProcessing();
    }, [location.search]);

    React.useEffect(() => {
        const el_dashboard = document.getElementById('id-dbot-dashboard');
        const el_tutorial = document.getElementById('id-tutorials');

        if (!el_dashboard || !el_tutorial) return;

        const observer_dashboard = new window.IntersectionObserver(
            ([entry]) => {
                setLeftTabShadow(!entry.isIntersecting);
            },
            {
                root: null,
                threshold: 0.5,
            }
        );

        const observer_tutorial = new window.IntersectionObserver(
            ([entry]) => {
                setRightTabShadow(!entry.isIntersecting);
            },
            {
                root: null,
                threshold: 0.5,
            }
        );

        observer_dashboard.observe(el_dashboard);
        observer_tutorial.observe(el_tutorial);

        return () => {
            observer_dashboard.disconnect();
            observer_tutorial.disconnect();
        };
    }, []);

    React.useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            const is_bot_running =
                document.getElementById('db-animation__stop-button') !== null;

            if (is_bot_running) {
                clear();
                stopBot();
                api_base.setIsRunning(false);
                setWebSocketState(false);
            }
        }
    }, [clear, connectionStatus, setWebSocketState, stopBot]);

    const updateTabShadowsHeight = () => {
        const botBuilderEl = document.getElementById('id-bot-builder');
        const leftShadow = document.querySelector(
            '.tabs-shadow--left'
        ) as HTMLElement;
        const rightShadow = document.querySelector(
            '.tabs-shadow--right'
        ) as HTMLElement;

        if (botBuilderEl && leftShadow && rightShadow) {
            const height = botBuilderEl.offsetHeight;

            leftShadow.style.height = `${height}px`;
            rightShadow.style.height = `${height}px`;
        }
    };

    React.useEffect(() => {
        let pollTimeoutId: ReturnType<typeof setTimeout> | null = null;

        if (active_tab === BOT_BUILDER) {
            requestAnimationFrame(() => {
                disableUrlParameterApplication();

                setupTradeTypeChangeListener();

                const handleTradeTypeModal = () => {
                    checkAndShowTradeTypeModal(
                        () => {
                            enableUrlParameterApplication();
                        },
                        () => {}
                    );
                };

                if (!blockly_store.is_loading) {
                    setTimeout(() => {
                        handleTradeTypeModal();
                    }, 500);
                } else {
                    let pollAttempts = 0;
                    const maxPollAttempts = 10;

                    const checkBlocklyLoaded = () => {
                        if (!blockly_store.is_loading) {
                            handleTradeTypeModal();
                            return;
                        }

                        if (pollAttempts < maxPollAttempts) {
                            pollAttempts++;
                            pollTimeoutId = setTimeout(checkBlocklyLoaded, 500);
                        } else {
                            console.warn(
                                'Blockly loading timeout after 5 seconds - proceeding without URL parameter check'
                            );
                        }
                    };

                    checkBlocklyLoaded();
                }
            });
        }

        return () => {
            if (pollTimeoutId) {
                clearTimeout(pollTimeoutId);
                pollTimeoutId = null;
            }
        };
    }, [active_tab, is_loading]);

    React.useEffect(() => {
        updateTabShadowsHeight();

        if (is_open) {
            setTourDialogVisibility(false);
        }

        if (init_render.current) {
            setActiveTab(Number(active_hash_tab));

            if (!isDesktop) {
                handleTabChange(Number(active_hash_tab));
            }

            init_render.current = false;
        } else {
            const currentSearch = window.location.search;

            navigate(
                `${currentSearch}#${hash[active_tab] || hash[0]}`
            );
        }

        if (active_tour !== '') {
            setActiveTour('');
        }

        const mainElement = document.querySelector('.main__container');

        if (active_tab === TUTORIAL && !isDesktop) {
            document.body.style.overflow = 'hidden';

            if (mainElement instanceof HTMLElement) {
                mainElement.classList.add('no-scroll');
            }
        } else {
            document.body.style.overflow = '';

            if (mainElement instanceof HTMLElement) {
                mainElement.classList.remove('no-scroll');
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active_tab]);

    React.useEffect(() => {
        const trashcan_init_id = setTimeout(() => {
            if (
                active_tab === BOT_BUILDER &&
                Blockly?.derivWorkspace?.trashcan
            ) {
                const trashcanY = window.innerHeight - 250;

                let trashcanX;

                if (is_drawer_open) {
                    trashcanX = isDbotRTL()
                        ? 380
                        : window.innerWidth - 460;
                } else {
                    trashcanX = isDbotRTL()
                        ? 20
                        : window.innerWidth - 100;
                }

                Blockly?.derivWorkspace?.trashcan?.setTrashcanPosition(
                    trashcanX,
                    trashcanY
                );
            }
        }, 100);

        return () => {
            clearTimeout(trashcan_init_id);
        };
    }, [active_tab, is_drawer_open]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        if (dashboard_strategies.length > 0) {
            timer = setTimeout(() => {
                updateWorkspaceName();
            });
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [dashboard_strategies, active_tab]);

    const handleTabChange = React.useCallback(
        (tab_index: number) => {
            setActiveTab(tab_index);

            const el_id = TAB_IDS[tab_index];

            if (el_id) {
                const el_tab = document.getElementById(el_id);

                setTimeout(() => {
                    el_tab?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center',
                    });
                }, 10);
            }
        },
        [setActiveTab]
    );

    const handleLoginGeneration = async () => {
        const oauthUrl = await generateOAuthURL();

        if (oauthUrl) {
            window.location.replace(oauthUrl);
        } else {
            console.error('Failed to generate OAuth URL');
        }
    };

    const handleAIClick = () => {
        handleTabChange(AI_ANALYSIS);
    };

    return (
        <React.Fragment>
            <div className='main'>
                <div
                    className={classNames('main__container', {
                        'main__container--active':
                            active_tour &&
                            active_tab === DASHBOARD &&
                            !isDesktop,
                    })}
                >
                    <div>
                        {!isDesktop &&
                            left_tab_shadow && (
                                <span className='tabs-shadow tabs-shadow--left' />
                            )}

                        <Tabs
                            active_index={active_tab}
                            className='main__tabs'
                            onTabItemClick={handleTabChange}
                            top
                        >
                            {/* DASHBOARD */}
                            <div
                                label={
                                    <>
                                        <LabelPairedObjectsColumnCaptionRegularIcon
                                            height='24px'
                                            width='24px'
                                            fill='var(--text-general)'
                                        />
                                        <Localize i18n_default_text='Dashboard' />
                                    </>
                                }
                                id='id-dbot-dashboard'
                            >
                                <Dashboard
                                    handleTabChange={handleTabChange}
                                />
                            </div>

                            {/* BOT BUILDER */}
                            <div
                                label={
                                    <>
                                        <LabelPairedPuzzlePieceTwoCaptionBoldIcon
                                            height='24px'
                                            width='24px'
                                            fill='var(--text-general)'
                                        />
                                        <Localize i18n_default_text='Bot Builder' />
                                    </>
                                }
                                id='id-bot-builder'
                            />

                            {/* BEST BOTS */}
                            <div
                                label='Best Bots'
                                id='id-best-bots'
                            >
                                <JixirioSection
                                    id='id-best-bots'
                                    title='Best Bots'
                                    description='Explore carefully selected strategies and discover bots built for different trading approaches.'
                                />
                            </div>

                            {/* AI ANALYSIS */}
                            <div
                                label='AI Analysis'
                                id='id-ai-analysis'
                            >
                                <JixirioSection
                                    id='id-ai-analysis'
                                    title='AI Analysis'
                                    description='Read the market before you risk the trade.'
                                >
                                    <div className='jixirio-section__grid'>
                                        <div className='jixirio-card'>
                                            <span className='jixirio-card__label'>
                                                AI SCANNER
                                            </span>
                                            <h2>Scan the market</h2>
                                            <p>
                                                Find potential setups across
                                                supported Deriv markets.
                                            </p>
                                            <button type='button'>
                                                Start scanning
                                            </button>
                                        </div>

                                        <div className='jixirio-card'>
                                            <span className='jixirio-card__label'>
                                                ANALYSIS
                                            </span>
                                            <h2>Analyze a setup</h2>
                                            <p>
                                                Break down market conditions
                                                before entering a trade.
                                            </p>
                                            <button type='button'>
                                                Analyze
                                            </button>
                                        </div>

                                        <div className='jixirio-card'>
                                            <span className='jixirio-card__label'>
                                                MATCHING BOT
                                            </span>
                                            <h2>Find a matching bot</h2>
                                            <p>
                                                Match market conditions with
                                                an available strategy.
                                            </p>
                                            <button type='button'>
                                                Find bot
                                            </button>
                                        </div>
                                    </div>
                                </JixirioSection>
                            </div>

                            {/* DANALYSIS */}
                            <div
                                label='Danalysis'
                                id='id-danalysis'
                            >
                                <JixirioSection
                                    id='id-danalysis'
                                    title='Danalysis'
                                    description='Deep Deriv market analysis, statistics and digit insights.'
                                />
                            </div>

                            {/* AUTO TRADES */}
                            <div
                                label='Auto Trades'
                                id='id-auto-trades'
                            >
                                <JixirioSection
                                    id='id-auto-trades'
                                    title='Auto Trades'
                                    description='Manage automated trading strategies and execution.'
                                />
                            </div>

                            {/* TRADING VIEW */}
                            <div
                                label={
                                    <>
                                        <LabelPairedChartLineCaptionRegularIcon
                                            height='24px'
                                            width='24px'
                                            fill='var(--text-general)'
                                        />
                                        <Localize i18n_default_text='Trading View' />
                                    </>
                                }
                                id={
                                    is_chart_modal_visible ||
                                    is_trading_view_modal_visible
                                        ? 'id-charts--disabled'
                                        : 'id-charts'
                                }
                            >
                                <Suspense
                                    fallback={
                                        <ChunkLoader
                                            message={localize(
                                                'Please wait, loading chart...'
                                            )}
                                        />
                                    }
                                >
                                    <ChartWrapper show_digits_stats={false} />
                                </Suspense>
                            </div>

                            {/* MANUAL TRADING */}
                            <div
                                label='Manual Trading'
                                id='id-manual-trading'
                            >
                                <JixirioSection
                                    id='id-manual-trading'
                                    title='Manual Trading'
                                    description='Take control of your entries with a focused trading workspace.'
                                />
                            </div>

                            {/* RISK MANAGEMENT */}
                            <div
                                label='Risk Management'
                                id='id-risk-management'
                            >
                                <JixirioSection
                                    id='id-risk-management'
                                    title='Risk Management'
                                    description='Plan your stake, limits, stop levels and exposure before you trade.'
                                >
                                    <div className='jixirio-section__grid'>
                                        <div className='jixirio-card'>
                                            <span className='jixirio-card__label'>
                                                STAKE
                                            </span>
                                            <h2>Position sizing</h2>
                                            <p>
                                                Set a controlled stake for
                                                every trading session.
                                            </p>
                                        </div>

                                        <div className='jixirio-card'>
                                            <span className='jixirio-card__label'>
                                                LIMITS
                                            </span>
                                            <h2>Session limits</h2>
                                            <p>
                                                Define maximum trades, loss
                                                limits and profit targets.
                                            </p>
                                        </div>

                                        <div className='jixirio-card'>
                                            <span className='jixirio-card__label'>
                                                DISCIPLINE
                                            </span>
                                            <h2>Trade with intention</h2>
                                            <p>
                                                Build rules that help prevent
                                                emotional overtrading.
                                            </p>
                                        </div>
                                    </div>
                                </JixirioSection>
                            </div>

                            {/* TUTORIALS */}
                            <div
                                label={
                                    <>
                                        <LegacyGuide1pxIcon
                                            height='16px'
                                            width='16px'
                                            fill='var(--text-general)'
                                            className='icon-general-fill-g-path'
                                        />
                                        <Localize i18n_default_text='Tutorials' />
                                    </>
                                }
                                id='id-tutorials'
                            >
                                <div className='tutorials-wrapper'>
                                    <Suspense
                                        fallback={
                                            <ChunkLoader
                                                message={localize(
                                                    'Please wait, loading tutorials...'
                                                )}
                                            />
                                        }
                                    >
                                        <Tutorial
                                            handleTabChange={handleTabChange}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        </Tabs>

                        {!isDesktop &&
                            right_tab_shadow && (
                                <span className='tabs-shadow tabs-shadow--right' />
                            )}
                    </div>
                </div>
            </div>

            {/* MOVABLE JIXIRIO AI BUTTON */}
            <AIFloatingButton onClick={handleAIClick} />

            <DesktopWrapper>
                <div className='main__run-strategy-wrapper'>
                    <RunStrategy />
                    <RunPanel />
                </div>

                <ChartModal />
                <TradingViewModal />
            </DesktopWrapper>

            <MobileWrapper>
                {!is_open && <RunPanel />}
            </MobileWrapper>

            <Dialog
                cancel_button_text={
                    cancel_button_text || localize('Cancel')
                }
                className='dc-dialog__wrapper--fixed'
                confirm_button_text={
                    ok_button_text || localize('Ok')
                }
                has_close_icon
                is_mobile_full_width={false}
                is_visible={is_dialog_open}
                onCancel={onCancelButtonClick}
                onClose={onCloseDialog}
                onConfirm={onOkButtonClick || onCloseDialog}
                portal_element_id='modal_root'
                title={title}
                login={handleLoginGeneration}
                dismissable={dismissable}
                is_closed_on_cancel={is_closed_on_cancel}
            >
                {message}
            </Dialog>

            {/* TRADE TYPE CONFIRMATION */}
            {(() => {
                const modalProps = getTradeTypeModalProps();

                return (
                    <TradeTypeConfirmationModal
                        is_visible={modalProps.is_visible}
                        trade_type_display_name={
                            modalProps.trade_type_display_name
                        }
                        current_trade_type={
                            modalProps.current_trade_type
                        }
                        current_trade_type_display_name={
                            modalProps.current_trade_type_display_name
                        }
                        onConfirm={modalProps.onConfirm}
                        onCancel={modalProps.onCancel}
                    />
                );
            })()}
        </React.Fragment>
    );
});

export default AppWrapper;
