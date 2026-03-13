import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Bloomberg groups use colors. We'll map them to numeric IDs.
// 0 = None (Independent)
// 1 = Yellow
// 2 = Green
// 3 = Blue
// 4 = Red

type TerminalState = {
    activeTicker: string; // The global "selected" ticker (Channel 1)
    setActiveTicker: (ticker: string) => void;

    activeView: string;
    setActiveView: (view: string) => void;

    // Multi-channel support
    channelTickers: Record<number, string>;
    setChannelTicker: (channel: number, ticker: string) => void;
};

const defaultState: TerminalState = {
    activeTicker: "AAPL",
    setActiveTicker: () => { },
    activeView: "DASHBOARD",
    setActiveView: () => { },
    channelTickers: { 1: "AAPL", 2: "BTCUSD", 3: "EURUSD", 4: "XAUUSD" },
    setChannelTicker: () => { },
};

const TerminalContext = createContext<TerminalState>(defaultState);

export function TerminalProvider({ children }: { children: ReactNode }) {
    const [channelTickers, setChannelTickers] = useState<Record<number, string>>({
        1: "AAPL",
        2: "BTCUSD",
        3: "EURUSD",
        4: "XAUUSD"
    });
    const [activeView, setActiveView] = useState<string>("DASHBOARD");

    // activeTicker is just an alias for Channel 1 (Primary)
    const activeTicker = channelTickers[1];

    const setActiveTicker = (ticker: string) => {
        setChannelTickers(prev => ({ ...prev, 1: ticker }));
    };

    const setChannelTicker = (channel: number, ticker: string) => {
        setChannelTickers(prev => ({ ...prev, [channel]: ticker }));
    };

    return (
        <TerminalContext.Provider value={{
            activeTicker,
            setActiveTicker,
            activeView,
            setActiveView,
            channelTickers,
            setChannelTicker
        }}>
            {children}
        </TerminalContext.Provider>
    );
}

export function useTerminal() {
    const context = useContext(TerminalContext);
    if (!context) {
        throw new Error("useTerminal must be used within a TerminalProvider");
    }
    return context;
}

// Channel Context for individual panels
type ChannelContextType = {
    ticker: string;
    setTicker: (ticker: string) => void;
};

const ChannelContext = createContext<ChannelContextType>({
    ticker: "AAPL",
    setTicker: () => { }
});

export function ChannelProvider({ channel, children }: { channel: number, children: ReactNode }) {
    const { channelTickers, setChannelTicker } = useTerminal();

    const ticker = channelTickers[channel] || channelTickers[1];
    const setTicker = (newTicker: string) => {
        setChannelTicker(channel, newTicker);
    };

    return (
        <ChannelContext.Provider value={{ ticker, setTicker }}>
            {children}
        </ChannelContext.Provider>
    );
}

export function useChannel() {
    return useContext(ChannelContext);
}

// Keeping this for compatibility or simpler use cases
export function useChannelTicker() {
    return useContext(ChannelContext).ticker;
}


