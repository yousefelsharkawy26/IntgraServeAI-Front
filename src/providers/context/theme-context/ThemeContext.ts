import { createContext, ReactNode, useContext } from 'react';

export type Theme = 'dark' | 'light' | 'system';

export type ThemeContextProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeContextState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeContextState = {
  theme: 'system',
  setTheme: () => null,
};

export const ThemeContext = createContext<ThemeContextState>(initialState);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error(
      'useThemeContext hook must be used within a <ThemeContextProvider>...</ThemeContextProvider>',
    );

  return context;
};
