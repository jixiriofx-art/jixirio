import TradeEngine from '../trade';
import getBotInterface from './BotInterface';
import getTicksInterface from './TicksInterface';
import getToolsInterface from './ToolsInterface';

const sleep = (observer, arg = 1) => {
    // Turbo mode skips only the artificial timeout; the interpreter still resumes
    // asynchronously so its observer/event loop remains intact.
    const delay = window.JixirioTurboSpeed ? 0 : Math.max(0, Number(arg) || 0) * 1000;

    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
            setTimeout(() => observer.emit('CONTINUE'), 0);
        }, delay);
    });
};

const Interface = $scope => {
    const tradeEngine = new TradeEngine($scope);
    const { observer } = $scope;
    const getInterface = () => {
        return {
            ...getBotInterface(tradeEngine),
            ...getToolsInterface(tradeEngine),
            getTicksInterface: getTicksInterface(tradeEngine),
            watch: (...args) => tradeEngine.watch(...args),
            sleep: (...args) => sleep(observer, ...args),
            alert: (...args) => alert(...args), // eslint-disable-line no-alert
            prompt: (...args) => prompt(...args), // eslint-disable-line no-alert
            console: {
                log(...args) {
                    // eslint-disable-next-line no-console
                    console.log(new Date().toLocaleTimeString(), ...args);
                },
            },
        };
    };
    return { tradeEngine, observer, getInterface };
};

export default Interface;
