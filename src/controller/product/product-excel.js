import { Product, Variant, Attribute, AttributeValue, VariantValue, Category, Market, sequelize } from "../../models/index.js"
import ExcelJS from "exceljs"
import multer from "multer"
import path from "path"
import fs from "fs"
import { Op } from "sequelize"

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      const filetypes = /xlsx|xls/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
      if (extname) {
        return cb(null, true);
      }
  
      cb(new Error("Error: File upload only supports .xlsx or .xls"));
    },
  });
  

// Generate Excel template
// ✅ generateExcelTemplate.js

export const generateExcelTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // ================= Sheet 1: Products =================
    const worksheet = workbook.addWorksheet("Products");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Category ID", key: "category_id", width: 15 },
      { header: "Market ID", key: "market_id", width: 15 },
      { header: "Has Variant", key: "has_variant", width: 15 },
      { header: "SKU", key: "sku", width: 20 },
      { header: "Original Price", key: "original_price", width: 15 },
      { header: "Final Price", key: "final_price", width: 15 },
      { header: "Stock Quantity", key: "stock_quantity", width: 15 },
      { header: "Image URL", key: "image_url", width: 50 },
      { header: "Variant ID", key: "variant_id", width: 10 },
      { header: "Variant SKU", key: "variant_sku", width: 20 },
      { header: "Variant Original Price", key: "variant_original_price", width: 20 },
      { header: "Variant Final Price", key: "variant_final_price", width: 20 },
      { header: "Variant Stock Quantity", key: "variant_stock_quantity", width: 20 },
      { header: "Variant Image URL", key: "variant_image_url", width: 50 },
      { header: "Size", key: "size", width: 15 },
      { header: "Color", key: "color", width: 15 },
      { header: "Material", key: "material", width: 15 },
      { header: "Other Attributes", key: "other_attributes", width: 50 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // ✅ Sample product without variant
    worksheet.addRow({
      name: "Sample Product",
      description: "This is a basic product",
      category_id: 1,
      market_id: 1,
      has_variant: "FALSE",
      sku: "BASIC-001",
      original_price: 100000,
      final_price: 95000,
      stock_quantity: 100,
      image_url: "https://example.com/basic.jpg",
    });

    // ✅ Sample product with variant
    worksheet.addRow({
      name: "Sample Variant Product",
      description: "This product has variants",
      category_id: 2,
      market_id: 1,
      has_variant: "TRUE",
      variant_sku: "VAR-001-M-RED",
      variant_original_price: 120000,
      variant_final_price: 110000,
      variant_stock_quantity: 50,
      variant_image_url: "https://example.com/variant.jpg",
      size: "M",
      color: "Red",
      material: "Cotton",
      other_attributes: "Length: Long, Fit: Slim",
    });

    // ================= Sheet 2: Instructions =================
    const instructions = workbook.addWorksheet("Instructions");

    instructions.columns = [
      { header: "Field", key: "field", width: 25 },
      { header: "Description", key: "description", width: 80 },
    ];

    instructions.getRow(1).font = { bold: true };
    instructions.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const guide = [
      { field: "Name", description: "Tên sản phẩm (bắt buộc)" },
      { field: "Category ID", description: "ID danh mục (bắt buộc). Xem sheet 'Categories'" },
      { field: "Market ID", description: "ID sàn thương mại (bắt buộc)" },
      { field: "Has Variant", description: "TRUE nếu có biến thể, FALSE nếu không" },
      { field: "SKU", description: "SKU sản phẩm chính nếu không có biến thể" },
      { field: "Original Price", description: "Giá gốc sản phẩm chính" },
      { field: "Final Price", description: "Giá sau giảm sản phẩm chính" },
      { field: "Stock Quantity", description: "Tồn kho sản phẩm chính" },
      { field: "Variant SKU", description: "SKU của biến thể" },
      { field: "Variant Original Price", description: "Giá gốc biến thể" },
      { field: "Variant Final Price", description: "Giá cuối biến thể" },
      { field: "Size / Color / Material", description: "Thông tin thuộc tính chính của biến thể" },
      { field: "Other Attributes", description: "Thuộc tính khác: dạng 'Tên: Giá trị', cách nhau bởi dấu phẩy" },
    ];

    guide.forEach((row) => instructions.addRow(row));

    // ================= Sheet 3: Categories =================
    const categoriesSheet = workbook.addWorksheet("Categories");

    categoriesSheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 30 },
    ];

    categoriesSheet.getRow(1).font = { bold: true };
    categoriesSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCE5FF" },
    };

    const categories = await Category.findAll({ attributes: ["id", "name"] });
    categories.forEach((cat) => {
      categoriesSheet.addRow({ id: cat.id, name: cat.name });
    });

    // ================= Export =================
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=product_template.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Error generating Excel template:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

  
// Import products from Excel
export const importProductsFromExcel = async (req, res) => {
    const uploadMiddleware = upload.single("file");
  
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
  
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }
  
      const transaction = await sequelize.transaction();
  
      try {
        const filePath = req.file.path;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
  
        const worksheet = workbook.getWorksheet("Products");
        if (!worksheet) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Invalid Excel file format. "Products" worksheet not found.',
          });
        }
  
        const products = [];
        const errors = [];
        let rowNumber = 2;
  
        for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
          const row = worksheet.getRow(rowIndex);
          const rowData = {};
        
          row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
            const header = worksheet.getRow(1).getCell(colIndex).value;
            rowData[header] = cell.value;
          });
        
          console.log(`📥 Row ${rowIndex} raw data:`, rowData);
        
          // Làm sạch & ép kiểu ID
          rowData["Category ID"] = Number(String(rowData["Category ID"]).trim());
          rowData["Market ID"] = Number(String(rowData["Market ID"]).trim());
        
          // Kiểm tra dữ liệu bắt buộc
          if (
            !rowData["Name"] ||
            !rowData["Category ID"] ||
            !rowData["Market ID"] ||
            rowData["Has Variant"] === undefined
          ) {
            console.log(`❌ Row ${rowIndex}: Thiếu trường bắt buộc`);
            errors.push(`Row ${rowIndex}: Missing required fields`);
            continue;
          }
          console.log(`🔍 Checking category_id (row ${rowIndex}):`, rowData["Category ID"], typeof rowData["Category ID"]);

          // Kiểm tra ID có tồn tại trong DB không
          const categoryExists = await Category.findByPk(rowData["Category ID"]);
          if (!categoryExists) {
            console.log(`❌ Row ${rowIndex}: Category không tồn tại`);
            errors.push(`Row ${rowIndex}: Invalid Category ID: ${rowData["Category ID"]}`);
            continue;
          }
        
          const marketExists = await Market.findByPk(rowData["Market ID"]);
          if (!marketExists) {
            console.log(`❌ Row ${rowIndex}: Market không tồn tại`);
            errors.push(`Row ${rowIndex}: Invalid Market ID: ${rowData["Market ID"]}`);
            continue;
          }
        
          const hasVariant = String(rowData["Has Variant"]).toUpperCase() === "TRUE";
        
          if (
            !hasVariant &&
            (!rowData["SKU"] ||
              rowData["Original Price"] === undefined ||
              rowData["Final Price"] === undefined ||
              rowData["Stock Quantity"] === undefined)
          ) {
            console.log(`❌ Row ${rowIndex}: Thiếu dữ liệu cho sản phẩm không có biến thể`);
            errors.push(`Row ${rowIndex}: Missing required fields for product without variants`);
            continue;
          }
        
          if (
            hasVariant &&
            (!rowData["Variant SKU"] ||
              rowData["Variant Original Price"] === undefined ||
              rowData["Variant Final Price"] === undefined ||
              rowData["Variant Stock Quantity"] === undefined)
          ) {
            console.log(`❌ Row ${rowIndex}: Thiếu dữ liệu cho sản phẩm có biến thể`);
            errors.push(`Row ${rowIndex}: Missing required fields for product with variants`);
            continue;
          }
        
          // Xử lý attributes
          const attributes = [];
          if (rowData["Size"]) attributes.push({ name: "Size", value: rowData["Size"] });
          if (rowData["Color"]) attributes.push({ name: "Color", value: rowData["Color"] });
          if (rowData["Material"]) attributes.push({ name: "Material", value: rowData["Material"] });
        
          if (rowData["Other Attributes"]) {
            const others = rowData["Other Attributes"].split(",");
            others.forEach((item) => {
              const [key, val] = item.split(":").map((s) => s.trim());
              if (key && val) attributes.push({ name: key, value: val });
            });
          }
        
          products.push({
            name: rowData["Name"],
            description: rowData["Description"],
            category_id: rowData["Category ID"],
            market_id: rowData["Market ID"],
            has_variant: hasVariant,
            sku: !hasVariant ? rowData["SKU"] : null,
            original_price: !hasVariant ? rowData["Original Price"] : null,
            final_price: !hasVariant ? rowData["Final Price"] : null,
            stock_quantity: !hasVariant ? rowData["Stock Quantity"] : null,
            image_url:
            typeof rowData["Image URL"] === "object" && rowData["Image URL"]?.hyperlink
              ? rowData["Image URL"].hyperlink.trim()
              : String(rowData["Image URL"] || "").trim(),
                      variants: hasVariant
              ? [
                  {
                    sku: rowData["Variant SKU"],
                    original_price: rowData["Variant Original Price"],
                    final_price: rowData["Variant Final Price"],
                    stock_quantity: rowData["Variant Stock Quantity"],
                    image_url:
                    typeof rowData["Variant Image URL"] === "object" && rowData["Variant Image URL"]?.hyperlink
                      ? rowData["Variant Image URL"].hyperlink.trim()
                      : String(rowData["Variant Image URL"] || "").trim(),
                  
                                      attributes,
                  },
                ]
              : [],
          });
        
          console.log(`✅ Row ${rowIndex} is valid and added to products[]`);
        }
        
        if (products.length === 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "No valid products found in Excel file.",
          });
        }
        
        
  
        if (errors.length > 0) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: "Validation errors", errors });
        }
  
        const allSkus = [];
        products.forEach((product) => {
          if (!product.has_variant && product.sku) allSkus.push(product.sku);
          if (product.has_variant && product.variants) {
            product.variants.forEach((variant) => {
              if (variant.sku) allSkus.push(variant.sku);
            });
          }
        });
  
        const uniqueSkus = [...new Set(allSkus)];
        if (uniqueSkus.length !== allSkus.length) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Duplicate SKUs found in the Excel file",
          });
        }
  
        const existingProductSkus = await Product.findAll({
          where: { sku: { [Op.in]: uniqueSkus } },
          transaction,
        });
  
        const existingVariantSkus = await Variant.findAll({
          where: { sku: { [Op.in]: uniqueSkus } },
          transaction,
        });
  
        if (existingProductSkus.length > 0 || existingVariantSkus.length > 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Some SKUs already exist in the database",
            existingSkus: [...existingProductSkus.map((p) => p.sku), ...existingVariantSkus.map((v) => v.sku)],
          });
        }
  
        const createdProducts = [];
        for (const productData of products) {
          const newProduct = await Product.create(
            {
              name: productData.name,
              description: productData.description,
              category_id: productData.category_id,
              market_id: productData.market_id,
              has_variant: productData.has_variant,
              sku: productData.sku,
              original_price: productData.original_price,
              final_price: productData.final_price,
              stock_quantity: productData.stock_quantity,
              image_url: productData.image_url,
            },
            { transaction }
          );
  
          if (productData.has_variant && productData.variants.length > 0) {
            for (const variantData of productData.variants) {
              const newVariant = await Variant.create(
                {
                  product_id: newProduct.id,
                  sku: variantData.sku,
                  original_price: variantData.original_price,
                  final_price: variantData.final_price,
                  stock_quantity: variantData.stock_quantity,
                  image_url: variantData.image_url,
                },
                { transaction }
              );
  
              for (const attr of variantData.attributes) {
                if (!attr.name || !attr.value) continue;
  
                const [attribute] = await Attribute.findOrCreate({
                  where: { name: attr.name },
                  transaction,
                });
  
                const [attributeValue] = await AttributeValue.findOrCreate({
                  where: { attribute_id: attribute.id, value: attr.value },
                  transaction,
                });
  
                await VariantValue.create(
                  {
                    variant_id: newVariant.id,
                    attribute_value_id: attributeValue.id,
                  },
                  { transaction }
                );
              }
            }
  
            const variants = await Variant.findAll({
              where: { product_id: newProduct.id },
              transaction,
            });
  
            if (variants.length > 0) {
              const minOriginalPrice = Math.min(...variants.map((v) => Number.parseFloat(v.original_price)));
              const minFinalPrice = Math.min(...variants.map((v) => Number.parseFloat(v.final_price)));
  
              await newProduct.update(
                {
                  original_price: minOriginalPrice,
                  final_price: minFinalPrice,
                },
                { transaction }
              );
            }
          }
  
          createdProducts.push(newProduct.id);
        }
  
        await transaction.commit();
        fs.unlinkSync(req.file.path);
  
        return res.status(200).json({
          success: true,
          message: `Successfully imported ${createdProducts.length} products`,
          data: { productIds: createdProducts },
        });
      } catch (error) {
        await transaction.rollback();
        console.error("Error importing products from Excel:", error);
        return res.status(500).json({ success: false, message: error.message });
      }
    });
  };
  

