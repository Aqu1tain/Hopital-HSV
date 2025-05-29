// components/WebSplashScreen.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function WebSplashScreen() {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo.png')} style={styles.image} />
      <Text style={styles.text}>Chargement de l'application...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
  },
});
