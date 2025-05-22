import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './auth-context';

const BACKEND_URL = 'http://localhost:3000'; // Change if needed

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const { setToken, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleRequestCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur envoi code');
      setStep('code');
      setSuccess('Code envoyé par email.');
      setCooldown(20);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur envoi code');
      setSuccess('Code renvoyé par email.');
      setCooldown(20);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Code invalide');
      if (data.token) {
        setToken(data.token);
        setSuccess('Connexion réussie !');
        router.replace('/');
      } else {
        setError("Aucun token reçu.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
      {step === 'email' && (
        <>
          <Text style={styles.label}>Adresse E-Mail</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. gaston.lagaffe@mail.com"
            placeholderTextColor="#C0C0C0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.button} onPress={handleRequestCode} disabled={loading || !email}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Recevoir un code</Text>}
          </TouchableOpacity>
        </>
      )}
      {step === 'code' && (
        <>
          <Text style={styles.label}>Code reçu par email</Text>
          <TextInput
            style={styles.input}
            placeholder="Code à 6 chiffres"
            placeholderTextColor="#C0C0C0"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyCode} disabled={loading || code.length !== 6}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Vérifier</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: cooldown > 0 ? '#B0B0B0' : '#3451db' }]}
            onPress={handleResendCode}
            disabled={cooldown > 0 || loading}
          >
            <Text style={styles.buttonText}>
              {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : 'Renvoyer le code'}
            </Text>
          </TouchableOpacity>
        </>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
  },
  logoImage: {
    width: 185,
    height: 181,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    color: '#222',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#3451db',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    lineHeight:28,
    fontWeight: '400',
  },
  error: {
    color: '#e74c3c',
    marginTop: 8,
    fontSize: 14,
  },
  success: {
    color: '#27ae60',
    marginTop: 8,
    fontSize: 14,
  },
});
