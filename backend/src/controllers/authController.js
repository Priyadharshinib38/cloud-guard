import { authenticateUser } from '../services/authService.js';

export function handleLogin(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const result = authenticateUser(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
