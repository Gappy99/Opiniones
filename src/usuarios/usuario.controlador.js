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

// Verifica si el usuario autenticado tiene rol de administrador
const asegurarAdmin = async (req) => {
  const usuarioActualId = req.userId;
  if (!usuarioActualId) return false;

  const roles =
    req.user?.UserRoles?.map((ur) => ur.Role?.Name).filter(Boolean) ??
    (await getUserRoleNames(usuarioActualId));

  return roles.includes(ADMIN_ROLE);
};

export const updateUserRole = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await asegurarAdmin(req))) {
      return res.status(403).json({ exito: false, mensaje: 'Prohibido' });
    }

    const { userId } = req.params;
    const { roleName } = req.body || {};
    const normalizado = (roleName || '').trim().toUpperCase();

    if (!ALLOWED_ROLES.includes(normalizado)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Rol no permitido. Use ADMIN_ROLE o USER_ROLE',
      });
    }

    const usuario = await findUserById(userId);
    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    const { updatedUser } = await setUserSingleRole(usuario, normalizado, sequelize);

    return res.status(200).json(buildUserResponse(updatedUser));
  }),
];

export const getUserRoles = [
  validateJWT,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const roles = await getUserRoleNames(userId);
    return res.status(200).json(roles);
  }),
];

export const getUsersByRole = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await asegurarAdmin(req))) {
      return res.status(403).json({ exito: false, mensaje: 'Prohibido' });
    }

    const { roleName } = req.params;
    const normalizado = (roleName || '').trim().toUpperCase();

    if (!ALLOWED_ROLES.includes(normalizado)) {
      return res.status(400).json({ exito: false, mensaje: 'Rol no permitido' });
    }

    const usuarios = await repoGetUsersByRole(normalizado);
    const payload = usuarios.map(buildUserResponse);
    return res.status(200).json(payload);
  }),
];

export const getProfile = [
  validateJWT,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.userId;
      const perfil = await getUserProfileHelper(userId);
      return res.status(200).json({ exito: true, mensaje: 'Perfil obtenido', data: perfil });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return res.status(error.status || 500).json({ exito: false, mensaje: error.message || 'Error al obtener perfil' });
    }
  }),
];

export const updateProfile = [
  validateJWT,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.userId;
      const datos = req.body;
      const perfilActualizado = await updateUserProfileHelper(userId, datos);
      return res.status(200).json({ exito: true, mensaje: 'Perfil actualizado', data: perfilActualizado });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      let statusCode = 400;
      if (error.message.includes('no encontrado')) statusCode = 404;
      else if (error.message.includes('ya está en uso')) statusCode = 409;
      return res.status(statusCode).json({ exito: false, mensaje: error.message || 'Error al actualizar perfil' });
    }
  }),
];
