import { asyncHandler } from '../../middlewares/manejador-errores.js';
import { validateJWT } from '../../middlewares/validar-JWT.js';
import { findUserById } from '../../helpers/db-usuario.js';
import {
  obtenerNombresRoles as getUserRoleNames,
  obtenerUsuariosPorRol as repoGetUsersByRole,
  asignarRolUnico as setUserSingleRole,
} from '../../helpers/roles-db.js';
import { ROLES_PERMITIDOS as ALLOWED_ROLES, ROL_ADMIN as ADMIN_ROLE } from '../../helpers/roles-db.js';
import { buildUserResponse } from '../../utils/user-helpers.js';
import { sequelize } from '../../configs/db.js';
import { actualizarPerfilUsuario as updateUserProfileHelper, obtenerPerfilUsuario as getUserProfileHelper } from '../../helpers/operaciones-perfil.js';

// Función auxiliar para verificar si el usuario autenticado tiene rol de administrador
// Retorna true si es admin, false si no
const ensureAdmin = async (req) => {
  const currentUserId = req.userId;
  if (!currentUserId) return false;
  
  // Obtener los roles del usuario desde la relación o desde la base de datos
  const roles =
    req.user?.UserRoles?.map((ur) => ur.Role?.Name).filter(Boolean) ??
    (await getUserRoleNames(currentUserId));
  
  // ADMIN_ROLE es el nombre normalizado del rol admin (ej. ADMIN_ROLE)
  return roles.includes(ADMIN_ROLE);
};

// Controlador para actualizar el rol de un usuario
// Solo administradores pueden ejecutar esta acción
// Recibe el userId en params y el nuevo rol en el body
export const updateUserRole = [
  validateJWT, // Middleware para validar que el usuario esté autenticado
  asyncHandler(async (req, res) => {
    // Verificar que el usuario autenticado es administrador
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // userId del usuario al que se le cambiará el rol (viene por params)
    const { userId } = req.params;
    const { roleName } = req.body || {};

    // Normalizar el nombre del rol a mayúsculas para comparar con constantes
    const normalized = (roleName || '').trim().toUpperCase();
    
    // Validar que el rol sea uno de los permitidos
    if (!ALLOWED_ROLES.includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: 'Role not allowed. Use ADMIN_ROLE or USER_ROLE',
      });
    }

    // Verificar que el usuario objetivo existe
    const user = await findUserById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    // Actualizar el rol del usuario (solo un rol activo por usuario)
    const { updatedUser } = await setUserSingleRole(
      user,
      normalized,
      sequelize
    );

    // buildUserResponse elimina campos sensibles (password, etc.)
    return res.status(200).json(buildUserResponse(updatedUser));
  }),
];

// Controlador para obtener los roles de un usuario específico
// Requiere autenticación JWT
// Retorna un array con los nombres de los roles del usuario
export const getUserRoles = [
  validateJWT, // Middleware para validar que el usuario esté autenticado
  asyncHandler(async (req, res) => {
    // userId del usuario que se consulta (viene por params)
    const { userId } = req.params;
    
    // Obtener la lista de roles del usuario desde la base de datos
    const roles = await getUserRoleNames(userId);
    
    // Se devuelve un arreglo simple de nombres de rol
    return res.status(200).json(roles);
  }),
];

// Controlador para obtener todos los usuarios que tienen un rol específico
// Solo administradores pueden ejecutar esta acción
// Retorna una lista de usuarios con el rol especificado
export const getUsersByRole = [
  validateJWT, // Middleware para validar que el usuario esté autenticado
  asyncHandler(async (req, res) => {
    // Verificar que el usuario autenticado es administrador
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // roleName viene por params (ej. /roles/ADMIN_ROLE)
    const { roleName } = req.params;
    
    // Normalizar el nombre del rol a mayúsculas
    const normalized = (roleName || '').trim().toUpperCase();
    
    // Validar que el rol sea uno de los permitidos
    if (!ALLOWED_ROLES.includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: 'Role not allowed. Use ADMIN_ROLE or USER_ROLE',
      });
    }

    // Obtener los usuarios con el rol especificado
    const users = await repoGetUsersByRole(normalized);
    
    // Formatear la respuesta de los usuarios sin datos sensibles
    const payload = users.map(buildUserResponse);
    
    return res.status(200).json(payload);
  }),
];

// Controlador para obtener el perfil del usuario actual autenticado
// El usuario solo puede acceder a su propio perfil
// Retorna los datos completos del perfil del usuario autenticado
export const getProfile = [
  validateJWT, // Middleware para validar que el usuario esté autenticado
  asyncHandler(async (req, res) => {
    try {
      // El userId viene del middleware validateJWT que decodifica el JWT
      const userId = req.userId;
      
      // Obtener los datos del perfil del usuario desde la base de datos
      const userProfile = await getUserProfileHelper(userId);
      
      return res.status(200).json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: userProfile,
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error al obtener perfil',
      });
    }
  }),
];

// Controlador para actualizar el perfil del usuario actual autenticado
// El usuario puede actualizar su nombre, apellido, nombre de usuario y contraseña
// Para cambiar contraseña, debe proporcionar la contraseña actual
export const updateProfile = [
  validateJWT, // Middleware para validar que el usuario esté autenticado
  asyncHandler(async (req, res) => {
    try {
      // El userId viene del middleware validateJWT que decodifica el JWT
      const userId = req.userId;
        // updateData incluye campos permitidos (nombre, apellido, username, password, phone)
        const updateData = {
          ...req.body,
          profilePicture: req.file ? req.file.path : undefined,
        };

      // Llamar al helper que actualiza el perfil con validaciones
      const updatedProfile = await updateUserProfileHelper(userId, updateData);
      
      return res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedProfile,
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      
      // Asignar código de estado apropiado según el tipo de error
      let statusCode = 400;
      if (error.message.includes('no encontrado')) {
        statusCode = 404; // Usuario no encontrado
      } else if (error.message.includes('ya está en uso')) {
        statusCode = 409; // Nombre de usuario ya existe
      }

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al actualizar perfil',
      });
    }
  }),
];
