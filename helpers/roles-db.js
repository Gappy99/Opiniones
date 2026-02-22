export {
  getUserRoleNames as obtenerNombresRoles,
  getUsersByRole as obtenerUsuariosPorRol,
  setUserSingleRole as asignarRolUnico,
} from './role-db.js';

export { ALLOWED_ROLES as ROLES_PERMITIDOS, ADMIN_ROLE as ROL_ADMIN } from './role-constants.js';
