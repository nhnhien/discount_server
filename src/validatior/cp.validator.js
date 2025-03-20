import { body } from 'express-validator';
 
 export const validateCustomPricing = [
   body('title').notEmpty().withMessage('Tiêu đề là bắt buộc'),
   body('discount_type')
     .notEmpty()
     .withMessage('Loại giảm giá là bắt buộc')
     .isIn(['percentage', 'fixed'])
     .withMessage('Loại giảm giá phải là "percentage" hoặc "fixed"'),
   body('discount_value')
     .notEmpty()
     .withMessage('Giá trị giảm giá là bắt buộc')
     .isFloat({ min: 0 })
     .withMessage('Giá trị giảm giá phải là số dương')
     .custom((value, { req }) => {
       if (req.body.discount_type === 'percentage' && value > 100) {
         throw new Error('Giảm giá phần trăm không thể lớn hơn 100%');
       }
       return true;
     }),
 
   body('start_date')
     .notEmpty()
     .withMessage('Ngày bắt đầu là bắt buộc')
     .isISO8601()
     .withMessage('Ngày bắt đầu phải là định dạng ISO 8601'),
 
   body('end_date')
     .notEmpty()
     .withMessage('Ngày kết thúc là bắt buộc')
     .isISO8601()
     .withMessage('Ngày kết thúc phải là định dạng ISO 8601')
     .custom((value, { req }) => {
       if (new Date(value) <= new Date(req.body.start_date)) {
         throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
       }
       return true;
     }),
 ];