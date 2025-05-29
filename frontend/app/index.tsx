import React, { useEffect, useState } from 'react';
import { Text, View, Platform } from 'react-native';
import Entypo from '@expo/vector-icons/Entypo';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { runAllTheInitStuff } from './init';
import SomeProvider from './SomeProvider.ts';
import AnotherProvider from './AnotherProvider.ts';
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
