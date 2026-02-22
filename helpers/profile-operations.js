import { findUserById, updateUserProfile, checkUsernameExists } from './user-db.js';
import { buildUserResponse } from '../utils/user-helpers.js';
import { verifyPassword, hashPassword } from '../utils/password-utils.js';
import path from 'path';
import crypto from 'crypto';
import { uploadImage } from './cloudinary-service.js';
import { config } from '../configs/config.js';

export const getUserProfileHelper = async (userId) => {
  // Obtener el perfil del usuario por su ID
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return buildUserResponse(user);
};

export const updateUserProfileHelper = async (userId, updateData) => {
  // Validar que el usuario existe
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  // Preparar datos a actualizar (puede incluir campos de User y UserProfile)
  const dataToUpdate = {};
  const profileToUpdate = {};

  // Si se intenta actualizar el nombre de usuario, validar que no esté en uso
  if (updateData.username && updateData.username !== user.Username) {
    const usernameExists = await checkUsernameExists(updateData.username);
    if (usernameExists) {
      throw new Error('El nombre de usuario ya está en uso');
    }
    dataToUpdate.Username = updateData.username.trim();
  }

  // Actualizar nombre
  if (updateData.name) {
    dataToUpdate.Name = updateData.name.trim();
  }

  // Actualizar apellido
  if (updateData.surname) {
    dataToUpdate.Surname = updateData.surname.trim();
  }

  // Si se desea cambiar la contraseña, validar la contraseña anterior
  if (updateData.newPassword) {
    if (!updateData.currentPassword) {
      throw new Error('La contraseña actual es requerida para cambiar la contraseña');
    }

    // Verificar que la contraseña actual sea correcta
    // `verifyPassword` recibe (hashedPassword, plainPassword)
    const isPasswordValid = await verifyPassword(user.Password, updateData.currentPassword);

    if (!isPasswordValid) {
      throw new Error('La contraseña actual es incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await hashPassword(updateData.newPassword);
    dataToUpdate.Password = hashedPassword;
  }

  // Si se actualiza el teléfono, actualizar en profile
  if (updateData.phone) {
    profileToUpdate.Phone = updateData.phone.trim();
  }

  // Si se envía una imagen de perfil (ruta local), subir a Cloudinary y guardar filename
  if (updateData.profilePicture) {
    let profilePictureToStore = updateData.profilePicture;
    try {
      const uploadPath = config.upload.uploadPath;
      const isLocalFile =
        profilePictureToStore.includes('uploads/') ||
        profilePictureToStore.includes(uploadPath) ||
        profilePictureToStore.startsWith('./');

      if (isLocalFile) {
        const ext = path.extname(profilePictureToStore) || '.jpg';
        const randomHex = crypto.randomBytes(6).toString('hex');
        const cloudinaryFileName = `profile-${randomHex}${ext}`;
        // uploadImage elimina el archivo local tras subir
        profilePictureToStore = await uploadImage(profilePictureToStore, cloudinaryFileName);
      } else {
        // Normalizar si viene como URL de Cloudinary
        const baseUrl = config.cloudinary.baseUrl || '';
        const folder = config.cloudinary.folder || '';
        let normalized = profilePictureToStore;
        if (normalized.startsWith(baseUrl)) {
          normalized = normalized.slice(baseUrl.length);
        }
        if (folder && normalized.startsWith(`${folder}/`)) {
          normalized = normalized.slice(folder.length + 1);
        }
        profilePictureToStore = normalized.split('/').pop();
      }

      profileToUpdate.ProfilePicture = profilePictureToStore;
    } catch (err) {
      console.error('Error uploading profile picture during profile update:', err);
      // No fallar la actualización por un error en la subida de la imagen
    }
  }

  // Si no hay datos para actualizar, lanzar error
  if (Object.keys(dataToUpdate).length === 0 && Object.keys(profileToUpdate).length === 0) {
    throw new Error('No hay datos para actualizar');
  }

  // Merge both user and profile fields into a single update object compatible
  // with updateUserProfile which ahora maneja ambos conjuntos de campos.
  const mergedUpdate = { ...dataToUpdate, ...profileToUpdate };

  const updatedUser = await updateUserProfile(userId, mergedUpdate);
  return buildUserResponse(updatedUser);
};
