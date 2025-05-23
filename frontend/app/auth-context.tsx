import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  id: string;
  email: string;
  role: 'patient' | 'practitioner';
  created_at: string;
  updated_at?: string;
  email_confirmed_at?: string;
  profile?: any; // Type plus précis possible selon la structure de vos données
}

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Au chargement, récupérer le token stocké
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        if (storedToken) {
          setTokenState(storedToken);
          // Ne pas charger les données utilisateur ici, attendre que le composant soit monté
        }
      } catch (error) {
        console.error('Erreur lors du chargement du token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  // Charger les données utilisateur quand le token change
  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setUser(null);
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:3000/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données utilisateur');
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      // En cas d'erreur, on déconnecte l'utilisateur pour éviter des états incohérents
      setTokenState(null);
      await AsyncStorage.removeItem('auth_token');
    }
  };

  const setToken = async (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      await AsyncStorage.setItem('auth_token', newToken);
    } else {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      // Appeler la route de déconnexion du serveur si nécessaire
      await fetch('http://localhost:3000/auth/logout', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        setToken, 
        isAuthenticated: !!token, 
        user,
        setUser,
        logout,
        isLoading
      }}
    >
      {!isLoading ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Add a default export to satisfy Expo Router warning
export default {};
