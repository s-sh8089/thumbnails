"use client";

import { createContext, useContext, useState } from "react";

type GlobalState = {
  value: string;
  count: number;
};

type GlobalContextType = {
  state: GlobalState;
  setState: React.Dispatch<React.SetStateAction<GlobalState>>;
};

const defaultState: GlobalState = { value: "", count: 0 };

const GlobalContext = createContext<GlobalContextType>({
  state: defaultState,
  setState: () => {},
});

export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GlobalState>(defaultState);
  return (
    <GlobalContext.Provider value={{ state, setState }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
