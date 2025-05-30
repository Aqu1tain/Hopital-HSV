import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { runAllTheInitStuff } from './init';
import WebSplashScreen from './WebSplashScreen';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      await runAllTheInitStuff();
      setAppIsReady(true);
      await SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  if (!appIsReady) {
    return <WebSplashScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}