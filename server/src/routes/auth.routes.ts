/*
    *  -------------------------------------------------------------------  *
    *  -----  auth.routes.ts  --  /server/src/routes/auth.routes.ts  -----  *
    *  -------------------------------------------------------------------  *
*/
import { Router, type Request, type Response } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para iniciar sesión.
 */
authRouter.post('/login', (req: Request, res: Response): Promise<void> =>
    authController.login(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para cerrar la sesión.
 */
authRouter.post('/logout', (req: Request, res: Response): void =>
    authController.logout(req, res),
);

/**
 * -------------------------
 * -----  `handler()`  -----
 * -------------------------
 * - Atiende la ruta para consultar el usuario autenticado.
 */
authRouter.get('/me', requireAuth, (req: Request, res: Response): void =>
    authController.me(req, res),
);
