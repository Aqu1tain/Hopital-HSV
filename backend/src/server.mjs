import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

dotenv.config();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Express setup
const app = express();

// CORS for dev: allow Expo/React Native and local frontend
app.use(cors());
app.use(express.json());

// Multer for file uploads (in-memory)
const upload = multer({ storage: multer.memoryStorage() });

// Nodemailer configuration
// Define in .env: SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/false), SMTP_USER, SMTP_PASS, EMAIL_FROM
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter at startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Erreur configuration SMTP:', error);
  } else {
    console.log('SMTP configuré et prêt à envoyer des emails');
  }
});

// Utilitaire : générer un code OTP à 6 chiffres
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Envoyer OTP et stocker le hash dans Supabase
async function sendOtp(email) {
  const code = generateCode();
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert code dans la table login_codes
  const { error: upsertErr } = await supabase
    .from('login_codes')
    .upsert({ email, code_hash: hash, expires_at: expiresAt })
    .eq('email', email);
  if (upsertErr) {
    console.error('Erreur upsert login_codes:', upsertErr);
    throw upsertErr;
  }

  // Envoyer l'email
  try {
    console.log('About to send mail to', email);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Votre code de connexion',
      text: `Votre code de connexion est : ${code}. Il expire dans 10 minutes.`,
    });
    console.log(`OTP envoyé à ${email}`);
  } catch (mailErr) {
    console.error('Erreur envoi email OTP:', mailErr);
    throw mailErr;
  }
}

// Route: demander un code OTP
app.post('/auth/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });
  try {
    await sendOtp(email);
    res.json({ message: 'Code envoyé par email' });
  } catch (err) {
    console.error('Erreur sendOtp:', err);
    res.status(500).json({ error: 'Échec envoi code' });
  }
});

// Route: logout
app.post('/auth/logout', (req, res) => {
  // For JWT, logout is handled client-side by deleting the token.
  // Optionally, we could blacklist the token here if we implement server-side invalidation.
  res.json({ success: true });
});

// Route: vérifier OTP et émettre JWT ou lancer signup
app.post('/auth/verify', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) 
    return res.status(400).json({ error: 'Email et code requis' });

  // 1) Vérifier OTP
  const { data, error } = await supabase
    .from('login_codes')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) 
    return res.status(400).json({ error: 'Code invalide' });
  if (new Date(data.expires_at) < new Date()) 
    return res.status(400).json({ error: 'Code expiré' });

  const hash = crypto.createHash('sha256').update(code).digest('hex');
  if (hash !== data.code_hash) 
    return res.status(400).json({ error: 'Code invalide' });

  // Supprimer le code OTP utilisé
  await supabase.from('login_codes').delete().eq('email', email);

  // 2) Tenter de récupérer l'utilisateur
  const { data: user, error: usrErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  // Si pas d'utilisateur → frontend doit lancer le flow "signup patient"
  if (usrErr || !user) {
    return res.json({ newUser: true, email });
  }

  // 3) Si existant, on émet le JWT
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({ token });
});

