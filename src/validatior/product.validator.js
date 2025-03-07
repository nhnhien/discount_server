import { body } from 'express-validator';

const validateProduct = [
  body('name').optional().notEmpty().withMessage('Name is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('category_id').optional().isInt({ min: 1 }).withMessage('Category ID must be a valid integer'),
  body('market_id').optional().isInt({ min: 1 }).withMessage('Market ID must be a valid integer'),
];