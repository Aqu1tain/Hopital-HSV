import { supabase } from '../config/database.js';
import { sendTestEmail } from '../services/emailService.js';

// Route de test d'envoi d'email
export async function testEmail(req, res) {
  try {
    await sendTestEmail();
    res.json({ message: 'Email de test envoyé avec succès' });
  } catch (err) {
    console.error('Erreur envoi email test :', err);
    res.status(500).json({ error: 'Échec envoi email test', details: err.message });
  }
}

// Route: Récupérer les infos de l'utilisateur connecté
export async function getMe(req, res) {
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
}

// Update user data (phone and email)
export async function updateUser(req, res) {
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
}

// Update user profile picture
export async function updateProfilePicture(req, res) {
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
}