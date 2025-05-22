import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, Link } from 'expo-router';
import { useAuth } from './auth-context';

const BACKEND_URL = 'http://192.168.235.59:3000'; // Change if needed

type Step = 'email' | 'code' | 'signup';
type MainStep = Step | 'practitioner';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [mainStep, setMainStep] = useState<MainStep>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const { setToken, isAuthenticated } = useAuth();
  const router = useRouter();

  // signup form state
  const [signupFields, setSignupFields] = useState({
    phone: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
  });
  const [signupErrors, setSignupErrors] = useState({
    phone: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      } else if (data.newUser) {
        setStep('signup');
        setSuccess('Veuillez compléter la création de votre compte patient.');
      } else {
        setError("Aucun token reçu.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function validateSignupFields(fields: typeof signupFields) {
    const errors: typeof signupErrors = { phone: '', first_name: '', last_name: '', birth_date: '', gender: '' };
    if (!fields.first_name.trim()) errors.first_name = 'Prénom requis';
    if (!fields.last_name.trim()) errors.last_name = 'Nom requis';
    if (!fields.phone.match(/^\+?\d{10,15}$/)) errors.phone = 'Numéro invalide (10-15 chiffres, ex: 0612345678)';
    if (!fields.birth_date) errors.birth_date = 'Date de naissance requise';
    if (!fields.gender) errors.gender = 'Genre requis';
    return errors;
  }

  const handleSignup = async () => {
    const errors = validateSignupFields(signupFields);
    setSignupErrors(errors);
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      // Focus first error field
      const firstErrorKey = Object.keys(errors).find(k => errors[k as keyof typeof errors]);
      if (firstErrorKey) {
        // Focus logic for RN TextInput: handled below via ref
      }
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Convert birth_date from DD/MM/YYYY to YYYY-MM-DD
      let birth_date = signupFields.birth_date;
      if (birth_date && birth_date.includes('/')) {
        const [day, month, year] = birth_date.split('/');
        birth_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      const res = await fetch(`${BACKEND_URL}/signup/patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          ...signupFields,
          birth_date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création du compte');
      if (data.token) {
        setToken(data.token);
        setSuccess('Compte créé et connecté !');
        router.replace('/');
      } else {
        setError("Aucun token reçu après inscription.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };




  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        {mainStep === 'email' && step === 'email' && (
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
            <TouchableOpacity
              style={styles.button}
              onPress={handleRequestCode}
              disabled={loading || !email}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Recevoir un code</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.practitionerLink}>
              <Link href="/practitioner-signup">
                <Text style={styles.practitionerLinkText}>S’inscrire comme Praticien</Text>
              </Link>
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
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyCode}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Vérifier</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: cooldown > 0 ? '#B0B0B0' : '#3451db' },
              ]}
              onPress={handleResendCode}
              disabled={cooldown > 0 || loading}
            >
              <Text style={styles.buttonText}>
                {cooldown > 0
                  ? `Renvoyer le code (${cooldown}s)`
                  : 'Renvoyer le code'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'signup' && (
          <>
            <Text style={styles.label}>Création de compte patient</Text>
            <TextInput
              style={[styles.input, signupErrors.first_name ? styles.inputError : null]}
              placeholder="Prénom"
              placeholderTextColor="#C0C0C0"
              value={signupFields.first_name}
              onChangeText={t => setSignupFields(f => ({ ...f, first_name: t }))}
              accessibilityLabel="Prénom"
              returnKeyType="next"
              autoCapitalize="words"
            />
            {signupErrors.first_name ? <Text style={styles.helperError}>{signupErrors.first_name}</Text> : <Text style={styles.helper}>Votre prénom</Text>}
            <TextInput
              style={[styles.input, signupErrors.last_name ? styles.inputError : null]}
              placeholder="Nom"
              placeholderTextColor="#C0C0C0"
              value={signupFields.last_name}
              onChangeText={t => setSignupFields(f => ({ ...f, last_name: t }))}
              accessibilityLabel="Nom"
              returnKeyType="next"
              autoCapitalize="words"
            />
            {signupErrors.last_name ? <Text style={styles.helperError}>{signupErrors.last_name}</Text> : <Text style={styles.helper}>Votre nom de famille</Text>}
            <TextInput
              style={[styles.input, signupErrors.phone ? styles.inputError : null]}
              placeholder="Téléphone (ex: 0612345678)"
              placeholderTextColor="#C0C0C0"
              value={signupFields.phone}
              onChangeText={t => setSignupFields(f => ({ ...f, phone: t }))}
              keyboardType="phone-pad"
              accessibilityLabel="Téléphone"
              returnKeyType="next"
            />
            {signupErrors.phone ? <Text style={styles.helperError}>{signupErrors.phone}</Text> : <Text style={styles.helper}>Format: 10-15 chiffres</Text>}
            <TouchableOpacity
              style={[styles.input, { justifyContent: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' }, signupErrors.birth_date ? styles.inputError : null]}
              onPress={() => setShowDatePicker(true)}
              accessibilityLabel="Date de naissance"
              activeOpacity={0.8}
            >
              <Text style={{ color: signupFields.birth_date ? '#222' : '#C0C0C0', fontSize: 14 }}>
                {signupFields.birth_date || 'Date de naissance'}
              </Text>
            </TouchableOpacity>
            {signupErrors.birth_date ? <Text style={styles.helperError}>{signupErrors.birth_date}</Text> : <Text style={styles.helper}>Format: JJ/MM/AAAA</Text>}
            {showDatePicker && (
              <>
                {/* DateTimePicker import must be at top: import DateTimePicker from '@react-native-community/datetimepicker' */}
                <DateTimePicker
                  value={signupFields.birth_date ? new Date(signupFields.birth_date.split('/').reverse().join('-')) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      const d = date;
                      const formatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                      setSignupFields(f => ({ ...f, birth_date: formatted }));
                    }
                  }}
                  maximumDate={new Date()}
                />
              </>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    flex: 1,
                    backgroundColor: signupFields.gender === 'M' ? '#3451db' : '#B0B0B0',
                    marginRight: 8,
                  },
                  signupErrors.gender ? styles.inputError : null,
                ]}
                onPress={() => setSignupFields(f => ({ ...f, gender: 'M' }))}
                accessibilityLabel="Genre homme"
                accessibilityState={{ selected: signupFields.gender === 'M' }}
              >
                <Text style={styles.buttonText}>Homme</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    flex: 1,
                    backgroundColor: signupFields.gender === 'F' ? '#3451db' : '#B0B0B0',
                  },
                  signupErrors.gender ? styles.inputError : null,
                ]}
                onPress={() => setSignupFields(f => ({ ...f, gender: 'F' }))}
                accessibilityLabel="Genre femme"
                accessibilityState={{ selected: signupFields.gender === 'F' }}
              >
                <Text style={styles.buttonText}>Femme</Text>
              </TouchableOpacity>
            </View>
            {signupErrors.gender ? <Text style={styles.helperError}>{signupErrors.gender}</Text> : null}
            <TouchableOpacity
              style={[styles.button, (loading || Object.values(signupErrors).some(Boolean)) && { opacity: 0.6 }]}
              onPress={handleSignup}
              disabled={loading}
              accessibilityLabel="Créer le compte"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Créer le compte</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
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
  practitionerLink: {
    marginTop: 8,
    alignSelf: 'center',
  },
  practitionerLinkText: {
    color: '#aaa',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  helper: {
    color: '#888',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  helperError: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 10,
    alignSelf: 'flex-start',
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
