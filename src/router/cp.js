import express from 'express';
 import {
   applyCPRule,
   createCPRule,
   deleteCPRule,
   getCPRule,
   getCPRules,
   updateCPRule,
   toggleCPActive 
 } from '../controller/custom-pricing/customPricing.controller.js';
 
 const router = express.Router();
 
 router.get('/:id', getCPRule);
 router.get('/', getCPRules);
 router.post('/', createCPRule);
 router.patch('/:id', updateCPRule);
 router.delete('/:id', deleteCPRule);
 router.post('/apply', applyCPRule);
 router.patch('/:id/active', toggleCPActive); 

 export default router;