import DesktopWrapper from '@/components/shared_ui/desktop-wrapper';
import { safeReactComponent } from '@/utils/safe-react-component';
import MobileWrapper from '@/components/shared_ui/mobile-wrapper';
import Popover from '@/components/shared_ui/popover';
import { popover_zindex } from '@/constants/z-indexes';

const SafeDesktopWrapper = safeReactComponent('ToolbarIcon.DesktopWrapper', DesktopWrapper);
const SafeMobileWrapper = safeReactComponent('ToolbarIcon.MobileWrapper', MobileWrapper);
const SafePopover = safeReactComponent('ToolbarIcon.Popover', Popover);


type TToolbarIcon = {
    popover_message: string;
    icon: string | React.ReactNode;
};

const ToolbarIcon = ({ popover_message, icon }: TToolbarIcon) => {
    return (
        <>
            <SafeMobileWrapper>{icon}</SafeMobileWrapper>
            <SafeDesktopWrapper>
                <SafePopover
                    alignment='bottom'
                    message={popover_message}
                    zIndex={String(popover_zindex.TOOLBAR)}
                    should_disable_pointer_events
                >
                    {icon}
                </SafePopover>
            </SafeDesktopWrapper>
        </>
    );
};

export default ToolbarIcon;
