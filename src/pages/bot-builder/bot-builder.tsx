// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
import React from 'react';
import { safeReactComponent } from '@/utils/safe-react-component';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { botNotification } from '@/components/bot-notification/bot-notification';
import { notification_message } from '@/components/bot-notification/bot-notification-utils';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { TBlocklyEvents } from 'Types';
import { DBOT_TABS } from '@/constants/bot-contents';
import LoadModal from '../../components/load-modal';
import SaveModal from '../dashboard/bot-list/save-modal';
import BotBuilderTourHandler from '../tutorials/dbot-tours/bot-builder-tour';
import QuickStrategy1 from './quick-strategy';
import WorkspaceWrapper from './workspace-wrapper';

const SafeLoadModal = safeReactComponent('BotBuilder.LoadModal', LoadModal);
const SafeSaveModal = safeReactComponent('BotBuilder.SaveModal', SaveModal);
const SafeBotBuilderTourHandler = safeReactComponent('BotBuilder.BotBuilderTourHandler', BotBuilderTourHandler);
const SafeQuickStrategy = safeReactComponent('BotBuilder.QuickStrategy', QuickStrategy1);
const SafeWorkspaceWrapper = safeReactComponent('BotBuilder.WorkspaceWrapper', WorkspaceWrapper);


const BotBuilder = observer(() => {
    const { dashboard, app, run_panel, toolbar, quick_strategy } = useStore();
    const { active_tab, active_tour, is_preview_on_popup } = dashboard;
    const { is_open } = quick_strategy;
    const { is_running } = run_panel;
    const blockly_store = useStore().blockly_store;
    const is_blockly_listener_registered = React.useRef(false);
    const is_blockly_delete_listener_registered = React.useRef(false);
    const { isDesktop } = useDevice();
    const { onMount, onUnmount } = app;

    let deleted_block_id: null | string = null;

    // Initialize Blockly only after its container becomes visible.
    React.useEffect(() => {
        if (active_tab !== DBOT_TABS.BOT_BUILDER || is_preview_on_popup) {
            return;
        }

        let cancelled = false;

        onMount().catch(error => {
            console.error('[Jixirio] Bot Builder initialization failed:', error);

            if (!cancelled) {
                botNotification(
                    error instanceof Error
                        ? error.message
                        : 'Bot Builder initialization failed. Please reload and try again.',
                    undefined,
                    { type: 'error' }
                );
            }
        });

        return () => {
            cancelled = true;
        };
    }, [active_tab, is_preview_on_popup, onMount]);

    // Clean up only when the Bot Builder component unmounts.
    React.useEffect(() => {
        return () => onUnmount();
    }, [onUnmount]);

    React.useEffect(() => {
        if (active_tab !== DBOT_TABS.BOT_BUILDER || is_preview_on_popup || blockly_store.is_loading) {
            return;
        }

        const frame = window.requestAnimationFrame(() => {
            const workspace = window.Blockly?.derivWorkspace;

            if (workspace) {
                window.Blockly.svgResize(workspace);
                blockly_store.setContainerSize();
            }
        });

        return () => window.cancelAnimationFrame(frame);
    }, [active_tab, is_preview_on_popup, blockly_store.is_loading, blockly_store]);

    React.useEffect(() => {
        const workspace = window.Blockly?.derivWorkspace;

        if (workspace && is_running && !is_blockly_listener_registered.current) {
            is_blockly_listener_registered.current = true;
            workspace.addChangeListener(handleBlockChangeOnBotRun);
        } else {
            removeBlockChangeListener();
        }

        return () => {
            if (workspace && is_blockly_listener_registered.current) {
                removeBlockChangeListener();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [is_running]);

    const handleBlockChangeOnBotRun = (e: Event) => {
        const { is_reset_button_clicked } = toolbar;

        if (e.type !== 'selected' && !is_reset_button_clicked) {
            botNotification(notification_message().workspace_change);
            removeBlockChangeListener();
        } else if (is_reset_button_clicked) {
            removeBlockChangeListener();
        }
    };

    const removeBlockChangeListener = () => {
        is_blockly_listener_registered.current = false;
        window.Blockly?.derivWorkspace?.removeChangeListener(handleBlockChangeOnBotRun);
    };

    React.useEffect(() => {
        const workspace = window.Blockly?.derivWorkspace;

        if (workspace && !is_blockly_delete_listener_registered.current) {
            is_blockly_delete_listener_registered.current = true;
            workspace.addChangeListener(handleBlockDelete);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blockly_store.is_loading]);

    const handleBlockDelete = (e: TBlocklyEvents) => {
        const { is_reset_button_clicked, setResetButtonState } = toolbar;

        if (e.type === 'undo') {
            deleted_block_id = null;
            return;
        }

        if (e.type === 'delete' && !is_reset_button_clicked) {
            deleted_block_id = e.blockId;
        }

        if (e.type === 'selected' && deleted_block_id === e.oldElementId) {
            handleBlockDeleteNotification();
            deleted_block_id = null;
        }

        if (
            e.type === 'change' &&
            e.name === 'AMOUNT_LIMITS' &&
            e.newValue === '(min: 0.35 - max: 50000)' &&
            is_reset_button_clicked
        ) {
            setResetButtonState(false);
        }
    };

    const handleBlockDeleteNotification = () => {
        botNotification(notification_message().block_delete, {
            label: localize('Undo'),
            onClick: closeToast => {
                window.Blockly.derivWorkspace.undo();
                closeToast?.();
            },
        });
    };

    return (
        <>
            <div
                className={classNames('bot-builder', {
                    'bot-builder--active':
                        active_tab === DBOT_TABS.BOT_BUILDER && !is_preview_on_popup,
                    'bot-builder--inactive': is_preview_on_popup,
                    'bot-builder--tour-active': active_tour,
                })}
            >
                <div id='scratch_div'>
                    <SafeWorkspaceWrapper />
                </div>
            </div>

            {/* Keep the automatic onboarding dialog off mobile until its dialog tree is verified.
                It was opening immediately on Bot Builder entry and triggering React error #130. */}
            {active_tab === DBOT_TABS.BOT_BUILDER && isDesktop && (
                <SafeBotBuilderTourHandler is_mobile={false} />
            )}

            <SafeLoadModal />
            <SafeSaveModal />
            {is_open && <SafeQuickStrategy />}
        </>
    );
});

export default BotBuilder;