// Export products to Excel
export const exportProductsToExcel = async (req, res) => {
  try {
    const { categoryId, search } = req.query

    // Build where condition
    const whereCondition = {}
    if (categoryId) {
      whereCondition.category_id = categoryId
    }
    if (search) {
      whereCondition.name = { [Op.like]: `%${search}%` }
    }

    // Fetch products with variants and attributes
    const products = await Product.findAll({
      where: whereCondition,
      include: [
        {
          model: Variant,
          as: "variants",
          include: [
            {
              model: VariantValue,
              as: "variant_value",
              include: [
                {
                  model: AttributeValue,
                  as: "attribute_value",
                  include: [
                    {
                      model: Attribute,
                      as: "attribute",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    })

    if (!products.length) {
      return res.status(404).json({ success: false, message: "No products found" })
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Products")

    // Define columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Category ID", key: "category_id", width: 15 },
      { header: "Market ID", key: "market_id", width: 15 },
      { header: "Has Variant", key: "has_variant", width: 15 },
      { header: "SKU", key: "sku", width: 20 },
      { header: "Original Price", key: "original_price", width: 15 },
      { header: "Final Price", key: "final_price", width: 15 },
      { header: "Stock Quantity", key: "stock_quantity", width: 15 },
      { header: "Image URL", key: "image_url", width: 50 },
      { header: "Variant ID", key: "variant_id", width: 10 },
      { header: "Variant SKU", key: "variant_sku", width: 20 },
      { header: "Variant Original Price", key: "variant_original_price", width: 20 },
      { header: "Variant Final Price", key: "variant_final_price", width: 20 },
      { header: "Variant Stock Quantity", key: "variant_stock_quantity", width: 20 },
      { header: "Variant Image URL", key: "variant_image_url", width: 50 },
      { header: "Size", key: "size", width: 15 },
      { header: "Color", key: "color", width: 15 },
      { header: "Material", key: "material", width: 15 },
      { header: "Other Attributes", key: "other_attributes", width: 50 },
    ]

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    // Add product data
    products.forEach((product) => {
      const productData = {
        id: product.id,
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        market_id: product.market_id,
        has_variant: product.has_variant,
        sku: product.sku,
        original_price: product.original_price,
        final_price: product.final_price,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url,
      }

      if (!product.has_variant || product.variants.length === 0) {
        worksheet.addRow(productData)
      } else {
        // Add a row for each variant
        product.variants.forEach((variant) => {
          // Extract attributes
          const attributes = {}
          const otherAttributes = []

          variant.variant_value?.forEach((vv) => {
            if (vv.attribute_value && vv.attribute_value.attribute) {
              const attrName = vv.attribute_value.attribute.name.toLowerCase()
              const attrValue = vv.attribute_value.value

              if (attrName === "size") {
                attributes.size = attrValue
              } else if (attrName === "color") {
                attributes.color = attrValue
              } else if (attrName === "material") {
                attributes.material = attrValue
              } else {
                otherAttributes.push(`${vv.attribute_value.attribute.name}: ${attrValue}`)
              }
            }
          })

          worksheet.addRow({
            ...productData,
            variant_id: variant.id,
            variant_sku: variant.sku,
            variant_original_price: variant.original_price,
            variant_final_price: variant.final_price,
            variant_stock_quantity: variant.stock_quantity,
            variant_image_url: variant.image_url,
            size: attributes.size || "",
            color: attributes.color || "",
            material: attributes.material || "",
            other_attributes: otherAttributes.join(", "),
          })
        })
      }
    })

    // Set response headers
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename=products_export_${Date.now()}.xlsx`)

    // Write to response
    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error exporting products to Excel:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
