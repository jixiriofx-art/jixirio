import Button from '@/components/shared_ui/button';
import { safeReactComponent } from '@/utils/safe-react-component';
import Popover from '@/components/shared_ui/popover';

const SafeButton = safeReactComponent('ToolbarButton.Button', Button);
const SafePopover = safeReactComponent('ToolbarButton.Popover', Popover);


type TToolbarButton = {
    popover_message?: string;
    button_id: string;
    button_classname: string;
    buttonOnClick: () => void;
    icon?: React.ReactElement;
    button_text: string;
    is_bot_running?: boolean;
};

const ToolbarButton = ({
    popover_message,
    button_id,
    button_classname,
    buttonOnClick,
    icon,
    button_text,
    is_bot_running,
}: TToolbarButton) => {
    const button = (
        <SafeButton id={button_id} className={button_classname} has_effect onClick={buttonOnClick} icon={icon} green>
            {button_text}
        </SafeButton>
    );

    if (is_bot_running) {
        return button;
    }

    return (
        <SafePopover alignment='bottom' message={popover_message} should_disable_pointer_events>
            {button}
        </SafePopover>
    );
};

export default ToolbarButton;
