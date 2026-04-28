import { createContext, useContext } from 'react';

interface AuthCtx {
  logout: () => void;
}

export const AuthContext = createContext<AuthCtx>({ logout: () => {} });
export const useAuth = () => useContext(AuthContext);
