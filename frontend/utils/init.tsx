import * as Font from 'expo-font';
import { Asset } from 'expo-asset';

export async function runAllTheInitStuff() {
  try {
    // Start timing to ensure minimum 1-second delay
    const startTime = Date.now();

    // Load fonts (ensure these files exist in ./assets/fonts/)
    await Font.loadAsync({
      'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
      'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
      'SpaceMono-Regular': require('@/assets/fonts/SpaceMono-Regular.ttf'),
    });

    // Preload assets (ensure these files exist in ./assets/images/)
    const imageAssets = [
      require('@/assets/images/backgroundLoading.png'),
      require('@/assets/images/logo.png'),
      require('@/assets/images/icon.png'),
      require('@/assets/images/favicon.png'),
      require('@/assets/images/splash-icon.png'),
      require('@/assets/images/adaptive-icon.png'),
    ];
    
    await Promise.all(imageAssets.map(asset => Asset.fromModule(asset).downloadAsync()));

    // Simulate fetching initial configuration or data (replace with real API call if needed)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Ensure minimum 1-second delay
    const elapsedTime = Date.now() - startTime;
    const remainingTime = 1000 - elapsedTime;
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
  } catch (error) {
    console.error('Initialization error:', error);
    throw error; // Rethrow to allow caller to handle
  }
}