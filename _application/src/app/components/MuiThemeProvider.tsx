"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#202940",
    },
    secondary: {
      main: "#4B4038",
    },
  },
});

/** MUIカラーパレットをアプリ全体に適用するプロバイダー */
export default function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
