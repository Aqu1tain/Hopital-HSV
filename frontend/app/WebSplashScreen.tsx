// components/WebSplashScreen.tsx
import React from 'react';
import { View, Image, StyleSheet, ImageBackground } from 'react-native';

export default function WebSplashScreen() {
  return (
    <ImageBackground 
      source={require('../assets/images/backgroundLoading.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 200,
    resizeMode: 'contain',
  },
});