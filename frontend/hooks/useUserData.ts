import { useEffect, useState } from 'react';
import { useAuth } from '../app/auth-context';
import { Alert } from 'react-native';

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'patient' | 'practitioner';
  created_at: string;
  updated_at?: string;
  profile?: any;
}

export function useUserData() {
  const { token, user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    
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
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      Alert.alert('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  // Recharger les données utilisateur si nécessaire
  const refetch = () => {
    return fetchUserData();
  };

  return {
    user,
    isLoading,
    error,
    refetch
  };
}