import {
  registerUserHelper,
  loginUserHelper,
  verifyEmailHelper,
  resendVerificationEmailHelper,
  forgotPasswordHelper,
  resetPasswordHelper,
} from '../../helpers/operaciones-auth.js';
import { getUserProfileHelper } from '../../helpers/operaciones-perfil.js';
import { asyncHandler } from '../../middlewares/manejador-errores.js';

// Controlador para registrar un nuevo usuario
// Recibe los datos del usuario, crea la cuenta y envía un email de verificación
// Responde con estado 201 si es exitoso o 409 si el usuario ya existe
export const register = asyncHandler(async (req, res) => {
  try {
    // Aquí se reciben los datos básicos del usuario (nombre, correo, contraseña, etc.)
    // req.file viene de middleware de subida (ej. multer), puede no existir
    // Obtener la imagen de perfil si fue subida en la petición
    const userData = {
      ...req.body,
      profilePicture: req.file ? req.file.path : null,
    };

    // Llamar al helper que valida y crea el usuario en la base de datos
    const result = await registerUserHelper(userData);

    // Retornar respuesta de éxito con código 201 (Created)
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in register controller:', error);

    // Asignar código de estado apropiado según el tipo de error
    let statusCode = 400;
    if (
      error.message.includes('ya está registrado') ||
      error.message.includes('ya está en uso') ||
      error.message.includes('Ya existe un usuario')
    ) {
      statusCode = 409; // Conflict - el usuario o email ya existe
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error en el registro',
      error: error.message,
    });
  }
});

// Controlador para iniciar sesión
// Valida las credenciales del usuario usando email o nombre de usuario
// Retorna un JWT si las credenciales son correctas
export const login = asyncHandler(async (req, res) => {
  try {
    // emailOrUsername permite iniciar sesión con correo o usuario
    const { emailOrUsername, password } = req.body;
    
    // Llamar al helper que valida las credenciales y genera el JWT
    const result = await loginUserHelper(emailOrUsername, password);

    // Retornar respuesta de éxito con el token JWT
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in login controller:', error);

    // Asignar código de estado apropiado según el tipo de error
    let statusCode = 401; // Unauthorized - credenciales inválidas
    if (
      error.message.includes('bloqueada') ||
      error.message.includes('desactivada')
    ) {
      statusCode = 423; // Locked - la cuenta está desactivada
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error en el login',
      error: error.message,
    });
  }
});

// Controlador para verificar el email del usuario
// Recibe un token de verificación enviado al email y lo valida
// Si el token es válido, marca el email como verificado y activa la cuenta
export const verifyEmail = asyncHandler(async (req, res) => {
  try {
    // El token se envía en el body desde el enlace del correo
    const { token } = req.body;
    
    // Llamar al helper que valida el token y marca el email como verificado
    const result = await verifyEmailHelper(token);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in verifyEmail controller:', error);

    // Asignar código de estado apropiado según el tipo de error
    let statusCode = 400;
    if (error.message.includes('no encontrado')) {
      statusCode = 404; // Not Found - el usuario o token no existe
    } else if (
      error.message.includes('inválido') ||
      error.message.includes('expirado')
    ) {
      statusCode = 401; // Unauthorized - el token es inválido o expiró
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error en la verificación',
      error: error.message,
    });
  }
});

// Controlador para reenviar el email de verificación
// Usado cuando el usuario no ha recibido el email de verificación original
// Genera un nuevo token y envía un nuevo email
export const resendVerification = asyncHandler(async (req, res) => {
  try {
    // Email del usuario que solicita el reenvío
    const { email } = req.body;
    
    // Llamar al helper que reenvía el email de verificación
    const result = await resendVerificationEmailHelper(email);

    // Verificar si la operación fue exitosa
    if (!result.success) {
      if (result.message.includes('no encontrado')) {
        return res.status(404).json(result); // Usuario no encontrado
      }
      if (result.message.includes('ya ha sido verificado')) {
        return res.status(400).json(result); // Email ya verificado
      }
      // Email no se pudo enviar
      return res.status(503).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in resendVerification controller:', error);

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
});

// Controlador para el flujo "olvide mi contraseña"
// Recibe el email del usuario y envía un enlace de recuperación
// Por seguridad, siempre retorna éxito aunque el usuario no exista
export const forgotPassword = asyncHandler(async (req, res) => {
  try {
    // Email del usuario que solicita recuperación
    const { email } = req.body;
    
    // Llamar al helper que genera el token y envía el email de recuperación
    const result = await forgotPasswordHelper(email);

    // Verificar si el email se envió correctamente
    // Por seguridad, no revelamos si el usuario existe o no
    if (!result.success && result.data?.initiated === false) {
      return res.status(503).json(result); // Error al enviar el email
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in forgotPassword controller:', error);

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
});

// Controlador para resetear la contraseña
// Recibe el token de recuperación y la nueva contraseña
// Valida el token y actualiza la contraseña en la base de datos
export const resetPassword = asyncHandler(async (req, res) => {
  try {
    // token y newPassword llegan desde el formulario de restablecimiento
    const { token, newPassword } = req.body;
    
    // Llamar al helper que valida el token y actualiza la contraseña
    const result = await resetPasswordHelper(token, newPassword);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in resetPassword controller:', error);

    // Asignar código de estado apropiado según el tipo de error
    let statusCode = 400;
    if (error.message.includes('no encontrado')) {
      statusCode = 404; // Not Found - el usuario o token no existe
    } else if (
      error.message.includes('inválido') ||
      error.message.includes('expirado')
    ) {
      statusCode = 401; // Unauthorized - el token es inválido o expiró
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al resetear contraseña',
      error: error.message,
    });
  }
});

// Controlador para obtener el perfil del usuario autenticado
// Requiere JWT válido en el header Authorization
// Retorna los datos del usuario actual
export const getProfile = asyncHandler(async (req, res) => {
  // El userId viene del middleware validateJWT que decodifica el JWT
  const userId = req.userId;
  
  // Obtener el perfil del usuario desde la base de datos
  const user = await getUserProfileHelper(userId);

  // Retornar respuesta estandarizada con los datos del usuario
  return res.status(200).json({
    success: true,
    message: 'Perfil obtenido exitosamente',
    data: user,
  });
});

// Controlador para obtener el perfil de otro usuario por su ID
// Accesible solo para administradores
// Retorna los datos públicos del usuario especificado
export const getProfileById = asyncHandler(async (req, res) => {
  // Este endpoint espera el userId en el body (no en params)
  const { userId } = req.body;

  // Validar que el userId fue proporcionado
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'El userId es requerido',
    });
  }

  // Obtener el perfil del usuario especificado desde la base de datos
  const user = await getUserProfileHelper(userId);

  // Retornar respuesta estandarizada con los datos del usuario
  return res.status(200).json({
    success: true,
    message: 'Perfil obtenido exitosamente',
    data: user,
  });
});
