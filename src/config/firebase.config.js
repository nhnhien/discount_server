import admin from 'firebase-admin';
 import fs from 'fs';
 import { fileURLToPath } from 'url';
 import path from 'path';
 
 const __filename = fileURLToPath(import.meta.url);
 const __dirname = path.dirname(__filename);
 
 const serviceAccountPath = path.resolve(__dirname, '../data/serviceAccount.json');
 
 if (!fs.existsSync(serviceAccountPath)) {
   throw new Error('Firebase Admin Key file is missing!');
 }
 
 const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
 
 admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
 });
 
 export default admin;