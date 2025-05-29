import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from './auth-context';
import 'react-native-reanimated';

// Inner layout component to use useAuth hook after AuthProvider
function LayoutContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (segments[0] !== 'auth') router.replace('/auth');
      return;
    }

    if (user?.role === 'practitioner' && segments[0] !== '(practitioner-tabs)') {
      router.replace('/(practitioner-tabs)/planning');
    } else if (user?.role === 'patient' && segments[0] !== '(tabs)') {
      router.replace('/(tabs)');
    }
  }, [user, isAuthenticated, isLoading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(practitioner-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen 
        name="practitioner-signup" 
        options={{ 
          headerTitle: 'S’inscrire comme Praticien',
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: '#FFFFFF',
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{
          header: () => (
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Paramètres</Text>
            </View>
          ),
        }}
      />
      <Stack.Screen name="practitioner-detail" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter: Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LayoutContent />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#000000',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 10,
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
  },
});