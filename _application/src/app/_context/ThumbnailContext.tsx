"use client";

import { createContext, useContext, useState } from "react";

type ThumbnailContextType = {
  canvasDataUrl: string | undefined;
  setCanvasDataUrl: (url: string | undefined) => void;
};

const ThumbnailContext = createContext<ThumbnailContextType>({
  canvasDataUrl: undefined,
  setCanvasDataUrl: () => {},
});

/** キャンバスデータURLをページ間で共有するContextプロバイダー */
export function ThumbnailProvider({ children }: { children: React.ReactNode }) {
  const [canvasDataUrl, setCanvasDataUrl] = useState<string | undefined>(undefined);
  return (
    <ThumbnailContext.Provider value={{ canvasDataUrl, setCanvasDataUrl }}>
      {children}
    </ThumbnailContext.Provider>
  );
}

/** ThumbnailContextを取得するカスタムフック */
export function useThumbnail() {
  return useContext(ThumbnailContext);
}
