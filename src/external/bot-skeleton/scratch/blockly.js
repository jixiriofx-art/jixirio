import * as BlocklyJavaScript from 'blockly/javascript';
import { localize } from '@deriv-com/translations';
import { setColors } from './hooks/colours.js';
import goog from './goog.js';

window.goog = goog;

const setBlocklyLoadStage = stage => {
    window.__JIXIRIO_BLOCKLY_STAGE__ = stage;

    let panel = document.getElementById('jixirio-blockly-load-stage');
    if (!panel) {
        panel = document.createElement('pre');
        panel.id = 'jixirio-blockly-load-stage';
        panel.style.cssText =
            'position:fixed;top:100px;left:8px;right:8px;z-index:1000000;margin:0;padding:12px;' +
            'border:1px solid #20c9c3;border-radius:8px;background:#071b20;color:#d9fffd;' +
            'font:12px/1.5 monospace;white-space:pre-wrap;overflow-wrap:anywhere;box-shadow:0 4px 20px #0009;';
        document.body.appendChild(panel);
    }

    panel.textContent = '[Jixirio Blockly loader]\nStage: ' + stage;
};

const modifyBlocklyWorkSpaceContextMenu = () => {
    const exclude_item = ['blockInline'];
    exclude_item.forEach(item_id => {
        const option = window.Blockly.ContextMenuRegistry.registry.getItem(item_id);
        option.preconditionFn = () => 'hidden';
    });

    const items_to_localize = {
        undoWorkspace: localize('Undo'),
        redoWorkspace: localize('Redo'),
        cleanWorkspace: localize('Clean up Blocks'),
        collapseWorkspace: localize('Collapse Blocks'),
        expandWorkspace: localize('Expand Blocks'),
        workspaceDelete: localize('Delete All Blocks'),
    };

    Object.keys(items_to_localize).forEach(item_id => {
        const option = window.Blockly.ContextMenuRegistry.registry.getItem(item_id);
        option.displayText = localize(items_to_localize[item_id]);
    });
};

export const loadBlockly = async isDarkMode => {
    setBlocklyLoadStage('Starting loadBlockly()');

    const watchdog = window.setTimeout(() => {
        const stage = window.__JIXIRIO_BLOCKLY_STAGE__ || 'unknown';
        setBlocklyLoadStage('STALLED for 25 seconds at: ' + stage);
    }, 25000);

    try {
        setBlocklyLoadStage('Importing Blockly core');
        const BlocklyModule = await import('blockly');

        setBlocklyLoadStage('Registering Blockly core');
        window.Blockly = BlocklyModule.default;
        window.Blockly.Colours = {};

        setBlocklyLoadStage('Creating JavaScript generator');
        const BlocklyGenerator = new window.Blockly.Generator('code');
        const BlocklyJavaScriptGenerator = {
            ...BlocklyJavaScript,
            ...BlocklyGenerator,
        };
        window.Blockly.JavaScript = BlocklyJavaScriptGenerator;

        setBlocklyLoadStage('Creating Blockly theme');
        window.Blockly.Themes.zelos_renderer = window.Blockly.Theme.defineTheme('zelos_renderer', {
            base: window.Blockly.Themes.Zelos,
            componentStyles: {},
        });

        setBlocklyLoadStage('Configuring workspace context menu');
        modifyBlocklyWorkSpaceContextMenu();

        setBlocklyLoadStage('Applying workspace colours');
        setColors(isDarkMode);

        setBlocklyLoadStage('Importing Blockly hooks');
        await import('./hooks/index.js');

        setBlocklyLoadStage('Importing bot blocks');
        await import('./blocks');

        setBlocklyLoadStage('Blockly modules loaded; preparing workspace injection');
    } catch (error) {
        setBlocklyLoadStage(
            'FAILED at: ' + (window.__JIXIRIO_BLOCKLY_STAGE__ || 'unknown') +
            '\\n' + (error instanceof Error ? error.stack || error.message : String(error))
        );
        throw error;
    } finally {
        window.clearTimeout(watchdog);
    }
};
