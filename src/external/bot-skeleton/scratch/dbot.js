// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
/* eslint-disable no-underscore-dangle */
import { action, computed, makeObservable, observable } from 'mobx';
import { config } from '@/external/bot-skeleton';
import { browserOptimizer } from '@/utils/browser-performance-optimizer';
import GTM from '@/utils/gtm';
import RootStore from './root-store';

export interface IFlyoutStore {
    block_listeners: unknown[];
    block_workspaces: Element[];
    flyout_min_width: number;
    options: {
        media: string;
        move: { scrollbars: boolean; drag: boolean; wheel: boolean };
        zoom: { startScale: number };
        sounds: boolean;
    };
    is_help_content: boolean;
    flyout_content: Element[];
    flyout_width: number;
    is_visible: boolean;
    is_search_flyout: boolean;
    is_loading: boolean;
    search_term: string;
    selected_category: Element | null;
    onMount: () => void;
    onUnmount: () => void;
    initFlyout: () => void;
    initBlockWorkspace: (el_block_workspace: HTMLElement, block_node: Node) => void;
    getFlyout: () => Element;
    setContents: (xml_list: Element[], search_term: string) => void;
    setFlyoutWidth: (xmlList: Element[]) => void;
    setVisibility: (is_visible: boolean) => void;
    setIsSearchFlyout: (is_search: boolean) => void;
    setSelectedCategory: (selected_category: Element | null) => void;
    getSelectedCategory: () => Element | null;
    onClickOutsideFlyout: (event: unknown) => void;
    refreshCategory: () => void;
    variables_blocks_count: number;
    first_get_variable_block_index: number;
}

export default class FlyoutStore implements IFlyoutStore {
    root_store: RootStore;
    flyout = null;
    block_listeners = [];
    block_workspaces = [];
    flyout_min_width = 440;
    flyout_width_timer: ReturnType<typeof setTimeout> | undefined = undefined;
    flyout_init_timer: ReturnType<typeof setTimeout> | undefined = undefined;

    options = {
        renderer: 'zelos',
        media: `${window.__webpack_public_path__}assets/media/`,
        move: { scrollbars: false, drag: true, wheel: false },
        zoom: { startScale: config().workspaces.flyoutWorkspacesStartScale },
        sounds: false,
        theme: window?.Blockly?.Themes?.zelos_renderer,
    };

    is_help_content = false;
    flyout_content: Element[] = [];
    flyout_width = this.flyout_min_width;
    is_visible = false;
    is_search_flyout = false;
    is_loading = false;
    search_term = '';
    selected_category: Element | null = null;

    constructor(root_store: RootStore) {
        makeObservable(this, {
            is_help_content: observable,
            flyout_content: observable,
            flyout_width: observable,
            is_visible: observable,
            is_search_flyout: observable,
            is_loading: observable,
            search_term: observable,
            selected_category: observable,
            onMount: action.bound,
            onUnmount: action.bound,
            initFlyout: action.bound,
            initBlockWorkspace: action.bound,
            getFlyout: action.bound,
            setContents: action.bound,
            setFlyoutWidth: action.bound,
            setVisibility: action.bound,
            setIsSearchFlyout: action.bound,
            setSelectedCategory: action.bound,
            getSelectedCategory: action.bound,
            onClickOutsideFlyout: action.bound,
            refreshCategory: action.bound,
            variables_blocks_count: computed,
            first_get_variable_block_index: computed,
        });

        this.root_store = root_store;
    }

    onMount() {
        const initialize = () => {
            const workspace = window.Blockly?.derivWorkspace;

            if (!workspace || typeof workspace.getVariableMap !== 'function') {
                this.flyout_init_timer = setTimeout(initialize, 100);
                return;
            }

            if (!this.flyout) {
                this.initFlyout();
            }

            if (this.flyout) {
                window.addEventListener('click', this.onClickOutsideFlyout);
            }
        };

        initialize();
    }

    onUnmount() {
        window.removeEventListener('click', this.onClickOutsideFlyout);

        if (this.flyout_init_timer) {
            clearTimeout(this.flyout_init_timer);
            this.flyout_init_timer = undefined;
        }

        this.cleanupBlockWorkspaces();
        this.flyout_content = [];
        this.selected_category = null;

        if (this.flyout_width_timer) {
            clearTimeout(this.flyout_width_timer);
            this.flyout_width_timer = undefined;
        }

        this.flyout = null;
    }

