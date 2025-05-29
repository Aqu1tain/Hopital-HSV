import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAuth } from '../auth-context';
import config from '../../config/config';
import AppHeader from '@/components/AppHeader';

// Icônes d’avatar, planning, patients, profil : à remplacer par les tiens ou ceux d’un lib.
const PatientAvatar = () => (
  <View style={styles.avatarCircle}>
    <Image source={require('@/assets/images/placeholder-doctor.jpg')} style={styles.avatarImg} />
  </View>
);

interface IconProps {
  active: boolean;
}

const IconPlanning = ({ active }: IconProps) => (
  <Text style={{ color: active ? "#2E4FD1" : "#888", fontSize: 24 }}>📒</Text>
);

const IconPatients = ({ active }: IconProps) => (
  <Text style={{ color: active ? "#2E4FD1" : "#888", fontSize: 24 }}>🩺</Text>
);

const IconProfile = ({ active }: IconProps) => (
  <Text style={{ color: active ? "#2E4FD1" : "#888", fontSize: 24 }}>👤</Text>
);

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7h à 22h
const SCREEN_WIDTH = Dimensions.get('window').width;

interface Appointment {
  id: string;
  scheduled_at: string;
  patient: {
    user_id: string;
    users: {
      first_name: string;
      last_name: string;
      profile_url?: string;
    };
  };
}

export default function PlanningScreen() {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Pour l'exemple, prends "aujourd'hui". À adapter pour navigation entre jours.
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${config.API_URL}/api/appointments/doctor?date=${todayStr}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        setAppointments(data || []);
      } catch {
        setAppointments([]);
      }
      setLoading(false);
    })();
  }, [token]);

  // Transforme les rendez-vous en slots indexés par heure (ex: {10: appt, 11: appt})
  const appointmentsByHour = appointments.reduce((acc, appt) => {
    const d = new Date(appt.scheduled_at);
    const h = d.getHours();
    acc[h] = appt;
    return acc;
  }, {} as { [hour: number]: Appointment });

  // Ligne rouge "heure actuelle"
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <AppHeader />
      {/* Titre jour */}
      <Text style={{ fontSize: 19, fontWeight: '500', marginLeft: 22, marginBottom: 7 }}>
        {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>
      {/* Grille planning */}
      <View style={styles.gridContainer}>
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          <View style={styles.grid}>
            {HOURS.map((hour, i) => {
              const appt = appointmentsByHour[hour];
              // Pour la ligne de l'heure actuelle
              const isCurrentHour = todayStr === now.toISOString().slice(0, 10) && hour === currentHour;
              return (
                <View key={hour} style={styles.row}>
                  {/* Heure (gauche) */}
                  <Text style={[styles.hour, { color: appt ? '#fff' : '#aaa' }]}>
                    {hour}h
                  </Text>
                  {/* Slot rendez-vous */}
                  <View style={[
                    styles.slot,
                    appt && styles.slotBooked,
                    appt && { borderBottomWidth: 0 },
                  ]}>
                    {appt ? (
                      <View style={styles.slotContent}>
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={styles.patientName}>
                            {appt.patient.users.first_name} {appt.patient.users.last_name}
                          </Text>
                        </View>
                        <PatientAvatar />
                      </View>
                    ) : null}
                  </View>
                  {/* Ligne rouge heure courante */}
                  {isCurrentHour && (
                    <View style={{
                      ...styles.nowLine,
                      left: 40,
                      width: SCREEN_WIDTH - 60,
                      top: (currentMinute / 60) * 48 - 1,
                    }}>
                      <View style={styles.nowDot} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  grid: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFF6',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: 1,
    borderColor: '#EFEFF6',
    backgroundColor: '#fff',
    position: 'relative',
  },
  hour: {
    width: 36,
    fontSize: 16,
    fontWeight: '400',
    color: '#bbb',
    textAlign: 'right',
    marginRight: 4,
  },
  slot: {
    flex: 1,
    minHeight: 48,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderColor: '#EFEFF6',
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 18,
  },
  slotBooked: {
    backgroundColor: '#436DE2',
    borderRadius: 7,
    marginVertical: 3,
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  patientName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 6,
  },
  avatarCircle: {
    backgroundColor: '#fff9',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    borderWidth: 1,
    borderColor: '#e1e6f9',
  },
  avatarImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f2f4',
  },
  nowLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#E35050',
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E35050',
    position: 'absolute',
    right: -6,
    top: -4,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ECECEC',
    backgroundColor: '#fff',
    height: 68,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
    color: '#222',
  },
});

