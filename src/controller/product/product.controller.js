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
const formatProduct = (product) => {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category_id: product.category_id,
    market_id: product.market_id,
    has_variant: product.has_variant,
    original_price: product.original_price,
    final_price: product.final_price,
    stock_quantity: product.stock_quantity,
    image_url: product.image_url,
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
  const { userId, page = 1, limit = 10, search, categoryId } = req.query;
  console.log('🚀 ~ getProduct ~ categoryId:', categoryId);
  try {
    const whereCondition = {};
    if (search) {
      whereCondition.name = { [Op.iLike]: `%${search}%` };
    }
    if (categoryId) {
      whereCondition.category_id = categoryId;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereCondition,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }, ...productIncludeOptions],
      limit: parseInt(limit),
      offset: offset,
    });
    if (!products.length) {
      return res.status(404).json({ success: false, message: 'No products found' });
    }

    let pricingRules = [];
    if (userId) {
      pricingRules = await CustomPricing.findAll({
        include: [
          { model: User, as: 'customers', where: { id: userId }, required: false },
          { model: Product, as: 'products', required: false },
        ],
      });
    }
    const updatedProducts = products.map((product) => {
      let bestRule = null;
      let maxDiscount = 0;

      pricingRules.forEach((rule) => {
        if (rule.products.some((p) => p.id === product.id)) {
          let discount = 0;
          if (rule.discount_type === 'percentage') {
            discount = (rule.discount_value / 100) * product.original_price;
          } else if (rule.discount_type === 'fixed') {
            discount = rule.discount_value;
          }

          if (discount > maxDiscount) {
            maxDiscount = discount;
            bestRule = rule;
          }
        }
      });

      const formattedProduct = formatProduct({
        ...product.toJSON(),
        original_price: product.original_price,
        final_price: Math.max(product.original_price - maxDiscount, 0),
      });

      return {
        ...formattedProduct,
        discountPercentage: bestRule ? bestRule.discount_value : 0,
        appliedRule: bestRule
          ? {
              id: bestRule.id,
              name: bestRule.name,
              discount_type: bestRule.discount_type,
              discount_value: bestRule.discount_value,
              start_date: bestRule.start_date,
              end_date: bestRule.end_date,
            }
          : null,
      };
    });

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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id },
      include: productIncludeOptions,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res
      .status(200)
      .json({ success: true, message: 'Product retrieved successfully', data: formatProduct(product) });
  } catch (error) {
    console.error('Error in getProductById:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

const createProduct = async (req, res) => {
  let result = {
    success: false,
    message: 'Could not create product',
  };
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      description,
      category_id,
      market_id,
      has_variant,
      original_price,
      final_price,
      stock_quantity,
      image_url,
      variants,
    } = req.body;

    if (!name || !category_id || !market_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const newProduct = await Product.create(
      {
        name,
        description,
        category_id,
        market_id,
        has_variant,
        original_price,
        final_price,
        stock_quantity: has_variant ? null : stock_quantity,
        image_url,
      },
      { transaction }
    );
    if (has_variant && Array.isArray(variants) && variants.length > 0) {
      for (const variant of variants) {
        const { sku, original_price, final_price, stock_quantity, attributes, image_url: variantImage } = variant;

        if (!sku || !Array.isArray(attributes) || attributes.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Invalid variant data' });
        }

        const newVariant = await Variant.create(
          {
            product_id: newProduct.id,
            sku,
            original_price,
            final_price,
            stock_quantity,
            image_url: variantImage || null,
          },
          { transaction }
        );

        for (const attr of attributes) {
          const { name, value } = attr;
          let [attribute] = await Attribute.findOrCreate({
            where: { name },
            transaction,
          });

          let [attributeValue] = await AttributeValue.findOrCreate({
            where: { attribute_id: attribute.id, value },
            transaction,
          });
          await VariantValue.create(
            { variant_id: newVariant.id, attribute_value_id: attributeValue.id },
            { transaction }
          );
        }
      }
    }
    await transaction.commit();
    const createdProduct = await Product.findOne({
      where: { id: newProduct.id },
      include: [
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
                  include: [{ model: Attribute, as: 'attribute' }],
                },
              ],
            },
          ],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: formatProduct(createdProduct),
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
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
      original_price,
      final_price,
      stock_quantity,
      image_url,
      variants,
      change_reason,
    } = req.body;

    const product = await Product.findByPk(id, { include: productIncludeOptions });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const priceChanged =
       (original_price !== undefined && original_price !== product.original_price) ||
       (final_price !== undefined && final_price !== product.final_price);
 
    await product.update(
      {
        name: name ?? product.name,
        description: description ?? product.description,
        category_id: category_id ?? product.category_id,
        market_id: market_id ?? product.market_id,
        has_variant: has_variant ?? product.has_variant,
        original_price: original_price ?? product.original_price,
        final_price: final_price ?? product.final_price,
        stock_quantity: has_variant ? null : stock_quantity ?? product.stock_quantity,
        image_url: image_url ?? product.image_url,
      },
      {
        transaction,
        user: req.user,
        change_reason: change_reason || (priceChanged ? 'Cập nhật giá sản phẩm' : 'Cập nhật thông tin sản phẩm'),
      }
    );

    if (has_variant && Array.isArray(variants)) {
      await Variant.destroy({ where: { product_id: id }, transaction });

      for (const variant of variants) {
        const { sku, original_price, final_price, stock_quantity, attributes, image_url: variantImage } = variant;

        if (!sku || !Array.isArray(attributes) || attributes.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Invalid variant data' });
        }

        const newVariant = await Variant.create(
          {
            product_id: id,
            sku,
            original_price,
            final_price,
            stock_quantity,
            image_url: variantImage || null,
          },
          {
            transaction,
            user: req.user,
            change_reason: change_reason || 'Tạo biến thể mới',
          }
        );

        for (const attr of attributes) {
          const { name, value } = attr;
          let [attribute] = await Attribute.findOrCreate({ where: { name }, transaction });
          let [attributeValue] = await AttributeValue.findOrCreate({
            where: { attribute_id: attribute.id, value },
            transaction,
          });

          await VariantValue.create(
            { variant_id: newVariant.id, attribute_value_id: attributeValue.id },
            { transaction }
          );
        }
      }
    }

    await transaction.commit();

    const updatedProduct = await Product.findOne({ where: { id }, include: productIncludeOptions });

    return res
      .status(200)
      .json({ success: true, message: 'Product updated successfully', data: formatProduct(updatedProduct) });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateProduct:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
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
