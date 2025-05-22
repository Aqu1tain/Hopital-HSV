// app/_splash.tsx
import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/"); // Redirige vers la page index
    }, 2000); // 2 secondes, à adapter

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bienvenue sur Hopital HSV</Text>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
