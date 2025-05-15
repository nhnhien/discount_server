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

// === CRUD Product ===
// Cho phép guest truy cập GET /api/product và GET /api/product/:id
router.get("/", getProduct);
router.get("/:id", getProductById);
// Các route còn lại mới cần xác thực
router.use(verifyFirebaseToken);
router.post("/", createProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// === Excel Import/Export ===
router.get("/excel/template", generateExcelTemplate);
router.post("/excel/import", importProductsFromExcel);
router.get("/excel/export", exportProductsToExcel);

export default router;
