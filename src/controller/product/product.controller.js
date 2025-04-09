import {
  Attribute,
  AttributeValue,
  Category,
  CustomPricing,
  Product,
  sequelize,
  User,
  Variant,
  VariantValue,
} from '../../models/index.js';
import { Op, fn, col, where } from 'sequelize'; 
import { calculatePrice } from '../../util/calculatePrice.js';

const formatProduct = (product) => {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category_id: product.category_id,
    market_id: product.market_id,
    has_variant: product.has_variant,
    sku: product.sku || '',
    original_price: product.original_price,
    final_price: product.final_price,
    stock_quantity: product.stock_quantity,
    image_url: product.image_url,
    appliedRule: product.appliedRule, // ✅ THÊM DÒNG NÀY
    variants:
      product.variants?.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        original_price: variant.original_price,
        final_price: variant.final_price,
        stock_quantity: variant.stock_quantity,
        image_url: variant.image_url,
        attributes: variant.variant_value?.map((vv) => ({
          attribute_id: vv.attribute_value?.attribute?.id,
          attribute_name: vv.attribute_value?.attribute?.name,
          value: vv.attribute_value?.value,
        })),
        appliedRule: variant.appliedRule, // ✅ THÊM DÒNG NÀY (nếu cần cho biến thể)
      })) || [],
  };
};

const productIncludeOptions = [
  {
    model: Variant,
    as: 'variants',
    include: [
      {
        model: VariantValue,
        as: 'variant_value',
        include: [
          {
            model: AttributeValue,
            as: 'attribute_value',
            include: [
              {
                model: Attribute,
                as: 'attribute',
              },
            ],
          },
        ],
      },
    ],
  },
];

