import express from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductById,
  updateProduct,
} from "../controller/product/product.controller.js";
import {
  generateExcelTemplate,
  importProductsFromExcel,
  exportProductsToExcel,
} from "../controller/product/product-excel.js"; // ⚠️ sửa đúng tên file
import verifyFirebaseToken from "../middleware/auth.middleware.js";

const router = express.Router();

// ✅ Áp dụng middleware xác thực Firebase cho tất cả route trong file này
router.use(verifyFirebaseToken);

// === CRUD Product ===
router.get("/:id", getProductById);
router.get("/", getProduct);
router.post("/", createProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// === Excel Import/Export ===
router.get("/excel/template", generateExcelTemplate);
router.post("/excel/import", importProductsFromExcel);
router.get("/excel/export", exportProductsToExcel);

export default router;
