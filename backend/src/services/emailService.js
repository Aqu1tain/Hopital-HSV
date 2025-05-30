import { transporter } from '../config/email.js';
import { supabase } from '../config/database.js';
import { generateCode, hashCode } from '../utils/auth.js';

// Envoyer OTP et stocker le hash dans Supabase
export async function sendOtp(email) {
  const code = generateCode();
  const hash = hashCode(code);
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

export async function sendTestEmail() {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_FROM,
    subject: 'Test d\'envoi d\'email depuis Nodemailer',
    text: 'Si vous recevez ce mail, votre configuration SMTP fonctionne !'
  });
}

export async function sendAppointmentConfirmationEmail(patientEmail, patient, practitioner, appointmentDateTime) {
  const dateStr = appointmentDateTime.toLocaleDateString('fr-FR');
  const timeStr = appointmentDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: patientEmail,
      subject: 'Rendez-vous confirmé !',
      html: `
        <h2>Votre rendez-vous a été accepté ✓</h2>
        <p>Bonjour ${patient.first_name} ${patient.last_name},</p>
        <p><strong>${practitioner.title || ''} ${practitioner.users.first_name} ${practitioner.users.last_name}</strong> a accepté votre demande de rendez-vous.</p>
        <p><strong>Date :</strong> ${dateStr}</p>
        <p><strong>Heure :</strong> ${timeStr}</p>
        <p><strong>Adresse :</strong><br>
        ${practitioner.street_address}<br>
        ${practitioner.postal_code} ${practitioner.city}</p>
        <p>En cas d'empêchement, merci de nous prévenir au plus tôt.</p>
        <p>Cordialement,<br>L'équipe médicale</p>
      `
    });
  } catch (emailError) {
    console.error('Error sending confirmation email:', emailError);
    throw emailError;
  }
}