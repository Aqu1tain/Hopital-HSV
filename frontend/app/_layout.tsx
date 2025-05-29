import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter: Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            header: () => (
              <View style={headerStyles.header}>
                <TouchableOpacity
                  style={headerStyles.backButton}
                  onPress={() => router.push('./profil')}
                >
                  <Text style={headerStyles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={headerStyles.headerTitle}>Paramètres</Text>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="notifications_prac"
          options={{
            header: () => (
              <View style={headerStyles.header}>
                <TouchableOpacity
                  style={headerStyles.backButton}
                  onPress={() => router.push('./profil')}
                >
                  <Text style={headerStyles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={headerStyles.headerTitle}>Notifications</Text>
              </View>
            ),
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const headerStyles = StyleSheet.create({
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
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});