// Route: inscription patient (création de compte + JWT renvoyé)
app.post('/signup/patient', async (req, res) => {
  const { email, phone, first_name, last_name, birth_date, gender } = req.body;
  if (!email || !first_name || !last_name || !birth_date || !gender) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  // 1) Créer le user
  const { data: user, error: uErr } = await supabase
    .from('users')
    .insert([{ email, phone, first_name, last_name, role: 'patient' }])
    .select()
    .single();
  if (uErr) return res.status(400).json({ error: uErr.message });

  // 2) Créer le profil patient
  const { error: pErr } = await supabase
    .from('patients')
    .insert([{ user_id: user.id, birth_date, gender }]);
  if (pErr) return res.status(400).json({ error: pErr.message });

  // 3) Émettre le JWT immédiatement
  const token = jwt.sign(
    { sub: user.id, role: 'patient' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({ token, user: { id: user.id, role: 'patient' } });
});

app.post(
  '/signup/practitioner',
  upload.single('proof'),
  async (req, res) => {
    const {
      email, phone, first_name, last_name, title,
      street_address, postal_code, city, floor, building_code,
      public_transport_access,
      payment_card, payment_bank_transfer,
      payment_cheque, payment_cash,
      accepts_mutuelle, conventioned,
      standard_price_cents, secu_coverage_percent,
    } = req.body;

    if (!email || !first_name || !last_name || !req.file) {
      return res
        .status(400)
        .json({ error: 'email, prénom, nom et preuve sont obligatoires' });
    }

    try {
      // 1) Create user record
      const { data: user, error: uErr } = await supabase
        .from('users')
        .insert([
          { email, phone, first_name, last_name, role: 'practitioner' }
        ])
        .select('id')
        .single();
      if (uErr) throw uErr;

      // 2) Upload proof file to Storage
      const path = `practitioners/${user.id}/${req.file.originalname}`;
      const { error: upErr } = await supabase.storage
        .from('proofs')
        .upload(path, req.file.buffer, {
          contentType: req.file.mimetype,
        });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage
        .from('proofs')
        .getPublicUrl(path);

      // 3) Insert practitioner profile, unverified
      const { error: pErr } = await supabase
        .from('practitioners')
        .insert([
          {
            user_id: user.id,
            title,
            street_address,
            postal_code,
            city,
            floor,
            building_code,
            public_transport_access,
            payment_card: payment_card === 'true',
            payment_bank_transfer: payment_bank_transfer === 'true',
            payment_cheque: payment_cheque === 'true',
            payment_cash: payment_cash === 'true',
            accepts_mutuelle: accepts_mutuelle === 'true',
            conventioned: conventioned === 'true',
            standard_price_cents: Number(standard_price_cents),
            secu_coverage_percent: Number(secu_coverage_percent),
            verification_documents: [urlData.publicUrl],
            is_verified: false,
          },
        ]);
      if (pErr) throw pErr;

      return res.json({
        message:
          "Inscription praticien reçue ! Votre dossier est en attente de validation.",
      });
    } catch (err) {
      console.error('Signup practitioner error:', err);
      return res.status(500).json({
        error: err.message || 'Erreur interne lors de l\'inscription',
      });
    }
  }
);

// Middleware d'authentification
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).end();
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).end();
  }
}

// Route: redirection selon rôle
app.get('/redirect-home', authMiddleware, (req, res) => {
  if (req.user.role === 'practitioner') {
    return res.redirect('/practitioner/dashboard');
  }
  return res.redirect('/patient/dashboard');
});


// Route de test d'envoi d'email
app.get('/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_FROM,
      subject: 'Test d\'envoi d\'email depuis Nodemailer',
      text: 'Si vous recevez ce mail, votre configuration SMTP fonctionne !'
    });
    res.json({ message: 'Email de test envoyé avec succès' });
  } catch (err) {
    console.error('Erreur envoi email test :', err);
    res.status(500).json({ error: 'Échec envoi email test', details: err.message });
  }
});

// Route: Récupérer les infos de l'utilisateur connecté
app.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;

    // 1. Récupérer les infos de base de l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    let userData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    // 2. Récupérer les infos spécifiques au rôle
    if (user.role === 'practitioner') {
      const { data: practitioner, error: practitionerError } = await supabase
        .from('practitioners')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!practitionerError && practitioner) {
        userData.profile = practitioner;
      }
    } else if (user.role === 'patient') {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!patientError && patient) {
        userData.profile = patient;
      }
    }

    return res.json(userData);

  } catch (error) {
    console.error('Erreur lors de la récupération des infos utilisateur:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get upcoming appointments for the current user
app.get('/api/appointments/upcoming', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const today = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        notes,
        patient:patients!appointments_patient_id_fkey(
          user_id, 
          users(first_name, last_name, phone, profile_url)
        ),
        practitioner:practitioners!appointments_practitioner_id_fkey(
          user_id,
          users(first_name, last_name, phone, profile_url),
          title,
          street_address,
          city,
          specialty
        )
      `)
      .or(`patient_id.eq.${userId},practitioner_id.eq.${userId}`)
      .gte('scheduled_at', today)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming appointments' });
  }
});

// Get past appointments for the current user
app.get('/api/appointments/past', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const today = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        notes,
        patient:patients!appointments_patient_id_fkey(
          user_id, 
          users(first_name, last_name, phone, profile_url)
        ),
        practitioner:practitioners!appointments_practitioner_id_fkey(
          user_id,
          users(first_name, last_name, phone, profile_url),
          title,
          street_address,
          city,
          specialty
        )
      `)
      .or(`patient_id.eq.${userId},practitioner_id.eq.${userId}`)
      .lt('scheduled_at', today)
      .order('scheduled_at', { ascending: false })
      .limit(20); // Increased limit to get more recent patients

    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching past appointments:', error);
    res.status(500).json({ error: 'Failed to fetch past appointments' });
  }
});

