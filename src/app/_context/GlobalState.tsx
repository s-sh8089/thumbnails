"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

// 状態の型定義
interface State {
  value: string
  count: number
}

// Contextの型定義
interface ContextProps {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}

// 初期状態の定義
const initialState: State = {
  value: '',
  count: 0
};

// Contextの作成
const GlobalContext = createContext<ContextProps | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<State>(initialState);

  return (
    <GlobalContext.Provider value={{ state, setState }}>
      {children}
    </GlobalContext.Provider>
  );
};

// カスタムフックの作成
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};