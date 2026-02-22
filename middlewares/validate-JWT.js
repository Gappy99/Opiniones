import { verifyJWT } from '../helpers/generar-jwt.js';
import { findUserById } from '../helpers/db-usuario.js';

/**
 * Middleware para validar JWT
 */
export const validateJWT = async (req, _res, next) => {
  try {
    let token =
      req.header('x-token') ||
      req.header('authorization') ||
      req.body?.token ||
      req.query?.token;

    if (!token) {
      const err = new Error('No hay token en la petición');
      err.status = 401;
      throw err;
    }

    // Limpiar el token si viene con Bearer
    token = token.replace(/^Bearer\s+/, '');

    // Verificar el token
    const decoded = await verifyJWT(token);

    // Buscar el usuario por ID (decoded.sub es string)
    const user = await findUserById(decoded.sub);

    if (!user) {
      const err = new Error('Token no válido - Usuario no existe');
      err.status = 401;
      throw err;
    }

    // Verificar si el usuario está activo
    if (!user.Status) {
      const err = new Error('Cuenta desactivada. Contacta al administrador.');
      err.status = 423;
      throw err;
    }

    // Agregar el usuario al request
    req.user = user;
    req.userId = user.Id.toString();

    next();
  } catch (error) {
    console.error('Error validating JWT:', error);

    // Mapear errores comunes a mensajes y códigos estandarizados
    const err = new Error();
    if (error.name === 'TokenExpiredError') {
      err.message = 'Token expirado';
      err.status = 401;
    } else if (error.name === 'JsonWebTokenError') {
      err.message = 'Token inválido';
      err.status = 401;
    } else {
      err.message = error.message || 'Error al verificar el token';
      err.status = error.status || 401;
    }

    // Incluir detalle del error en ambiente de desarrollo
    if (process.env.NODE_ENV === 'development') err.error = error.message;

    next(err);
  }
};
