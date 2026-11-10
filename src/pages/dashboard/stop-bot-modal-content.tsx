// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
import React from 'react';
import { safeReactComponent } from '@/utils/safe-react-component';
import { standalone_routes } from '@/components/shared';
import Dialog from '@/components/shared_ui/dialog';
import StaticUrl from '@/components/shared_ui/static-url';
import Text from '@/components/shared_ui/text';
import { generateUrlWithRedirect } from '@/utils/url-redirect-utils';
import { Localize, localize } from '@deriv-com/translations';

const SafeDialog = safeReactComponent('StopBotModalContent.Dialog', Dialog);
const SafeStaticUrl = safeReactComponent('StopBotModalContent.StaticUrl', StaticUrl);
const SafeText = safeReactComponent('StopBotModalContent.Text', Text);
const SafeLocalize = safeReactComponent('StopBotModalContent.Localize', Localize);


export type TStopBotModalContent = {
    is_running: boolean;
    is_dialog_open: boolean;
    is_contract_dialog_open: boolean;
    is_stop_bot_dialog_open: boolean;
    is_multiplier: boolean;
    closeMultiplierContract: () => void;
    onOkButtonClick: () => void;
    toggleStopBotDialog: () => void;
};

const StopBotModalContent = ({
    is_running,
    is_multiplier,
    is_contract_dialog_open,
    is_stop_bot_dialog_open,
    closeMultiplierContract,
    onOkButtonClick,
    toggleStopBotDialog,
}: TStopBotModalContent) => {
    const confirm_button_text = is_running && is_multiplier ? localize('Keep my contract') : localize('Stop my bot');
    const cancel_button_text = is_running && is_multiplier ? localize('Close my contract') : localize('Back');
    const title_text =
        is_running && is_multiplier ? localize('Keep your current contract?') : localize('Stop your current bot?');
    const toggle_dialog_or_stop = is_running && is_multiplier ? closeMultiplierContract : toggleStopBotDialog;

    return (
        <React.Fragment>
            <SafeDialog
                portal_element_id='modal_root'
                title={title_text}
                is_visible={is_running ? is_stop_bot_dialog_open : is_contract_dialog_open}
                confirm_button_text={confirm_button_text}
                onConfirm={onOkButtonClick}
                cancel_button_text={cancel_button_text}
                onCancel={toggle_dialog_or_stop}
                is_mobile_full_width={false}
                className={'toolbar__dialog'}
                has_close_icon
            >
                {is_running && is_multiplier ? (
                    <>
                        <SafeText as='p' lineHeight='s' size='xs' styles={{ paddingBottom: '2rem', paddingTop: '1rem' }}>
                            <SafeLocalize i18n_default_text='Close your contract now or keep it running. If you decide to keep it running, you can check and close it later on the ' />
                            <SafeText weight='bold' as='span' lineHeight='s' size='xs'>
                                <SafeStaticUrl
                                    key={0}
                                    className='link'
                                    onClick={() =>
                                        window.location.assign(generateUrlWithRedirect(standalone_routes.reports))
                                    }
                                >
                                    <SafeLocalize i18n_default_text='Reports' />
                                </SafeStaticUrl>
                            </SafeText>
                            <SafeLocalize i18n_default_text=' page.' />
                        </SafeText>
                        <SafeText as='p' lineHeight='s' size='xs'>
                            <SafeLocalize i18n_default_text='The Quick Strategy you just created will be loaded to the workspace.' />
                        </SafeText>
                    </>
                ) : (
                    <>
                        <SafeText as='p' lineHeight='s' size='xs' styles={{ paddingBottom: '2rem', paddingTop: '1rem' }}>
                            <SafeLocalize i18n_default_text='Stopping the current bot will load the Quick Strategy you just created to the workspace.' />
                        </SafeText>
                        <SafeText as='p' lineHeight='s' size='xs'>
                            <SafeLocalize i18n_default_text='Any open contracts can be viewed on the ' />
                            <SafeText weight='bold' as='span' lineHeight='s' size='xs'>
                                <SafeStaticUrl
                                    key={0}
                                    className='link'
                                    onClick={() =>
                                        window.location.assign(generateUrlWithRedirect(standalone_routes.reports))
                                    }
                                >
                                    <SafeLocalize i18n_default_text='Reports' />
                                </SafeStaticUrl>
                            </SafeText>
                            <SafeText as='span' lineHeight='s' size='xs' styles={{ paddingInlineStart: '0.4rem' }}>
                                <SafeLocalize i18n_default_text=' page.' />
                            </SafeText>
                        </SafeText>
                    </>
                )}
            </SafeDialog>
        </React.Fragment>
    );
};

export default StopBotModalContent;
