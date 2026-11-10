// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
import React from 'react';
import { safeReactComponent } from '@/utils/safe-react-component';
import { observer } from 'mobx-react-lite';
import Dialog from '@/components/shared_ui/dialog';
import Text from '@/components/shared_ui/text';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import {
    getBotBuilderTourHeader,
    getTourDialogAction,
    getTourDialogInfo,
    onboarding_tour_header,
} from '../tour-content';
import { setTourSettings, tour_list } from '../utils';
import './tour-start-dialog.scss';

const SafeDialog = safeReactComponent('TourStartDialog.Dialog', Dialog);
const SafeText = safeReactComponent('TourStartDialog.Text', Text);
const SafeLocalize = safeReactComponent('TourStartDialog.Localize', Localize);


const TourStartDialog = observer(() => {
    const { dashboard } = useStore();
    const { active_tab, is_tour_dialog_visible, setTourDialogVisibility, setActiveTour, setShowMobileTourDialog } =
        dashboard;
    const { isDesktop } = useDevice();
    const tour_token = active_tab === 0 ? 'onboard_tour_token' : 'bot_builder_token';
    const toggleTour = () => {
        if (!isDesktop) setShowMobileTourDialog(false);
        setTourDialogVisibility(false);
        setActiveTour('');
        setTourSettings(new Date().getTime(), tour_token);
    };

    const onboard_tour = active_tab === DBOT_TABS.DASHBOARD;
    const tour_dialog_info = getTourDialogInfo(!isDesktop);
    const tour_dialog_action = getTourDialogAction(!isDesktop);
    const [is_tour_open, setIsTourOpen] = React.useState(false);

    React.useEffect(() => {
        if (is_tour_dialog_visible) {
            setIsTourOpen(true);
        } else {
            setIsTourOpen(false);
        }
    }, [is_tour_dialog_visible]);

    const getTourContent = () => {
        return (
            <>
                {onboard_tour ? (
                    <div>
                        <SafeLocalize
                            key={0}
                            i18n_default_text={`Let’s take a quick tour to discover how Deriv Bot works. Press <0>Start</0> to begin.`}
                            components={[<strong key={0} />]}
                        />
                    </div>
                ) : (
                    <>
                        <div className='dc-dialog__content__description__text'>{tour_dialog_info}</div>
                        {tour_dialog_action && (
                            <div className='dc-dialog__content__description__text'>{tour_dialog_action}</div>
                        )}
                        <div className='dc-dialog__content__description__text'>
                            <SafeLocalize
                                key={0}
                                i18n_default_text={'Note: You can find this tutorial in the <0>Tutorials</0> tab.'}
                                components={[<strong key={0} />]}
                            />
                        </div>
                    </>
                )}
            </>
        );
    };

    const onHandleConfirm = () => {
        setActiveTour(tour_list[active_tab]);
        if (!isDesktop) setShowMobileTourDialog(false);
        setTourDialogVisibility(false);
        setTourSettings(new Date().getTime(), tour_token);
    };
    const header_text_size = isDesktop ? 's' : 'xs';
    const content_text_size = isDesktop ? 'xs' : 'xxs';

    const tour_headers = active_tab === 0 ? onboarding_tour_header : getBotBuilderTourHeader(!isDesktop);
    return (
        <div>
            <SafeDialog
                is_visible={is_tour_open}
                cancel_button_text={localize('Skip')}
                onCancel={() => toggleTour()}
                confirm_button_text={localize('Start')}
                onConfirm={onHandleConfirm}
                is_mobile_full_width
                className={'dc-dialog tour-dialog'}
                has_close_icon={false}
                portal_element_id='modal_root'
            >
                <div className='dc-dialog__content__header'>
                    <SafeText weight='bold' color='prominent' size={header_text_size}>
                        {tour_headers}
                    </SafeText>
                </div>
                <div className='dc-dialog__content__description'>
                    <SafeText size={content_text_size} color='prominent'>
                        {getTourContent()}
                    </SafeText>
                </div>
            </SafeDialog>
        </div>
    );
});

export default TourStartDialog;
