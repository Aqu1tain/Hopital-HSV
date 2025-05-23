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
        error: err.message || 'Erreur interne lors de l’inscription',
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

// Route: inscription patient
app.post('/signup/patient', async (req, res) => {
  const { email, phone, first_name, last_name, birth_date, gender } = req.body;
  if (!email || !first_name || !last_name) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  // Créer user
  const { data: user, error: uErr } = await supabase
    .from('users')
    .insert([{ email, phone, first_name, last_name, role: 'patient' }])
    .select()
    .single();
  if (uErr) return res.status(400).json({ error: uErr.message });

  // Créer détails patient
  const { error: pErr } = await supabase
    .from('patients')
    .insert([{ user_id: user.id, birth_date, gender }]);
  if (pErr) return res.status(400).json({ error: pErr.message });

  res.json({ user_id: user.id });
});

// Route: inscription praticien (upload preuve)
app.post(
  '/signup/practitioner',
  authMiddleware,
  upload.single('proof'),
  async (req, res) => {
    const userId = req.user.sub;
    const { title, street_address, postal_code, city, floor, building_code,
            public_transport_access, payment_card, payment_bank_transfer,
            payment_cheque, payment_cash, accepts_mutuelle,
            conventioned, standard_price_cents, secu_coverage_percent } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Preuve requise' });

    // Upload preuve
    const path = `${userId}/${req.file.originalname}`;
    const { error: upErr } = await supabase.storage
      .from('proofs')
      .upload(path, req.file.buffer, { contentType: req.file.mimetype });
    if (upErr) return res.status(500).json({ error: upErr.message });
    const url = supabase.storage.from('proofs').getPublicUrl(path).data.publicUrl;

    // Insérer la preuve dans la table proofs
    const { error: proofErr } = await supabase
      .from('proofs')
      .insert([{
        practitioner_id: userId,
        url,
        filename: req.file.originalname,
      }]);
    if (proofErr) return res.status(500).json({ error: proofErr.message });

    // Insérer praticien non vérifié
    const { error: prErr } = await supabase
      .from('practitioners')
      .insert([{
        user_id: userId,
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
        is_verified: false
      }]);
    if (prErr) return res.status(400).json({ error: prErr.message });

    res.json({ message: 'Candidature reçue, en attente de validation' });
  }
);

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
