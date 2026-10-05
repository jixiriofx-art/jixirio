// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import GoogleDrive from '@/components/load-modal/google-drive';
import Dialog from '@/components/shared_ui/dialog';
import MobileFullPageModal from '@/components/shared_ui/mobile-full-page-modal';
import Text from '@/components/shared_ui/text';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import {
    DerivLightBotBuilderIcon,
    DerivLightGoogleDriveIcon,
    DerivLightLocalDeviceIcon,
    DerivLightMyComputerIcon,
    DerivLightQuickStrategyIcon,
} from '@deriv/quill-icons/Illustration';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import DashboardBotList from './bot-list/dashboard-bot-list';

type TCardProps = {
    has_dashboard_strategies: boolean;
    is_mobile: boolean;
};

type TCardArray = {
    id: string;
    icon: React.ReactElement;
    content: React.ReactElement;
    description: React.ReactElement;
    accent: string;
    callback: () => void;
};

const Cards = observer(({ is_mobile, has_dashboard_strategies }: TCardProps) => {
    const { dashboard, load_modal, quick_strategy, google_drive } = useStore();

    const { toggleLoadModal, setActiveTabIndex } = load_modal;
    const { is_google_drive_configured } = google_drive;
    const { isDesktop } = useDevice();

    const {
        onCloseDialog,
        dialog_options,
        is_dialog_open,
        setActiveTab,
        setPreviewOnPopup,
    } = dashboard;

    const { setFormVisibility } = quick_strategy;

    /**
     * Opens the existing bot import flow.
     * This keeps the real bot-upload functionality already provided
     * by the Deriv bot builder.
     */
    const openFileLoader = () => {
        toggleLoadModal();
        setActiveTabIndex(is_mobile ? 0 : 1);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    /**
     * Opens the existing Google Drive loader.
     * Google Drive is kept available internally even though it is
     * no longer one of the four main Jixirio quick-action cards.
     */
    const openGoogleDriveDialog = () => {
        const google_drive_tab_index = isDesktop ? 2 : 1;

        toggleLoadModal();
        setActiveTabIndex(google_drive_tab_index);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    /**
     * Opens Jixirio Free Bots / Best Bots.
     *
     * Best Bots is currently tab 2 and is already registered in
     * DBOT_TABS, so we can connect the Dashboard directly to it.
     */
    const openFreeBots = () => {
        setActiveTab(DBOT_TABS.BEST_BOTS);
    };

    /**
     * Opens the existing Bot Builder workspace.
     */
    const openBotEditor = () => {
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    /**
     * Opens the existing Quick Strategy form inside Bot Builder.
     */
    const openQuickStrategy = () => {
        setActiveTab(DBOT_TABS.BOT_BUILDER);
        setFormVisibility(true);
    };

    const actions: TCardArray[] = [
        {
            id: 'upload-bot',
            icon: is_mobile ? (
                <DerivLightLocalDeviceIcon height='48px' width='48px' />
            ) : (
                <DerivLightMyComputerIcon height='48px' width='48px' />
            ),
            content: <Localize i18n_default_text='Upload Bot' />,
            description: <Localize i18n_default_text='Import a bot from your device' />,
            accent: 'orange',
            callback: openFileLoader,
        },
        {
            id: 'free-bots',
            icon: <DerivLightBotBuilderIcon height='48px' width='48px' />,
            content: <Localize i18n_default_text='Free Bots' />,
            description: <Localize i18n_default_text='Explore ready-made trading strategies' />,
            accent: 'green',
            callback: openFreeBots,
        },
        {
            id: 'bot-editor',
            icon: <DerivLightBotBuilderIcon height='48px' width='48px' />,
            content: <Localize i18n_default_text='Bot Editor' />,
            description: <Localize i18n_default_text='Build and edit your own bot' />,
            accent: 'purple',
            callback: openBotEditor,
        },
        {
            id: 'quick-strategy',
            icon: <DerivLightQuickStrategyIcon height='48px' width='48px' />,
            content: <Localize i18n_default_text='Quick Strategy' />,
            description: <Localize i18n_default_text='Start with a quick trading setup' />,
            accent: 'yellow',
            callback: openQuickStrategy,
        },
    ];

    return React.useMemo(
        () => (
            <div
                className={classNames('tab__dashboard__table', {
                    'tab__dashboard__table--minimized':
                        has_dashboard_strategies && is_mobile,
                })}
            >
                <div
                    className={classNames('tab__dashboard__table__tiles', {
                        'tab__dashboard__table__tiles--minimized':
                            has_dashboard_strategies && is_mobile,
                    })}
                    id='tab__dashboard__table__tiles'
                >
                    {actions.map(action => {
                        const {
                            icon,
                            content,
                            description,
                            callback,
                            id,
                            accent,
                        } = action;

                        return (
                            <button
                                key={id}
                                type='button'
                                className={classNames(
                                    'tab__dashboard__table__block',
                                    `tab__dashboard__table__block--${accent}`,
                                    {
                                        'tab__dashboard__table__block--minimized':
                                            has_dashboard_strategies && is_mobile,
                                    }
                                )}
                                onClick={callback}
                            >
                                <div
                                    className={classNames(
                                        'tab__dashboard__table__images',
                                        `tab__dashboard__table__images--${accent}`,
                                        {
                                            'tab__dashboard__table__images--minimized':
                                                has_dashboard_strategies,
                                        }
                                    )}
                                >
                                    {icon}
                                </div>

                                <Text
                                    color='prominent'
                                    size={is_mobile ? 'xxs' : 'xs'}
                                >
                                    {content}
                                </Text>

                                <span className='tab__dashboard__table__description'>
                                    {description}
                                </span>

                                <span className='tab__dashboard__table__open'>
                                    Open →
                                </span>
                            </button>
                        );
                    })}

                    {/* Existing Google Drive modal remains functional internally. */}
                    {!isDesktop ? (
                        <Dialog
                            title={dialog_options.title}
                            is_visible={is_dialog_open}
                            onCancel={onCloseDialog}
                            is_mobile_full_width
                            className='dc-dialog__wrapper--google-drive'
                            has_close_icon
                        >
                            <GoogleDrive />
                        </Dialog>
                    ) : (
                        <MobileFullPageModal
                            is_modal_open={is_dialog_open}
                            className='load-strategy__wrapper'
                            header={localize('Load strategy')}
                            onClickClose={() => {
                                setPreviewOnPopup(false);
                                onCloseDialog();
                            }}
                            height_offset='80px'
                        >
                            <div
                                label='Google Drive'
                                className='google-drive-label'
                            >
                                <GoogleDrive />
                            </div>
                        </MobileFullPageModal>
                    )}
                </div>

                <DashboardBotList />
            </div>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [is_dialog_open, has_dashboard_strategies, is_google_drive_configured]
    );
});

export default Cards;