    initFlyout() {
        const workspace = window.Blockly?.derivWorkspace;

        if (
            !workspace ||
            typeof workspace.getVariableMap !== 'function' ||
            typeof workspace.getGesture !== 'function'
        ) {
            console.warn('Blockly main workspace is not ready. Flyout initialization skipped.');
            return;
        }

        const flyoutWorkspaceOptions = new window.Blockly.Options({
            parentWorkspace: workspace,
            rtl: workspace.RTL,
            horizontalLayout: true,
            theme: window?.Blockly?.Themes?.zelos_renderer,
        });

        try {
            if (workspace.horizontalLayout) {
                this.flyout = new window.Blockly.HorizontalFlyout(flyoutWorkspaceOptions);
            } else {
                this.flyout = new window.Blockly.VerticalFlyout(flyoutWorkspaceOptions);
            }

            if (!this.flyout?.workspace_) {
                this.flyout = null;
                console.warn('Blockly flyout workspace could not be initialized.');
                return;
            }

            this.flyout.targetWorkspace = workspace;
            this.flyout.workspace_.targetWorkspace = workspace;
            this.flyout.workspace_.getGesture = workspace.getGesture.bind(workspace);

            const variable_map = workspace.getVariableMap();

            if (!variable_map) {
                this.flyout = null;
                console.warn('Blockly main workspace variable map is unavailable.');
                return;
            }

            workspace.VariableMap = variable_map;

            if (typeof this.flyout.workspace_.createPotentialVariableMap === 'function') {
                this.flyout.workspace_.createPotentialVariableMap();
            }
        } catch (error) {
            this.flyout = null;
            console.error('Blockly flyout initialization failed:', error);
        }
    }

    /**
     * Initialises a workspace unique to the passed block_node.
     */
    initBlockWorkspace(el_block_workspace: HTMLElement, block_node: Node) {
        const Blockly = window.Blockly;
        const main_workspace = Blockly?.derivWorkspace;

        if (
            !Blockly ||
            !main_workspace ||
            typeof main_workspace.getVariableMap !== 'function' ||
            !el_block_workspace ||
            !block_node ||
            !this.flyout
        ) {
            console.warn('Blockly block preview skipped because its workspace is not ready.');
            return;
        }

        let workspace = null;

        try {
            workspace = Blockly.inject(el_block_workspace, this.options);

            if (!workspace || typeof workspace.getVariableMap !== 'function') {
                workspace?.dispose?.();
                console.warn('Blockly could not create the block preview workspace.');
                return;
            }

            workspace.targetWorkspace = main_workspace;

            const block = Blockly.Xml.domToBlock(block_node, workspace);

            if (!block) {
                workspace.dispose();
                return;
            }

            const block_hw = block.getHeightWidth();

            block.isInFlyout = true;

            el_block_workspace.style.height = `${Math.ceil(block_hw.height * this.options.zoom.startScale) + 1}px`;
            el_block_workspace.style.width = `${Math.ceil(block_hw.width * this.options.zoom.startScale) + 1}px`;
            block.moveBy(1, 1);

            const block_svg_root = block.getSvgRoot();

            if (!block_svg_root) {
                workspace.dispose();
                return;
            }

            const listeners = [
                Blockly?.browserEvents?.conditionalBind(block_svg_root, 'mousedown', null, event => {
                    GTM?.pushDataLayer?.({
                        event: 'dbot_drag_block',
                        block_type: block.type,
                    });

                    if (this.flyout?.blockMouseDown) {
                        this.flyout.blockMouseDown(block)(event as window.Blockly.Events.UiBase);
                    }
                }),
                Blockly?.browserEvents?.bind(block_svg_root, 'mouseout', block, block.removeSelect),
                Blockly?.browserEvents?.bind(block_svg_root, 'mouseover', block, block.addSelect),
            ].filter(Boolean);

            this.block_listeners.push(...listeners);
            this.block_workspaces.push(workspace);

            Blockly.svgResize(workspace);
        } catch (error) {
            try {
                workspace?.dispose?.();
            } catch (dispose_error) {
                console.warn('Blockly preview cleanup failed:', dispose_error);
            }

            console.error('Blockly block preview initialization failed:', error);
        }
    }

    getFlyout() {
        return this.flyout;
    }

