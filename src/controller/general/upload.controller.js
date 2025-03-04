import { Attribute, AttributeValue, Product, sequelize, Variant, VariantValue } from '../../models/index.js';

const getProduct = async (req, res) => {
  const result = {
    success: false,
    message: 'Could not get products',
  };
  try {
    const products = await Product.findAll();
    if (products) {
      result.success = true;
      result.message = 'Get products successfully';
      result.data = products;
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(result);
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
      variants,
    } = req.body;
    console.log(name, category_id, market_id);
    if (!name || !category_id || !market_id) {
      console.log(1);
      result = {
        success: false,
        message: 'Missing required fields',
      };
      return res.send(result);
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
        stock_quantity,
      },
      { transaction }
    );
    if (has_variant && Array.isArray(variants) && variants.length > 0) {
      for (const variant of variants) {
        const { sku, original_price, final_price, stock_quantity, attributes } = variant;

        if (!sku || !Array.isArray(attributes) || attributes.length === 0) {
          result = {
            success: false,
            message: 'Invalid variant data',
          };
        }

        const newVariant = await Variant.create(
          { product_id: newProduct.id, sku, original_price, final_price, stock_quantity },
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
      ],
    });
    const formattedProduct = {
      id: createdProduct.id,
      name: createdProduct.name,
      description: createdProduct.description,
      category_id: createdProduct.category_id,
      market_id: createdProduct.market_id,
      has_variant: createdProduct.has_variant,
      original_price: createdProduct.original_price,
      final_price: createdProduct.final_price,
      stock_quantity: createdProduct.stock_quantity,
      variants: createdProduct.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        original_price: variant.original_price,
        final_price: variant.final_price,
        stock_quantity: variant.stock_quantity,
        attributes: variant.variant_value.map((vv) => ({
          attribute_id: vv.attribute_value.attribute.id,
          attribute_name: vv.attribute_value.attribute.name,
          value: vv.attribute_value.value,
        })),
      })),
    };

    result = {
      success: true,
      message: 'Product created successfully',
      data: has_variant ? formattedProduct : newProduct,
    };

    return res.status(201).json(result);
  } catch (error) {
    console.log(error);
    result = {
      success: false,
      message: 'Internal server error',
      error: error.message,
    };
    return res.status(500).json(result);
  }
};

export { getProduct, createProduct };