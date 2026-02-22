'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
import { connectMongoDB } from './mongodb.js';
// Ensure models are registered before DB sync
import '../src/users/user.model.js';
import '../src/auth/role.model.js';
import { requestLimit } from '../middlewares/limite-peticiones.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import {
  errorHandler,
  notFound,
} from '../middlewares/manejador-errores.js';
import autenticacionRutas from '../src/autenticacion/autenticacion.rutas.js';
import usuariosRutas from '../src/usuarios/usuarios.rutas.js';
import opinionesRutas from '../src/opiniones/opiniones.rutas.js';
import comentariosRutas from '../src/comments/comment.routes.js';
import { ensureAdminUser } from '../helpers/semilla-admin.js';

const BASE_PATH = '/api/v1';

const middlewares = (app) => {
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors(corsOptions));
  app.use(helmet(helmetConfiguration));
  app.use(requestLimit);
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
};

const routes = (app) => {
  app.use(`${BASE_PATH}/auth`, autenticacionRutas);
  app.use(`${BASE_PATH}/users`, usuariosRutas);
  app.use(`${BASE_PATH}/opinions`, opinionesRutas);
  app.use(`${BASE_PATH}/comments`, comentariosRutas);

  app.get(`${BASE_PATH}/health`, (req, res) => {
    res.status(200).json({
      estado: 'Saludable',
      timestamp: new Date().toISOString(),
      servicio: 'Servicio de Autenticación KinalSports',
    });
  });
  // 404 handler (standardized)
  app.use(notFound);
};

export const initServer = async () => {
  const app = express();
  const PORT = process.env.PORT;
  app.set('trust proxy', 1);

  try {
    await dbConnection();
    await connectMongoDB();
    // Seed essential data (roles)
    const { seedRoles } = await import('../helpers/semilla-roles.js');
    await seedRoles();
    const admin = await ensureAdminUser();
    middlewares(app);
    routes(app);

    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`KinalBook Auth Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
      console.log(
        `Default admin ready: ${admin.email} (id: ${admin.id})`
      );
      console.log(`Default admin token: ${admin.token}`);
    });
  } catch (err) {
    console.error(`Error starting Auth Server: ${err.message}`);
    process.exit(1);
  }
};