    /**
     * Parses XML contents passed by window.Blockly.Toolbox.
     */
    setContents(xml_list: Element[], search_term = '') {
        const text_limit = 20;
        const processed_xml = xml_list;

        this.cleanupBlockWorkspaces();

        this.is_help_content = false;
        this.search_term = search_term.length > text_limit ? `${search_term.substring(0, text_limit)}...` : search_term;
        this.flyout_content = xml_list;

        this.setFlyoutWidth(processed_xml);
        this.setVisibility(true);

        setTimeout(() => this.setFlyoutWidth(processed_xml), 50);
    }

    private cleanupBlockWorkspaces() {
        try {
            this.block_listeners.forEach(listener => {
                if (listener && typeof window.Blockly?.browserEvents?.unbind === 'function') {
                    window.Blockly.browserEvents.unbind(listener);
                }
            });
        } catch (error) {
            console.warn('Error cleaning up block listeners:', error);
        }

        try {
            this.block_workspaces.forEach(workspace => {
                if (workspace && typeof workspace.dispose === 'function') {
                    workspace.dispose();
                }
            });
        } catch (error) {
            console.warn('Error disposing block workspaces:', error);
        }

        this.block_listeners = [];
        this.block_workspaces = [];
    }

    /**
     * Calculates the width of the flyout based on its XML blocks.
     */
    setFlyoutWidth(xmlList: Element[]) {
        if (this.flyout_width_timer) {
            clearTimeout(this.flyout_width_timer);
        }

        const throttleDelay = browserOptimizer.getThrottleDelay();

        this.flyout_width_timer = setTimeout(() => {
            this.calculateFlyoutWidth(xmlList);
        }, throttleDelay);
    }

    private calculateFlyoutWidth(xmlList: Element[]) {
        browserOptimizer.safeDOMOperation(() => {
            let longest_block_width = 0;

            try {
                xmlList.forEach((node: Element) => {
                    const tag_name = node.tagName.toUpperCase();

                    if (tag_name === window.Blockly.Xml.NODE_BLOCK) {
                        const block_hw = window.Blockly.Block.getDimensions(node);

                        node.setAttribute('width', String(Math.ceil(block_hw.width * this.options.zoom.startScale)));
                        node.setAttribute('height', String(Math.ceil(block_hw.height * this.options.zoom.startScale)));

                        longest_block_width = Math.max(
                            longest_block_width,
                            Math.ceil(block_hw.width * this.options.zoom.startScale)
                        );
                    }
                });

                this.flyout_width = Math.max(this.flyout_min_width, longest_block_width + 65);
            } catch (error) {
                console.warn('Error calculating flyout width:', error);
                this.flyout_width = this.flyout_min_width;
            }
        });
    }

    /**
     * Sets whether the flyout is visible or not.
     */
    setVisibility(is_visible: boolean) {
        this.is_visible = is_visible;

        if (!is_visible) {
            this.setSelectedCategory(null);
            this.flyout_content = [];
        }

        const workspace = window.Blockly?.derivWorkspace;

        if (workspace) {
            workspace.isFlyoutVisible = is_visible;
        }
    }

    /**
     * Sets whether the flyout is search or not.
     */
    setIsSearchFlyout(is_search: boolean) {
        this.is_search_flyout = is_search;
    }

    setSelectedCategory(selected_category: Element | null) {
        this.selected_category = selected_category;
    }

    getSelectedCategory() {
        return this.selected_category;
    }

    /**
     * Close the flyout on click outside itself or parent toolbox.
     */
    onClickOutsideFlyout(event: MouseEvent) {
        if (!this.is_visible || !window.Blockly?.derivWorkspace) {
            return;
        }

        const toolbox = document.getElementById('gtm-toolbox');
        const path = event?.composedPath() || [];

        const is_flyout_click = path.some(
            el => (el as Element).classList && (el as Element).classList.contains('flyout')
        );

        const is_search_focus = this.root_store.toolbox.is_search_focus;
        const isToolboxClick = () => toolbox?.contains(event.target as Node);

        if (!is_flyout_click && !isToolboxClick() && !is_search_focus) {
            this.setVisibility(false);
            this.setSelectedCategory(null);
        }
    }

    refreshCategory() {
        const category = this.getSelectedCategory();
        const { toolbox } = this.root_store;
        const flyout_content = toolbox.getCategoryContents(category);
        this.setContents(flyout_content);
    }

    get variables_blocks_count() {
        return this.flyout_content.filter((block: Element) => block.getAttribute('type') === 'variables_get').length;
    }

    get first_get_variable_block_index() {
        return this.flyout_content.length - this.variables_blocks_count;
    }
                         }
