import { supabase } from '../config/database.js';
import { sendOtp } from '../services/emailService.js';
import { hashCode, generateToken } from '../utils/auth.js';

// Route: demander un code OTP
export async function requestOtp(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });
  try {
    await sendOtp(email);
    res.json({ message: 'Code envoyé par email' });
  } catch (err) {
    console.error('Erreur sendOtp:', err);
    res.status(500).json({ error: 'Échec envoi code' });
  }
}

// Route: logout
export function logout(req, res) {
  // For JWT, logout is handled client-side by deleting the token.
  // Optionally, we could blacklist the token here if we implement server-side invalidation.
  res.json({ success: true });
}

// Route: vérifier OTP et émettre JWT ou lancer signup
export async function verifyOtp(req, res) {
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

  const hash = hashCode(code);
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
  const token = generateToken({ sub: user.id, role: user.role });

  return res.json({ token });
}

// Route: inscription patient (création de compte + JWT renvoyé)
export async function signupPatient(req, res) {
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
  const token = generateToken({ sub: user.id, role: 'patient' });

  return res.json({ token, user: { id: user.id, role: 'patient' } });
}

export async function signupPractitioner(req, res) {  
    const {
      email, phone, first_name, last_name, title, specialty,
      street_address, postal_code, city, floor, building_code,
      public_transport_access,
      payment_card, payment_bank_transfer,
      payment_cheque, payment_cash,
      payment_mutuelle,
      conventioned,
      standard_price_cents, secu_coverage_percent,
    } = req.body;
  
    if (!email || !first_name || !last_name) {
      return res
        .status(400)
        .json({ error: 'email, prénom et nom sont obligatoires' });
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
      if (uErr) {
        console.error('User creation error:', uErr);
        throw uErr;
      }
  
      console.log('User created successfully:', user);
  
      // 2) Insert practitioner profile (no file upload needed)
      const { error: pErr } = await supabase
        .from('practitioners')
        .insert([
          {
            user_id: user.id,
            title, // Professional title (Dr., M., Mme., etc.)
            specialty, // Medical specialty/profession
            street_address,
            postal_code,
            city,
            floor,
            building_code,
            public_transport_access,
            payment_card: payment_card === 'true' || payment_card === true,
            payment_bank_transfer: payment_bank_transfer === 'true' || payment_bank_transfer === true,
            payment_cheque: payment_cheque === 'true' || payment_cheque === true,
            payment_cash: payment_cash === 'true' || payment_cash === true,
            accepts_mutuelle: payment_mutuelle === 'true' || payment_mutuelle === true,
            conventioned: conventioned === 'true' || conventioned === true,
            standard_price_cents: standard_price_cents ? Number(standard_price_cents) : null,
            secu_coverage_percent: secu_coverage_percent ? Number(secu_coverage_percent) : null,
            verification_documents: [], // Empty array, no documents
            is_verified: false, // Can be manually verified later by admin
          },
        ]);
      if (pErr) {
        console.error('Practitioner creation error:', pErr);
        throw pErr;
      }
  
      console.log('Practitioner profile created successfully');
  
      return res.json({
        message: "Inscription praticien réussie ! Votre profil a été créé et est en attente de validation.",
      });
    } catch (err) {
      console.error('Signup practitioner error:', err);
      return res.status(500).json({
        error: err.message || 'Erreur interne lors de l\'inscription',
      });
    }
  }

// Route: redirection selon rôle
export function redirectHome(req, res) {
  if (req.user.role === 'practitioner') {
    return res.redirect('/practitioner/dashboard');
  }
  return res.redirect('/patient/dashboard');
}