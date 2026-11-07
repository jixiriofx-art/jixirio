import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

type FlyoutBlockProps = {
    block_node: Element;
    should_hide_display_name?: boolean;
};

const FlyoutBlock = observer(({ block_node, should_hide_display_name }: FlyoutBlockProps) => {
    const { flyout } = useStore();
    const blockWorkspaceRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const element = blockWorkspaceRef.current;

        if (!element || !window.Blockly?.derivWorkspace) {
            console.warn('[Jixirio] Flyout block workspace is not ready.');
            return;
        }

        try {
            flyout.initBlockWorkspace(element, block_node);
        } catch (error) {
            console.error('[Jixirio] Failed to initialize flyout block:', error);
        }
    }, [flyout, block_node]);

    return (
        <div
            ref={blockWorkspaceRef}
            className={classNames({
                'flyout__block-workspace--center': should_hide_display_name,
                'flyout__block-workspace--top': !should_hide_display_name,
            })}
            data-testid='flyout-block-workspace'
        />
    );
});

export default FlyoutBlock;
