import React from 'react';
import { safeReactComponent } from '@/utils/safe-react-component';
import { observer } from 'mobx-react-lite';
import BotBuilderTourDesktop from './bot-builder-tour-desktop';
import BotBuilderTourMobile from './bot-builder-tour-mobile';

const SafeBotBuilderTourDesktop = safeReactComponent('BotBuilderTourHandler.BotBuilderTourDesktop', BotBuilderTourDesktop);
const SafeBotBuilderTourMobile = safeReactComponent('BotBuilderTourHandler.BotBuilderTourMobile', BotBuilderTourMobile);


type TBotBuilderTourHandler = {
    is_mobile: boolean;
};

const BotBuilderTourHandler: React.FC<TBotBuilderTourHandler> = observer(({ is_mobile }) => {
    return <>{is_mobile ? <SafeBotBuilderTourMobile /> : <SafeBotBuilderTourDesktop />}</>;
});

export default BotBuilderTourHandler;
