import express from 'express';
import { authenticate, requireMfaVerified } from '../middleware/auth.js';
import { getUser, list, update, updateSchema, remove } from '../controllers/userController.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate());
router.use(requireMfaVerified());
router.get('/', list);
router.get('/:id', getUser);
router.put('/:id', validate({ body: updateSchema }), update);
router.delete('/:id', remove);

export default router;
