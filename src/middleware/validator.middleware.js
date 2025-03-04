import { validationResult } from 'express-validator';

export const handleValidateErrors = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.errors.json({ errors: errors.array() });
  }
  next();
};