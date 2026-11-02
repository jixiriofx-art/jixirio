
import { getTradingTimes, TRADING_TIMES } from '../../../../components/shared/utils/common-data';
import PendingPromise from '../../utils/pending-promise';
import { api_base } from './api-base';

const TRADING_TIMES_TIMEOUT = 8000;

export default class TradingTimes {
    constructor({ ws, server_time }) {
        this.init_promise = new PendingPromise();
        this.is_initialised = false;
        this.trading_times = {};
        this.ws = ws;
        this.server_time = server_time.clone();
    }

    async initialise() {
        if (this.is_initialised) {
            return this.init_promise;
        }

        this.is_initialised = true;
        this.last_update_moment = this.server_time.local();

        if (!Object.keys(this.trading_times).length) {
            await this.updateTradingTimes();
            this.init_promise.resolve();

            const periodicUpdate = async () => {
                const changes = this.updateMarketOpenClosed();

                if (Object.keys(changes).length > 0 && this.onMarketOpenCloseChanged) {
                    this.onMarketOpenCloseChanged(changes);
                }

                let next_update_date = this.nextUpdateDate();

                if (!next_update_date) {
                    const now_moment = this.server_time.local();
                    const next_update_moment = this.last_update_moment.clone().add(1, 'days');

                    if (now_moment.isAfter(next_update_moment)) {
                        this.last_update_moment = now_moment.clone();
                    } else {
                        this.last_update_moment = next_update_moment.clone();
                    }

                    const is_open_map = {};

                    Object.keys(this.trading_times).forEach(symbol_name => {
                        is_open_map[symbol_name] = this.trading_times[symbol_name].is_opened;
                    });

                    await this.updateTradingTimes();

                    Object.keys(this.trading_times).forEach(symbol_name => {
                        this.trading_times[symbol_name].is_opened = is_open_map[symbol_name];
                    });

                    next_update_moment.set({ hour: 0, minute: 0, second: 0 });
                    next_update_date = next_update_moment.toDate();
                }

                const wait_period = Math.max(
                    1000,
                    next_update_date - this.server_time.local().toDate()
                );

                this.update_timer = setTimeout(periodicUpdate, wait_period);
            };

            await periodicUpdate();
        }

        return this.init_promise;
    }

    async updateTradingTimes() {
        const last_update_date = this.last_update_moment.format('YYYY-MM-DD');
        let timeoutId;

        try {
            if (!api_base.api && !this.ws) {
                this.setTradingTimes();
                return;
            }

            const request =
                api_base.api?.send({ trading_times: last_update_date }) ||
                this.ws?.send({ trading_times: last_update_date });

            if (!request) {
                this.setTradingTimes();
                return;
            }

            const response = await Promise.race([
                Promise.resolve(request),
                new Promise((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error('Trading times request timed out'));
                    }, TRADING_TIMES_TIMEOUT);
                }),
            ]);

            if (response?.error) {
                this.setTradingTimes();
                return;
            }

            this.trading_times = {};

            const now = this.server_time.local().toDate();
            const date_str = now.toISOString().substring(0, 11);
            const getUTCDate = hour => new Date(`${date_str}${hour}Z`);

            if (!response?.trading_times?.markets) {
                this.setTradingTimes();
                return;
            }

            const {
                trading_times: { markets },
            } = response;

            markets?.forEach(market => {
                const { submarkets } = market;

                submarkets?.forEach(submarket => {
                    const { symbols } = submarket;

                    symbols?.forEach(symbol_obj => {
                        const { times, underlying_symbol } = symbol_obj;

                        if (
                            !underlying_symbol ||
                            typeof underlying_symbol !== 'string' ||
                            underlying_symbol.trim() === ''
                        ) {
                            return;
                        }

                        if (!times || !times.open || !times.close) {
                            return;
                        }

                        const { open, close } = times;

                        const is_open_all_day =
                            open.length === 1 &&
                            open[0] === '00:00:00' &&
                            close[0] === '23:59:59';

                        const is_closed_all_day =
                            open.length === 1 &&
                            open[0] === '--' &&
                            close[0] === '--';

                        let processed_times;

                        if (!is_open_all_day && !is_closed_all_day) {
                            processed_times = open.map((open_time, index) => ({
                                open: getUTCDate(open_time),
                                close: getUTCDate(close[index]),
                            }));
                        }

                        this.trading_times[underlying_symbol] = {
                            is_open_all_day,
                            is_closed_all_day,
                            times: processed_times,
                        };
                    });
                });
            });

            this.injectAdditionalTradingTimes();

            if (Object.keys(this.trading_times).length === 0) {
                this.setTradingTimes();
            }
        } catch (error) {
            console.warn('[TradingTimes] Using fallback trading times:', error);
            this.setTradingTimes();
        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    }

    injectAdditionalTradingTimes() {
        const additionalSymbols = ['1HZ15V', '1HZ30V', '1HZ90V'];

        additionalSymbols.forEach(symbol => {
            if (!this.trading_times[symbol]) {
                this.trading_times[symbol] = {
                    is_open_all_day: true,
                    is_closed_all_day: false,
                    times: undefined,
                    is_opened: true,
                };
            }
        });
    }

    setTradingTimes() {
        this.trading_times = {};

        TRADING_TIMES.SYMBOLS.forEach(symbol => {
            if (symbol && typeof symbol === 'string' && symbol.trim() !== '') {
                try {
                    const tradingTimeData = getTradingTimes(symbol);

                    if (tradingTimeData && typeof tradingTimeData === 'object') {
                        this.trading_times[symbol] = tradingTimeData;
                    }
                } catch (error) {
                    console.warn(
                        `[TradingTimes] Failed to get trading times for symbol: ${symbol}`,
                        error
                    );
                }
            }
        });
    }

    updateMarketOpenClosed() {
        const changes = {};

        Object.keys(this.trading_times).forEach(symbol_name => {
            const is_opened = this.calcIsMarketOpened(symbol_name);
            const symbol_obj = this.trading_times[symbol_name];

            if (symbol_obj.is_opened !== is_opened) {
                symbol_obj.is_opened = is_opened;
                changes[symbol_name] = is_opened;
            }
        });

        return changes;
    }

    calcIsMarketOpened(symbol_name) {
        const now = this.server_time.local().unix();
        const { times, is_open_all_day, is_closed_all_day } = this.trading_times[symbol_name];

        if (is_closed_all_day) {
            return false;
        }

        if (is_open_all_day) {
            return true;
        }

        return times.some(session => {
            const { open, close } = session;
            return now >= open && now < close;
        });
    }

    nextUpdateDate() {
        const now = this.server_time.local().toDate();
        let nextDate;

        Object.keys(this.trading_times).forEach(symbol_name => {
            const { times, is_open_all_day, is_closed_all_day } = this.trading_times[symbol_name];

            if (is_open_all_day || is_closed_all_day || !times) {
                return;
            }

            times.forEach(session => {
                const { open, close } = session;

                if (open > now && (!nextDate || open < nextDate)) {
                    nextDate = open;
                }

                if (close > now && (!nextDate || close < nextDate)) {
                    nextDate = close;
                }
            });
        });

        return nextDate;
    }

    isMarketOpened(symbol_name) {
        const symbol_names = Object.keys(this.trading_times);

        if (!symbol_names.length || !symbol_names.includes(symbol_name)) {
            return false;
        }

        return this.trading_times[symbol_name].is_opened;
    }

    getSymbolDisplayName(symbol) {
        return TRADING_TIMES.SYMBOL_DISPLAY_NAMES[symbol] || symbol;
    }
}
