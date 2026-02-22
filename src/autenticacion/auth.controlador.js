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

export const register = asyncHandler(async (req, res) => {
  try {
    const datosUsuario = {
      ...req.body,
      profilePicture: req.file ? req.file.path : null,
    };

    const resultado = await registerUserHelper(datosUsuario);

    return res.status(201).json(resultado);
  } catch (error) {
    console.error('Error en register:', error);
    let statusCode = 400;
    if (
      error.message.includes('ya está registrado') ||
      error.message.includes('ya está en uso') ||
      error.message.includes('Ya existe un usuario')
    ) {
      statusCode = 409;
    }

    return res.status(statusCode).json({ exito: false, mensaje: error.message || 'Error en el registro', error: error.message });
  }
});

export const login = asyncHandler(async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    const resultado = await loginUserHelper(emailOrUsername, password);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en login:', error);
    let statusCode = 401;
    if (error.message.includes('bloqueada') || error.message.includes('desactivada')) statusCode = 423;
    return res.status(statusCode).json({ exito: false, mensaje: error.message || 'Error en el login', error: error.message });
  }
});

export const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { token } = req.body;
    const resultado = await verifyEmailHelper(token);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en verifyEmail:', error);
    let statusCode = 400;
    if (error.message.includes('no encontrado')) statusCode = 404;
    else if (error.message.includes('inválido') || error.message.includes('expirado')) statusCode = 401;
    return res.status(statusCode).json({ exito: false, mensaje: error.message || 'Error en la verificación', error: error.message });
  }
});

export const resendVerification = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const resultado = await resendVerificationEmailHelper(email);
    if (!resultado.success) {
      if (resultado.message.includes('no encontrado')) return res.status(404).json(resultado);
      if (resultado.message.includes('ya ha sido verificado')) return res.status(400).json(resultado);
      return res.status(503).json(resultado);
    }
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en resendVerification:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor', error: error.message });
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const resultado = await forgotPasswordHelper(email);
    if (!resultado.success && resultado.data?.initiated === false) return res.status(503).json(resultado);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor', error: error.message });
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const resultado = await resetPasswordHelper(token, newPassword);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en resetPassword:', error);
    let statusCode = 400;
    if (error.message.includes('no encontrado')) statusCode = 404;
    else if (error.message.includes('inválido') || error.message.includes('expirado')) statusCode = 401;
    return res.status(statusCode).json({ exito: false, mensaje: error.message || 'Error al resetear contraseña', error: error.message });
  }
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const usuario = await getUserProfileHelper(userId);
  return res.status(200).json({ exito: true, mensaje: 'Perfil obtenido exitosamente', data: usuario });
});

export const getProfileById = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ exito: false, mensaje: 'El userId es requerido' });
  const usuario = await getUserProfileHelper(userId);
  return res.status(200).json({ exito: true, mensaje: 'Perfil obtenido exitosamente', data: usuario });
});