const getProduct = async (req, res) => {
  const { page = 1, limit = 10, search, categoryId, discount } = req.query;
  const userId = req.query.userId ? Number(req.query.userId) : req.user?.id || null;
  console.log('>>> req.user:', req.user);

  try {
    const whereCondition = {};
    if (search?.trim()) {
      const normalizedSearch = search.trim().toLowerCase();
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${normalizedSearch}%` } },
        where(fn('LOWER', col('category.name')), {
          [Op.like]: `%${normalizedSearch}%`
        }),
      ];
    }
    
    if (categoryId) {
      whereCondition.category_id = categoryId;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
          required: true,
        },
        ...productIncludeOptions
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    if (!products.length) {
      return res.status(404).json({ success: false, message: 'No products found' });
    }

    let updatedProducts = await Promise.all(
      products.map(async (product) => {
        const productJSON = product.toJSON();
        const mainResult = await calculatePrice(userId, product.id, null, 1, { applyQuantityBreak: false });
        productJSON.original_price = mainResult.originalPrice;
        productJSON.final_price = mainResult.finalPrice;
        productJSON.appliedRule = mainResult.appliedRule;

        if (productJSON.has_variant && Array.isArray(productJSON.variants)) {
          for (const variant of productJSON.variants) {
            const variantResult = await calculatePrice(userId, product.id, variant.id, 1, { applyQuantityBreak: false });
            variant.original_price = variantResult.originalPrice;
            variant.final_price = variantResult.finalPrice;
            variant.appliedRule = variantResult.appliedRule;
          }
        }

        const formattedProduct = formatProduct(productJSON);

        return {
          ...formattedProduct,
          discountPercentage: 0,
          // 👇 Convert Sequelize instance to plain object
          appliedRule: productJSON.appliedRule ? productJSON.appliedRule.toJSON?.() ?? productJSON.appliedRule : null,
        };
      })
    );

    // 👇 Lọc chính xác theo discount (sau khi đã convert appliedRule)
    if (discount === 'true') {
      updatedProducts = updatedProducts.filter(p => p.appliedRule);
    } else if (discount === 'false') {
      updatedProducts = updatedProducts.filter(p => !p.appliedRule);
    }

    return res.status(200).json({
      success: true,
      message: 'Get products successfully',
      data: updatedProducts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error in getProduct:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId ? Number(req.query.userId) : req.user?.id || null;

    const product = await Product.findOne({
      where: { id },
      include: productIncludeOptions,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productJSON = product.toJSON();
    let computedOriginalPrice = productJSON.original_price;
    let computedFinalPrice = productJSON.final_price;

    if (productJSON.has_variant && Array.isArray(productJSON.variants)) {
      const variantOriginals = productJSON.variants.map(v => Number(v.original_price)).filter(n => !isNaN(n));
      const variantFinals = productJSON.variants.map(v => Number(v.final_price)).filter(n => !isNaN(n));

      if (variantOriginals.length > 0) computedOriginalPrice = Math.min(...variantOriginals);
      if (variantFinals.length > 0) computedFinalPrice = Math.min(...variantFinals);
    }

    const mainResult = await calculatePrice(userId, product.id, null, 1, { applyQuantityBreak: false });
    productJSON.original_price = mainResult.originalPrice;
    productJSON.final_price = mainResult.finalPrice;
    productJSON.appliedRule = mainResult.appliedRule;
    
    if (productJSON.has_variant && Array.isArray(productJSON.variants)) {
      for (const variant of productJSON.variants) {
        const variantResult = await calculatePrice(userId, product.id, variant.id, 1, { applyQuantityBreak: false });
        variant.original_price = variantResult.originalPrice;
        variant.final_price = variantResult.finalPrice;
        variant.appliedRule = variantResult.appliedRule;
      }
    }
    
    const formattedProduct = formatProduct(productJSON);
    

    return res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: formattedProduct,
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};




const createProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      description,
      category_id,
      market_id,
      has_variant,
      sku,
      original_price,
      final_price,
      stock_quantity,
      image_url,
      variants,
    } = req.body;

    if (!name || !category_id || !market_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Kiểm tra SKU trùng nếu sản phẩm không có biến thể
    if (!has_variant && sku) {
      const existingSkuInProduct = await Product.findOne({ where: { sku }, transaction });
      const existingSkuInVariant = await Variant.findOne({ where: { sku }, transaction });

      if (existingSkuInProduct || existingSkuInVariant) {
        return res.status(400).json({ success: false, message: `SKU "${sku}" đã tồn tại` });
      }
    }

    // Kiểm tra SKU trùng nếu sản phẩm có biến thể
    if (has_variant && Array.isArray(variants)) {
      for (const variant of variants) {
        const existingSkuInProduct = await Product.findOne({ where: { sku: variant.sku }, transaction });
        const existingSkuInVariant = await Variant.findOne({ where: { sku: variant.sku }, transaction });

        if (existingSkuInProduct || existingSkuInVariant) {
          return res.status(400).json({ success: false, message: `SKU "${variant.sku}" đã tồn tại` });
        }
      }
    }

    // Tạo sản phẩm
    const newProduct = await Product.create({
      name,
      description,
      category_id,
      market_id,
      has_variant,
      sku: has_variant ? null : sku,
      original_price: has_variant ? null : original_price,
      final_price: has_variant ? null : final_price,
      stock_quantity: has_variant ? null : stock_quantity,
      image_url,
    }, { transaction });

    // Nếu có biến thể thì tạo
    if (has_variant && Array.isArray(variants)) {
      for (const variant of variants) {
        const { sku, original_price, final_price, stock_quantity, attributes, image_url: variantImage } = variant;

        const newVariant = await Variant.create({
          product_id: newProduct.id,
          sku,
          original_price,
          final_price,
          stock_quantity,
          image_url: variantImage || null,
        }, { transaction });

        for (const attr of attributes) {
          const { name, value } = attr;
          let [attribute] = await Attribute.findOrCreate({ where: { name }, transaction });
          let [attributeValue] = await AttributeValue.findOrCreate({
            where: { attribute_id: attribute.id, value },
            transaction,
          });

          await VariantValue.create({ variant_id: newVariant.id, attribute_value_id: attributeValue.id }, { transaction });
        }
      }

      // Cập nhật giá từ biến thể
      const validVariants = variants.filter(v =>
        typeof v.original_price === 'number' && typeof v.final_price === 'number'
      );
      const minOriginalPrice = Math.min(...validVariants.map(v => v.original_price));
      const minFinalPrice = Math.min(...validVariants.map(v => v.final_price));

      await newProduct.update({ original_price: minOriginalPrice, final_price: minFinalPrice }, { transaction });
    }

    await transaction.commit();

    const createdProduct = await Product.findOne({
      where: { id: newProduct.id },
      include: productIncludeOptions,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: formatProduct(createdProduct),
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createProduct:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


const updateProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      name,
      description,
      category_id,
      market_id,
      has_variant,
      sku,
      original_price,
      final_price,
      stock_quantity,
      image_url,
      variants,
      change_reason,
    } = req.body;

    const product = await Product.findByPk(id, { transaction });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Kiểm tra SKU nếu sản phẩm không có biến thể
    if (!has_variant && sku) {
      const duplicateInProduct = await Product.findOne({ where: { sku, id: { [Op.ne]: id } }, transaction });
      const duplicateInVariant = await Variant.findOne({ where: { sku }, transaction });

      if (duplicateInProduct || duplicateInVariant) {
        return res.status(400).json({ success: false, message: `SKU "${sku}" đã tồn tại` });
      }
    }

    // Kiểm tra SKU trong các biến thể mới
    if (has_variant && Array.isArray(variants)) {
      for (const variant of variants) {
        if (!variant.sku) continue;

        const existingVariant = await Variant.findOne({
          where: { sku: variant.sku },
          transaction,
        });

        const variantBelongsToCurrent = existingVariant?.product_id === Number(id);

        if (existingVariant && !variantBelongsToCurrent) {
          return res.status(400).json({ success: false, message: `SKU "${variant.sku}" đã tồn tại` });
        }

        const duplicateInProduct = await Product.findOne({
          where: { sku: variant.sku },
          transaction,
        });

        if (duplicateInProduct) {
          return res.status(400).json({ success: false, message: `SKU "${variant.sku}" đã tồn tại trong sản phẩm khác` });
        }
      }
    }

    const priceChanged =
      (original_price !== undefined && original_price !== product.original_price) ||
      (final_price !== undefined && final_price !== product.final_price);

    await product.update({
      name,
      description,
      category_id,
      market_id,
      has_variant,
      sku: has_variant ? null : sku,
      original_price,
      final_price,
      stock_quantity: has_variant ? null : stock_quantity,
      image_url,
    }, {
      transaction,
      user: req.user,
      change_reason: change_reason || (priceChanged ? 'Cập nhật giá' : 'Cập nhật thông tin'),
    });

    // Update biến thể
    if (has_variant && Array.isArray(variants)) {
      for (const variant of variants) {
        const { sku, original_price, final_price, stock_quantity, attributes, image_url: variantImage } = variant;

        const existingVariant = await Variant.findOne({ where: { product_id: id, sku }, transaction });

        if (existingVariant) {
          await existingVariant.update({
            original_price,
            final_price,
            stock_quantity,
            image_url: variantImage ?? existingVariant.image_url,
          }, { transaction });

          await VariantValue.destroy({ where: { variant_id: existingVariant.id }, transaction });

          for (const attr of attributes) {
            const { name, value } = attr;
            let [attribute] = await Attribute.findOrCreate({ where: { name }, transaction });
            let [attributeValue] = await AttributeValue.findOrCreate({
              where: { attribute_id: attribute.id, value },
              transaction,
            });

            await VariantValue.create({
              variant_id: existingVariant.id,
              attribute_value_id: attributeValue.id,
            }, { transaction });
          }
        } else {
          const newVariant = await Variant.create({
            product_id: id,
            sku,
            original_price,
            final_price,
            stock_quantity,
            image_url: variantImage || null,
          }, { transaction });

          for (const attr of attributes) {
            const { name, value } = attr;
            let [attribute] = await Attribute.findOrCreate({ where: { name }, transaction });
            let [attributeValue] = await AttributeValue.findOrCreate({
              where: { attribute_id: attribute.id, value },
              transaction,
            });

            await VariantValue.create({
              variant_id: newVariant.id,
              attribute_value_id: attributeValue.id,
            }, { transaction });
          }
        }
      }
    }

    await transaction.commit();

    const updatedProduct = await Product.findOne({
      where: { id },
      include: productIncludeOptions,
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: formatProduct(updatedProduct),
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateProduct:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await Variant.destroy({ where: { product_id: id }, transaction });

    await product.destroy({ transaction });

    await transaction.commit();
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in deleteProduct:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};


export { getProduct, getProductById, createProduct, updateProduct, deleteProduct };