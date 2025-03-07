import { Attribute, AttributeValue, Product, sequelize, Variant, VariantValue } from '../../models/index.js';

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
  const result = {
    success: false,
    message: 'Could not get products',
  };
  try {
    const products = await Product.findAll({
        include: productIncludeOptions,
    });    
    if (products) {
      result.success = true;
      result.message = 'Get products successfully';
      result.data = products.map(formatProduct);
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(result);
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
  } = req.body;

  const product = await Product.findByPk(id, { include: productIncludeOptions });

  if (!product) {
    await transaction.rollback();
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

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
    { transaction }
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
        { transaction }
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