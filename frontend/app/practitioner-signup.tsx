import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';

const BACKEND_URL = 'http://192.168.235.59:3000';

export default function PractitionerSignup() {
  const [fields, setFields] = useState({
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    title: '',
    street_address: '',
    postal_code: '',
    city: '',
    floor: '',
    building_code: '',
    public_transport_access: '',
    payment_card: false,
    payment_bank_transfer: false,
    payment_cheque: false,
    payment_cash: false,
    payment_mutuelle: false,
    conventioned: false,
    standard_price_cents: '',
    secu_coverage_percent: '',
  });
  const [proof, setProof] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pickProof = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setProof(res.assets[0]);
    }
  };


  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!fields.email || !fields.first_name || !fields.last_name || !proof) {
      setError('Les champs marqués * sont obligatoires');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) =>
        formData.append(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : v as string)
      );
      formData.append('proof', {
        uri: proof.uri,
        name: proof.name,
        type: proof.mimeType || 'application/octet-stream',
      } as any);

      const res = await fetch(`${BACKEND_URL}/signup/practitioner`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’inscription');
      setSuccess(data.message || 'Inscription réussie !');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="exemple@domaine.com"
          placeholderTextColor="#AAA"
          autoCapitalize="none"
          keyboardType="email-address"
          value={fields.email}
          onChangeText={t => setFields(f => ({ ...f, email: t }))}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={styles.input}
            placeholder="Prénom"
            placeholderTextColor="#AAA"
            value={fields.first_name}
            onChangeText={t => setFields(f => ({ ...f, first_name: t }))}
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor="#AAA"
            value={fields.last_name}
            onChangeText={t => setFields(f => ({ ...f, last_name: t }))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="0612345678"
            placeholderTextColor="#AAA"
            keyboardType="phone-pad"
            value={fields.phone}
            onChangeText={t => setFields(f => ({ ...f, phone: t }))}
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Titre</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={fields.title}
              onValueChange={t => setFields(f => ({ ...f, title: t }))}
              style={styles.picker}
              dropdownIconColor="#3451db"
            >
              <Picker.Item label="Sélectionnez une profession" value="" />
              <Picker.Item label="Médecin généraliste" value="Médecin généraliste" />
              <Picker.Item label="Orthophoniste" value="Orthophoniste" />
              <Picker.Item label="Infirmier/Infirmière" value="Infirmier/Infirmière" />
              <Picker.Item label="Kinésithérapeute" value="Kinésithérapeute" />
              <Picker.Item label="Sage-femme" value="Sage-femme" />
              <Picker.Item label="Podologue" value="Podologue" />
              <Picker.Item label="Psychologue" value="Psychologue" />
              <Picker.Item label="Dentiste" value="Dentiste" />
              <Picker.Item label="Ophtalmologue" value="Ophtalmologue" />
              <Picker.Item label="Cardiologue" value="Cardiologue" />
              <Picker.Item label="Autre" value="Autre" />
            </Picker>
          </View>
        </View>
      </View>

      <Text style={[styles.subheading, { marginTop: 24 }]}>Adresse du cabinet</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Rue</Text>
        <TextInput
          style={styles.input}
          placeholder="123 rue Principale"
          placeholderTextColor="#AAA"
          value={fields.street_address}
          onChangeText={t => setFields(f => ({ ...f, street_address: t }))}
        />
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Code postal</Text>
          <TextInput
            style={styles.input}
            placeholder="75000"
            placeholderTextColor="#AAA"
            keyboardType="number-pad"
            value={fields.postal_code}
            onChangeText={t => setFields(f => ({ ...f, postal_code: t }))}
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            placeholder="Paris"
            placeholderTextColor="#AAA"
            value={fields.city}
            onChangeText={t => setFields(f => ({ ...f, city: t }))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Étage</Text>
          <TextInput
            style={styles.input}
            placeholder="RDC / 2e"
            placeholderTextColor="#AAA"
            value={fields.floor}
            onChangeText={t => setFields(f => ({ ...f, floor: t }))}
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Bâtiment</Text>
          <TextInput
            style={styles.input}
            placeholder="Bât. A"
            placeholderTextColor="#AAA"
            value={fields.building_code}
            onChangeText={t => setFields(f => ({ ...f, building_code: t }))}
          />
        </View>
      </View>

      <Text style={[styles.subheading, { marginTop: 24 }]}>Paiements & conventions</Text>
      <View style={styles.switchRow}>
        {([
          ['Carte', 'payment_card'],
          ['Virement', 'payment_bank_transfer'],
          ['Chèque', 'payment_cheque'],
          ['Espèces', 'payment_cash'],
          ['Mutuelle', 'payment_mutuelle'],
        ] as [string, keyof typeof fields][]).map(([label, key]) => (
          <View key={key} style={styles.switchGroup}>
            <Switch
              value={fields[key] as boolean}
              onValueChange={v => setFields(f => ({ ...f, [key]: v }))}
            />
            <Text style={styles.switchLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.formGroup}>
        <View style={styles.switchGroup}>
          <Switch
            value={fields.conventioned}
            onValueChange={v => setFields(f => ({ ...f, conventioned: v }))}
          />
          <Text style={styles.switchLabel}>Conventionné Sécu</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Prix standard (€)</Text>
          <TextInput
            style={styles.input}
            placeholder="60"
            placeholderTextColor="#AAA"
            keyboardType="number-pad"
            value={fields.standard_price_cents}
            onChangeText={t => setFields(f => ({ ...f, standard_price_cents: t }))}
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Remb. Sécu (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="70"
            placeholderTextColor="#AAA"
            keyboardType="number-pad"
            value={fields.secu_coverage_percent}
            onChangeText={t => setFields(f => ({ ...f, secu_coverage_percent: t }))}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Preuve *</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickProof}>
          <Text style={styles.uploadText}>
            {proof ? proof.name : 'Téléverser document de preuve'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.cta, !fields.email || !fields.first_name || !fields.last_name || !proof ? styles.disabled : null]}
        onPress={handleSubmit}
        disabled={loading || !fields.email || !fields.first_name || !fields.last_name || !proof}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaText}>S’inscrire</Text>
        )}
      </TouchableOpacity>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'stretch',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  half: {
    flex: 1,
    marginRight: 8,
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '48%',
  },
  switchLabel: {
    marginLeft: 6,
    fontSize: 14,
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
  },
  uploadText: {
    color: '#666',
  },
  cta: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#3451db',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    backgroundColor: '#A0A0A0',
  },
  backLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
  backText: {
    color: '#3451db',
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCC',
    marginTop: 4,
    marginBottom: 4,
    justifyContent: 'center',
    height: 48,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    color: '#222',
    fontSize: 16,
    width: '100%',
  },
  error: {
    color: '#C00',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  success: {
    color: '#28A745',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
});