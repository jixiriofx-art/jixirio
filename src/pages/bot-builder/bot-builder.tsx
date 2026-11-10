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


const showInitError = (error: unknown) => {
    const id = 'jixirio-bot-builder-diagnostic';
    document.getElementById(id)?.remove();

    const el = document.createElement('pre');
    el.id = id;
    el.style.cssText =
        'position:fixed;left:0;right:0;bottom:0;max-height:50vh;overflow:auto;z-index:999999;margin:0;' +
        'padding:12px;background:#160000;color:#ff7777;font:11px/1.4 monospace;white-space:pre-wrap;';
    const box = document.getElementById('scratch_div')?.getBoundingClientRect();
    const workspace = window.Blockly?.derivWorkspace;
    el.textContent =
        `[Jixirio] Bot Builder diagnostic\n${error instanceof Error ? error.stack || error.message : String(error)}\n\n` +
        `scratch_div: ${box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'missing'}\n` +
        `Blockly: ${typeof window.Blockly}\nworkspace: ${Boolean(workspace)}\n` +
        `workspace methods: ${workspace ? typeof workspace.getVariableMap : 'unavailable'}`;
    document.body.appendChild(el);
};

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

        const watchdog = window.setTimeout(() => {
            if (!cancelled && !window.Blockly?.derivWorkspace) {
                showInitError(new Error('No Blockly workspace was created within 10 seconds.'));
            }
        }, 10000);

        onMount()
            .then(() => {
                if (cancelled) return;

                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        if (cancelled) return;

                        const workspace = window.Blockly?.derivWorkspace;
                        const scratch = document.getElementById('scratch_div');
                        const injection = scratch?.querySelector('.injectionDiv');
                        const svg = injection?.querySelector('svg');
                        const mainBackground = svg?.querySelector('.blocklyMainBackground');
                        const blockCanvas = svg?.querySelector('.blocklyBlockCanvas');
                        const bubbleCanvas = svg?.querySelector('.blocklyBubbleCanvas');
                        const blocks = workspace?.getAllBlocks(false) || [];
                        const topBlocks = workspace?.getTopBlocks(false) || [];
                        const firstTopBlock = topBlocks[0];
                        const firstBlockSvg = firstTopBlock?.getSvgRoot?.();
                        const rect = element => {
                            if (!element) return 'missing';
                            const box = element.getBoundingClientRect();
                            return Math.round(box.width) + 'x' + Math.round(box.height) +
                                ' @ ' + Math.round(box.left) + ',' + Math.round(box.top);
                        };
                        const transform = element => element?.getAttribute?.('transform') || 'none';
                        const childCount = element => element?.children?.length ?? 'missing';
                        const svgBox = element => {
                            try {
                                const box = element?.getBBox?.();
                                return box
                                    ? [box.x, box.y, box.width, box.height].map(value => Math.round(value)).join(',')
                                    : 'unavailable';
                            } catch (error) {
                                return 'error: ' + String(error);
                            }
                        };
                        const firstBlockStyle = firstBlockSvg ? window.getComputedStyle(firstBlockSvg) : null;
                        const workspaceMetrics = (() => {
                            try {
                                const metrics = workspace?.getMetrics?.();
                                return metrics
                                    ? 'view=' + metrics.viewWidth + 'x' + metrics.viewHeight +
                                        ' content=' + metrics.contentWidth + 'x' + metrics.contentHeight +
                                        ' origin=' + metrics.contentLeft + ',' + metrics.contentTop
                                    : 'unavailable';
                            } catch (error) {
                                return 'error: ' + String(error);
                            }
                        })();
                        const style = element => {
                            if (!element) return 'missing';
                            const css = window.getComputedStyle(element);
                            return 'display=' + css.display + ', visibility=' + css.visibility +
                                ', opacity=' + css.opacity;
                        };
                        const details = [
                            '[Jixirio Blockly visual diagnostic]',
                            'Initialization: completed',
                            'Workspace: ' + Boolean(workspace),
                            'All blocks: ' + blocks.length,
                            'Top blocks: ' + topBlocks.length +
                                (topBlocks.length ? ' (' + topBlocks.map(block => block.type).join(', ') + ')' : ''),
                            '#scratch_div: ' + rect(scratch) + ' | ' + style(scratch),
                            '.injectionDiv: ' + rect(injection) + ' | ' + style(injection),
                            'Blockly SVG: ' + rect(svg) + ' | ' + style(svg),
                            'Main background: ' + rect(mainBackground),
                            'Block canvas: ' + rect(blockCanvas) + ' | children=' + childCount(blockCanvas) +
                                ' | transform=' + transform(blockCanvas),
                            'Bubble canvas: ' + rect(bubbleCanvas) + ' | children=' + childCount(bubbleCanvas) +
                                ' | transform=' + transform(bubbleCanvas),
                            'First top block: ' + (firstTopBlock?.type || 'missing') +
                                ' | svg=' + rect(firstBlockSvg) + ' | bbox=' + svgBox(firstBlockSvg) +
                                ' | transform=' + transform(firstBlockSvg) +
                                ' | display=' + (firstBlockStyle?.display || 'missing') +
                                ' | visibility=' + (firstBlockStyle?.visibility || 'missing') +
                                ' | opacity=' + (firstBlockStyle?.opacity || 'missing'),
                            'Workspace metrics: ' + workspaceMetrics,
                            'Blockly scale: ' + (workspace?.scale ?? 'unavailable'),
                            'SVG viewBox: ' + (svg?.getAttribute('viewBox') || 'missing'),
                            'Import audit: ' + ((window.__JIXIRIO_IMPORT_AUDIT__ || []).join(' | ') || 'no undefined imports recorded'),
                        ];

                        let panel = document.getElementById('jixirio-blockly-load-stage');
                        if (!panel) {
                            panel = document.createElement('pre');
                            panel.id = 'jixirio-blockly-load-stage';
                            panel.style.cssText =
                                'position:fixed;top:100px;left:8px;right:8px;z-index:1000000;margin:0;padding:12px;' +
                                'border:1px solid #20c9c3;border-radius:8px;background:#071b20;color:#d9fffd;' +
                                'font:12px/1.5 monospace;white-space:pre-wrap;overflow-wrap:anywhere;';
                            document.body.appendChild(panel);
                        }
                        panel.textContent = details.join('\n');
                    });
                });
            })
            .catch(error => {
                console.error('[Jixirio] Bot Builder initialization failed:', error);

                if (!cancelled) {
                    showInitError(error);
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
            window.clearTimeout(watchdog);
            document.getElementById('jixirio-bot-builder-diagnostic')?.remove();
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
