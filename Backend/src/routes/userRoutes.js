import express from 'express';
import { authenticate, requireMfaVerified } from '../middleware/auth.js';
import { getUser, list, update, updateSchema, remove, uploadUserPhoto } from '../controllers/userController.js';
import { validate } from '../middleware/validate.js';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.use(authenticate());
router.use(requireMfaVerified());
router.get('/', list);
router.get('/:id', getUser);
router.put('/:id', validate({ body: updateSchema }), update);
router.delete('/:id', remove);
router.post('/:id/photo', upload.single('file'), uploadUserPhoto);

export default router;