// Recherche de praticiens avec filtrage par localisation
app.get('/api/practitioners', authMiddleware, async (req, res) => {
  try {
    const { city, postal_code } = req.query;

    let query = supabase
      .from('practitioners')
      .select(`
        user_id,
        title,
        specialty,
        street_address,
        postal_code,
        city,
        floor,
        building_code,
        public_transport_access,
        payment_card,
        payment_bank_transfer,
        payment_cheque,
        payment_cash,
        accepts_mutuelle,
        conventioned,
        standard_price_cents,
        secu_coverage_percent,
        is_verified,
        users!inner(
          first_name,
          last_name,
          email,
          phone,
          profile_url,
          created_at
        )
      `);

    // Appliquer le filtre de localisation si fourni
    if (city || postal_code) {
      let orFilters = [];
      if (city) {
        orFilters.push(`city.ilike.%${city}%`);
      }
      if (postal_code) {
        orFilters.push(`postal_code.ilike.%${postal_code}%`);
      }
      if (orFilters.length > 0) {
        query = query.or(orFilters.join(","));
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const formattedData = data.map(practitioner => ({
      id: practitioner.user_id,
      name: `${practitioner.users.first_name} ${practitioner.users.last_name}`,
      title: practitioner.title,
      specialty: practitioner.specialty,
      address: [
        practitioner.street_address,
        practitioner.postal_code,
        practitioner.city
      ].filter(Boolean).join(', '),
      image: practitioner.users.profile_url || 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png',
      // Champs additionnels pour /api/practitioners
      floor: practitioner.floor,
      buildingCode: practitioner.building_code,
      transportAccess: practitioner.public_transport_access,
      accepts_mutuelle: practitioner.accepts_mutuelle || false,
      conventioned: practitioner.conventioned || false,
      isVerified: practitioner.is_verified || false,
      price: practitioner.standard_price_cents ? {
        amount: practitioner.standard_price_cents / 100,
        currency: 'EUR',
        secuCoverage: practitioner.secu_coverage_percent || 0
      } : null,
      payment_methods: {
        card: practitioner.payment_card || false,
        bank_transfer: practitioner.payment_bank_transfer || false,
        check: practitioner.payment_cheque || false,
        cash: practitioner.payment_cash || false
      },
      email: practitioner.users.email,
      phone: practitioner.users.phone,
      createdAt: practitioner.users.created_at
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Erreur lors de la récupération des praticiens:', error);
    res.status(500).json({ error: 'Échec de la récupération des praticiens' });
  }
});

// Get available practitioners for today
app.get('/api/practitioners/available', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    
    // Get practitioners who are available today
    const { data: availablePractitioners, error: availabilityError } = await supabase
      .from('practitioner_availabilities')
      .select(`
        practitioner_id,
        start_time,
        end_time,
        practitioners!inner(
          user_id,
          title,
          specialty,
          street_address,
          postal_code,
          city,
          floor,
          building_code,
          public_transport_access,
          payment_card,
          payment_bank_transfer,
          payment_cheque,
          payment_cash,
          accepts_mutuelle,
          conventioned,
          standard_price_cents,
          secu_coverage_percent,
          is_verified,
          users!inner(
            first_name,
            last_name,
            email,
            phone,
            profile_url,
            created_at
          )
        )
      `)
      .eq('weekday', dayOfWeek)
      .order('start_time', { ascending: true });

    if (availabilityError) throw availabilityError;
    
    // Filter out duplicates and format the response with the same structure
    const uniquePractitioners = [];
    const seenIds = new Set();
    
    availablePractitioners.forEach(p => {
      if (!seenIds.has(p.practitioner_id)) {
        seenIds.add(p.practitioner_id);
        const practitioner = p.practitioners;
        
        uniquePractitioners.push({
          id: practitioner.user_id,
          name: `${practitioner.users.first_name} ${practitioner.users.last_name}`,
          title: practitioner.title || 'Dr.',
          specialty: practitioner.specialty || 'Médecin Généraliste',
          address: [
            practitioner.street_address,
            practitioner.postal_code,
            practitioner.city
          ].filter(Boolean).join(', '),
          image: practitioner.users.profile_url || 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png',
          // Champs additionnels harmonisés
          floor: practitioner.floor,
          buildingCode: practitioner.building_code,
          transportAccess: practitioner.public_transport_access,
          accepts_mutuelle: practitioner.accepts_mutuelle || false,
          conventioned: practitioner.conventioned || false,
          isVerified: practitioner.is_verified || false,
          price: practitioner.standard_price_cents ? {
            amount: practitioner.standard_price_cents / 100,
            currency: 'EUR',
            secuCoverage: practitioner.secu_coverage_percent || 0
          } : null,
          payment_methods: {
            card: practitioner.payment_card || false,
            bank_transfer: practitioner.payment_bank_transfer || false,
            check: practitioner.payment_cheque || false,
            cash: practitioner.payment_cash || false
          },
          email: practitioner.users.email,
          phone: practitioner.users.phone,
          createdAt: practitioner.users.created_at
        });
      }
    });
    
    res.json(uniquePractitioners);
  } catch (error) {
    console.error('Error fetching available practitioners:', error);
    res.status(500).json({ error: 'Failed to fetch available practitioners' });
  }
});

// Get practitioner availability for a specific date
app.get('/api/practitioners/:id/availability', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();
    
    // Get practitioner's availability for the specified day
    const { data: availabilities, error: availError } = await supabase
      .from('practitioner_availabilities')
      .select('*')
      .eq('practitioner_id', id)
      .eq('weekday', dayOfWeek);
    
    if (availError) throw availError;
    
    if (!availabilities || availabilities.length === 0) {
      return res.json({ available: false, timeSlots: [] });
    }
    
    // Get existing appointments for this practitioner on this date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('scheduled_at')
      .eq('practitioner_id', id)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .neq('status', 'cancelled');
    
    if (apptError) throw apptError;
    
    // Generate time slots
    const timeSlots = [];
    const slotDuration = 30; // 30 minutes per slot
    
    availabilities.forEach(availability => {
      const [startHour, startMinute] = availability.start_time.split(':').map(Number);
      const [endHour, endMinute] = availability.end_time.split(':').map(Number);
      
      let currentTime = new Date(requestedDate);
      currentTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(requestedDate);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      while (currentTime < endTime) {
        const slotTime = new Date(currentTime);
        
        // Check if this slot is already booked
        const isBooked = appointments.some(appt => {
          const apptTime = new Date(appt.scheduled_at);
          return apptTime.getTime() === slotTime.getTime();
        });
        
        // Only add future slots
        if (slotTime > new Date()) {
          timeSlots.push({
            time: slotTime.toTimeString().slice(0, 5),
            datetime: slotTime.toISOString(),
            available: !isBooked
          });
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      }
    });
    
    res.json({
      available: true,
      timeSlots: timeSlots.sort((a, b) => a.datetime.localeCompare(b.datetime))
    });
    
  } catch (error) {
    console.error('Error fetching practitioner availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Create new appointment
app.post('/api/appointments', authMiddleware, async (req, res) => {
  try {
    const { practitioner_id, scheduled_at, notes } = req.body;
    const patient_id = req.user.sub;
    
    if (!practitioner_id || !scheduled_at) {
      return res.status(400).json({ error: 'Practitioner ID and scheduled time are required' });
    }
    
    // Verify that the user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can book appointments' });
    }
    
    // Check if the slot is still available
    const appointmentDate = new Date(scheduled_at);
    const startOfSlot = new Date(appointmentDate);
    const endOfSlot = new Date(appointmentDate);
    endOfSlot.setMinutes(endOfSlot.getMinutes() + 30);
    
    const { data: existingAppointments, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('practitioner_id', practitioner_id)
      .gte('scheduled_at', startOfSlot.toISOString())
      .lt('scheduled_at', endOfSlot.toISOString())
      .neq('status', 'cancelled');
    
    if (checkError) throw checkError;
    
    if (existingAppointments && existingAppointments.length > 0) {
      return res.status(409).json({ error: 'Ce créneau n\'est plus disponible' });
    }
    
    // Create the appointment
    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert([{
        patient_id,
        practitioner_id,
        scheduled_at,
        status: 'scheduled',
        notes: notes || null
      }])
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Send confirmation email to patient
    const { data: patient, error: patientError } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', patient_id)
      .single();
    
    const { data: practitioner, error: practitionerError } = await supabase
      .from('practitioners')
      .select(`
        users!inner(first_name, last_name),
        title,
        street_address,
        postal_code,
        city
      `)
      .eq('user_id', practitioner_id)
      .single();
    
    if (!patientError && !practitionerError && patient && practitioner) {
      const appointmentDateTime = new Date(scheduled_at);
      const dateStr = appointmentDateTime.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeStr = appointmentDateTime.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: patient.email,
          subject: 'Confirmation de votre rendez-vous',
          html: `
            <h2>Confirmation de rendez-vous</h2>
            <p>Bonjour ${patient.first_name} ${patient.last_name},</p>
            <p>Votre rendez-vous a été confirmé avec :</p>
            <p><strong>${practitioner.title || ''} ${practitioner.users.first_name} ${practitioner.users.last_name}</strong></p>
            <p><strong>Date :</strong> ${dateStr}</p>
            <p><strong>Heure :</strong> ${timeStr}</p>
            <p><strong>Adresse :</strong><br>
            ${practitioner.street_address}<br>
            ${practitioner.postal_code} ${practitioner.city}</p>
            ${notes ? `<p><strong>Notes :</strong> ${notes}</p>` : ''}
            <p>En cas d'empêchement, merci de nous prévenir au plus tôt.</p>
            <p>Cordialement,<br>L'équipe médicale</p>
          `
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Continue even if email fails
      }
    }
    
    res.json({
      success: true,
      appointment: {
        id: appointment.id,
        scheduled_at: appointment.scheduled_at,
        status: appointment.status
      }
    });
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Cancel appointment
app.patch('/api/appointments/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    
    // First check if the user owns this appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('patient_id, practitioner_id, scheduled_at')
      .eq('id', id)
      .single();
    
    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check if user is authorized to cancel (either patient or practitioner)
    if (appointment.patient_id !== userId && appointment.practitioner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }
    
    // Check if appointment is in the future
    if (new Date(appointment.scheduled_at) < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past appointments' });
    }
    
    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    if (updateError) throw updateError;
    
    res.json({ success: true, message: 'Appointment cancelled successfully' });
    
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Get appointments for a specific practitioner and date range
app.get('/api/practitioners/:id/appointments', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        notes,
        patient:patients!appointments_patient_id_fkey(
          user_id,
          users(first_name, last_name)
        )
      `)
      .eq('practitioner_id', id)
      .gte('scheduled_at', start_date)
      .lte('scheduled_at', end_date)
      .order('scheduled_at', { ascending: true });
    
    if (error) throw error;
    
    res.json(appointments);
    
  } catch (error) {
    console.error('Error fetching practitioner appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointments for the authenticated doctor on a specific date
app.get('/api/appointments/doctor', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Verify user is a practitioner
    if (req.user.role !== 'practitioner') {
      return res.status(403).json({ error: 'Only practitioners can access this endpoint' });
    }

    // Find practitioner ID for the user
    const { data: practitioner, error: practitionerError } = await supabase
      .from('practitioners')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (practitionerError || !practitioner) {
      return res.status(404).json({ error: `Practitioner not found: ${practitionerError && practitionerError.message}` });
    }

    // Set date range for the specified day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch appointments for the practitioner on the specified date
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        notes,
        patient:patients!appointments_patient_id_fkey(
          user_id,
          users(first_name, last_name, profile_url)
        )
      `)
      .eq('practitioner_id', practitioner.user_id)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    // Format response to match frontend expectations
    const formattedAppointments = appointments.map(appt => ({
      id: appt.id,
      scheduled_at: appt.scheduled_at,
      patient: {
        user_id: appt.patient.user_id,
        users: {
          first_name: appt.patient.users.first_name,
          last_name: appt.patient.users.last_name,
          profile_url: appt.patient.users.profile_url,
        },
      },
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: `Failed to fetch appointments: ${error && error.message}` });
  }
});

// Update user data (phone and email)
app.patch('/api/users/update', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { phone, email } = req.body;
    
    // Validate input
    if (!email && !phone) {
      return res.status(400).json({ error: 'At least one field must be provided' });
    }
    
    // Prepare update object
    const updateData = {
      updated_at: new Date().toISOString()
    };
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    
    // Check if email is already taken by another user
    if (email) {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();
      
      if (existingUser) {
        return res.status(409).json({ error: 'Cette adresse email est déjà utilisée' });
      }
    }
    
    // Update user data
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
    
    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone
      }
    });
    
  } catch (error) {
    console.error('Error in /api/users/update:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update patient profile data
app.patch('/api/patients/update', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can update patient data' });
    }
    
    const {
      birth_date,
      weight_kg,
      allergies,
      medical_history,
      gender,
      social_security_number,
      health_insurance,
      coverage_mutuelle,
      street_address,
      postal_code,
      city,
      country
    } = req.body;
    
    // Prepare update object - only include fields that were provided
    const updateData = {};
    
    // Handle birth_date
    if (birth_date !== undefined) {
      // Validate ISO format (YYYY-MM-DD)
      if (birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
        return res.status(400).json({ error: 'Invalid birth_date format. Use YYYY-MM-DD' });
      }
      updateData.birth_date = birth_date;
    }
    
    // Handle numeric field properly
    if (weight_kg !== undefined) {
      updateData.weight_kg = weight_kg ? parseFloat(weight_kg) : null;
    }
    
    // Handle array field properly
    if (allergies !== undefined) {
      updateData.allergies = Array.isArray(allergies) ? allergies : [];
    }
    
    if (medical_history !== undefined) updateData.medical_history = medical_history;
    if (gender !== undefined) updateData.gender = gender;
    if (social_security_number !== undefined) updateData.social_security_number = social_security_number;
    if (health_insurance !== undefined) updateData.health_insurance = health_insurance;
    if (coverage_mutuelle !== undefined) updateData.coverage_mutuelle = coverage_mutuelle;
    if (street_address !== undefined) updateData.street_address = street_address;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    
    // Validate gender if provided
    if (gender && !['M', 'F', 'Other'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }
    
    // Check if social security number is already taken by another patient
    if (social_security_number) {
      const { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('user_id')
        .eq('social_security_number', social_security_number)
        .neq('user_id', userId)
        .single();
      
      if (existingPatient) {
        return res.status(409).json({ error: 'Ce numéro de sécurité sociale est déjà utilisé' });
      }
    }
    
    // Update patient data
    const { data: updatedPatient, error: updateError } = await supabase
      .from('patients')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating patient:', updateError);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
    
    res.json({
      success: true,
      patient: updatedPatient
    });
    
  } catch (error) {
    console.error('Error in /api/patients/update:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update user profile picture
app.post('/api/users/profile-picture', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.sub;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }
    
    // Delete old profile picture if it exists and is not the default
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('profile_url')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return res.status(500).json({ error: 'Erreur lors de la récupération des données utilisateur' });
    }
    
    // If user has a custom profile picture, delete it from storage
    if (currentUser.profile_url && 
        !currentUser.profile_url.includes('wikipedia.org') && 
        currentUser.profile_url.includes('supabase')) {
      const oldPath = currentUser.profile_url.split('/').slice(-2).join('/');
      await supabase.storage.from('profiles').remove([oldPath]);
    }
    
    // Upload new profile picture
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading profile picture:', uploadError);
      return res.status(500).json({ error: 'Erreur lors du téléchargement de l\'image' });
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);
    
    // Update user profile_url and updated_at
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        profile_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating user profile_url:', updateError);
      // Try to delete the uploaded file
      await supabase.storage.from('profiles').remove([filePath]);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
    }
    
    res.json({
      success: true,
      profile_url: updatedUser.profile_url
    });
    
  } catch (error) {
    console.error('Error in /api/users/profile-picture:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get patient medical history
app.get('/api/patients/medical-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can access patient data' });
    }
    
    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        birth_date,
        weight_kg,
        allergies,
        medical_history,
        gender,
        social_security_number,
        health_insurance,
        coverage_mutuelle,
        street_address,
        postal_code,
        city,
        country
      `)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching patient data:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des données' });
    }
    
    res.json(patient);
    
  } catch (error) {
    console.error('Error in /api/patients/medical-history:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});