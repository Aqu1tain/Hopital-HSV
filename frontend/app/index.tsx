import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { runAllTheInitStuff } from './init';
import WebSplashScreen from './WebSplashScreen';

// Garder le splash natif visible
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const router = useRouter();

  // Toujours appeler les hooks en haut du composant !
  useEffect(() => {
    async function prepare() {
      await runAllTheInitStuff();
      setAppIsReady(true);
      await SplashScreen.hideAsync();
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      router.replace('/(tabs)');
    }
  }, [appIsReady]); 

  // Affichage pendant le chargement
  if (!appIsReady) {
    if (Platform.OS === 'web') {
      return <WebSplashScreen />;
    } else {
      return null;
    }
  }

  return null;
}
