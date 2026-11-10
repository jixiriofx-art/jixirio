// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
import React from 'react';
import { safeReactComponent } from '@/utils/safe-react-component';
import { observer } from 'mobx-react-lite';
import { tabs_title } from '@/constants/load-modal';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
/* [AI] - Analytics event tracking removed - see migrate-docs/MONITORING_PACKAGES.md for re-implementation guide */
/* [/AI] */
import MobileFullPageModal from '../shared_ui/mobile-full-page-modal';
import Modal from '../shared_ui/modal';
import Tabs from '../shared_ui/tabs';
import GoogleDrive from './google-drive';
import Local from './local';
import LocalFooter from './local-footer';
import Recent from './recent';
import RecentFooter from './recent-footer';

const SafeMobileFullPageModal = safeReactComponent('LoadModal.MobileFullPageModal', MobileFullPageModal);
const SafeModal = safeReactComponent('LoadModal.Modal', Modal);
const SafeTabs = safeReactComponent('LoadModal.Tabs', Tabs);
const SafeGoogleDrive = safeReactComponent('LoadModal.GoogleDrive', GoogleDrive);
const SafeLocal = safeReactComponent('LoadModal.Local', Local);
const SafeLocalFooter = safeReactComponent('LoadModal.LocalFooter', LocalFooter);
const SafeRecent = safeReactComponent('LoadModal.Recent', Recent);
const SafeRecentFooter = safeReactComponent('LoadModal.RecentFooter', RecentFooter);


const LoadModal: React.FC = observer(() => {
    const { load_modal, dashboard, google_drive } = useStore();
    const { is_google_drive_configured } = google_drive;
    const {
        active_index,
        is_load_modal_open,
        loaded_local_file,
        onEntered,
        recent_strategies,
        setActiveTabIndex,
        toggleLoadModal,
        tab_name,
    } = load_modal;
    const { setPreviewOnPopup } = dashboard;
    const { isDesktop } = useDevice();
    const header_text = localize('Load strategy');

    const handleTabItemClick = (active_index: number) => {
        setActiveTabIndex(active_index);
        /* [AI] - Analytics event tracking removed - see migrate-docs/MONITORING_PACKAGES.md for re-implementation guide */
        /* [/AI] */
    };

    if (!isDesktop) {
        return (
            <SafeMobileFullPageModal
                is_modal_open={is_load_modal_open}
                className='load-strategy__wrapper'
                header={header_text}
                onClickClose={() => {
                    setPreviewOnPopup(false);
                    toggleLoadModal();
                    // Removed close event tracking as per V2 requirements
                }}
                height_offset='80px'
                page_overlay
            >
                <SafeTabs active_index={active_index} onTabItemClick={handleTabItemClick} top>
                    <div label={localize('Local')}>
                        <SafeLocal />
                    </div>
                    {is_google_drive_configured && (
                        <div label='Google Drive'>
                            <SafeGoogleDrive />
                        </div>
                    )}
                </SafeTabs>
            </SafeMobileFullPageModal>
        );
    }

    const is_file_loaded = !!loaded_local_file && tab_name === tabs_title.TAB_LOCAL;
    const has_recent_strategies = recent_strategies.length > 0 && tab_name === tabs_title.TAB_RECENT;

    return (
        <SafeModal
            title={header_text}
            className='load-strategy'
            width='1000px'
            height='80vh'
            is_open={is_load_modal_open}
            toggleModal={() => {
                toggleLoadModal();
                // Removed close event tracking as per V2 requirements
            }}
            onEntered={onEntered}
            elements_to_ignore={[document.querySelector('.injectionDiv')]}
        >
            <SafeModal.Body>
                <SafeTabs active_index={active_index} onTabItemClick={handleTabItemClick} top header_fit_content>
                    <div label={localize('Recent')}>
                        <SafeRecent />
                    </div>
                    <div label={localize('Local')}>
                        <SafeLocal />
                    </div>
                    {is_google_drive_configured && (
                        <div label='Google Drive'>
                            <SafeGoogleDrive />
                        </div>
                    )}
                </SafeTabs>
            </SafeModal.Body>
            {has_recent_strategies && (
                <SafeModal.Footer has_separator>
                    <SafeRecentFooter />
                </SafeModal.Footer>
            )}
            {is_file_loaded && (
                <SafeModal.Footer has_separator>
                    <SafeLocalFooter />
                </SafeModal.Footer>
            )}
        </SafeModal>
    );
});

export default LoadModal;
