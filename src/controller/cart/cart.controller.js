// controllers/cartController.js
import {
  Cart,
  CartItem,
  Product,
  Variant,
  User,
  CustomPricing,
  Address,
  sequelize,
  Discount,
} from '../../models/index.js';
import { Op } from 'sequelize';
import { calculatePrice } from '../../util/calculatePrice.js';
import { ShippingFee } from '../../models/index.js';


export const getCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
    }

    const [cart] = await Cart.findOrCreate({
      where: { user_id: userId, status: 'active' },
      defaults: {
        user_id: userId,
        status: 'active',
        subtotal: 0,
        total_amount: 0,
        discount_code: null,
        applied_discount_amount: 0,
      },
    });

    const selectedItemIds = req.query.selected_item_ids
      ? req.query.selected_item_ids.split(',').map((id) => parseInt(id))
      : null;

    const shouldApplyDiscount = req.query.apply_discount === 'true' && cart.discount_code;

    let shippingAddress = null;
    if (cart.shipping_address_id) {
      shippingAddress = await Address.findByPk(cart.shipping_address_id);
    }
    
    let shippingFeeAmount = 0;
const FREE_SHIPPING_THRESHOLD = 500000;

    
    
    
    

    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.id },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'image_url', 'final_price', 'original_price', 'has_variant', 'stock_quantity'],
        },
        {
          model: Variant,
          as: 'variant',
          attributes: ['id', 'sku', 'final_price', 'original_price', 'stock_quantity', 'image_url'],
        },
      ],
    });

    const formattedItems = await Promise.all(
      cartItems.map(async (item) => {
        const productData = item.product;
        const variantData = item.variant;
        const quantity = item.quantity;

        const priceData = await calculatePrice(userId, item.product_id, item.variant_id, quantity);

        const originalUnitPrice = Number(variantData?.original_price || productData?.original_price || 0);
        const unitPrice = priceData.finalPrice;
        const totalPrice = unitPrice * quantity;

        return {
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          name: productData?.name || '',
          image: variantData?.image_url || productData?.image_url,
          sku: variantData?.sku || null,
          quantity,
          stock_quantity: variantData?.stock_quantity || productData?.stock_quantity || 0,
          unit_price: unitPrice,
          total_price: totalPrice,
          discount_amount: priceData.discountAmount * quantity,
          original_price: originalUnitPrice,
        };
      })
    );

    const selectedItems = selectedItemIds
      ? formattedItems.filter((item) => selectedItemIds.includes(item.id))
      : formattedItems;

      const subtotal = selectedItems.reduce((sum, item) => sum + item.total_price, 0);

      // Tính phí ship sau khi có subtotal
      if (shippingAddress && shippingAddress.city) {
        const shippingFeeRecord = await ShippingFee.findOne({
          where: {
            region: shippingAddress.city,
            is_active: true,
          },
        });
      
        if (shippingFeeRecord) {
          shippingFeeAmount = Number(shippingFeeRecord.fee);
        } else {
          shippingFeeAmount = 10000; // fallback mặc định
        }
      
        // Miễn phí ship nếu đủ điều kiện
        if (subtotal >= FREE_SHIPPING_THRESHOLD) {
          shippingFeeAmount = 0;
        }
      } else {
        // ❗ Nếu chưa có địa chỉ => không tính phí ship
        shippingFeeAmount = 0;
      }
    
    let totalDiscount = 0;

    if (shouldApplyDiscount) {
      const discount = await Discount.findOne({
        where: {
          discount_code: cart.discount_code,
          is_active: true,
          start_date: { [Op.lte]: new Date() },
          end_date: { [Op.or]: [{ [Op.gte]: new Date() }, { [Op.is]: null }] },
        },
        include: [
          { model: Product, as: 'products', required: false },
          { model: Variant, as: 'variants', required: false },
          { model: User, as: 'customers', required: false },
        ],
      });

      if (discount) {
        const minOrderAmount = Number(discount.min_order_amount);
        if (!isNaN(minOrderAmount) && minOrderAmount > 0 && subtotal < minOrderAmount) {
          console.log(`Không áp dụng mã vì chưa đạt min_order_amount: ${subtotal} < ${minOrderAmount}`);
        } else {
          let canApplyDiscount = true;

          if (discount.products?.length > 0) {
            const productIdsInSelection = selectedItems.map(item => item.product_id);
            const hasMatchingProduct = discount.products.some(p => productIdsInSelection.includes(p.id));
            if (!hasMatchingProduct) canApplyDiscount = false;
          }

          if (discount.variants?.length > 0) {
            const variantIdsInSelection = selectedItems.map(item => item.variant_id).filter(Boolean);
            const hasMatchingVariant = discount.variants.some(v => variantIdsInSelection.includes(v.id));
            if (!hasMatchingVariant) canApplyDiscount = false;
          }

          if (discount.customers?.length > 0) {
            const isCustomerAllowed = discount.customers.some(c => c.id === userId);
            if (!isCustomerAllowed) canApplyDiscount = false;
          }

          if (canApplyDiscount) {
            if (discount.discount_type === 'percentage') {
              totalDiscount = (subtotal * Number(discount.value)) / 100;
            } else if (discount.discount_type === 'fixed') {
              totalDiscount = Number(discount.value);
            } else if (discount.discount_type === 'free_shipping') {
              totalDiscount = Number(cart.shipping_fee || 0);
            }

            const maxDiscountAmount = Number(discount.max_discount_amount);
            if (!isNaN(maxDiscountAmount) && maxDiscountAmount > 0 && totalDiscount > maxDiscountAmount) {
              totalDiscount = maxDiscountAmount;
            }
          }
        }
      }
    } else {
      totalDiscount = 0; // ❗ KHÔNG tính lại discount ở cấp giỏ hàng nếu không có mã
    }

    const totalAmount = Math.max(subtotal - totalDiscount + shippingFeeAmount, 0);

    await cart.update({
      subtotal,
      applied_discount_amount: totalDiscount,
      shipping_fee: shippingFeeAmount,
      total_amount: totalAmount,
    });
    

    res.status(200).json({
      success: true,
      data: {
        id: cart.id,
        items: formattedItems,
        item_count: formattedItems.length,
        subtotal: subtotal,
        shipping_fee: shippingFeeAmount,
        discount_code: shouldApplyDiscount ? cart.discount_code : null,
        discount_amount: totalDiscount,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        note: cart.note,
        created_at: cart.createdAt,
      },
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin giỏ hàng',
      error: error.message,
    });
  }
};



export const addToCart = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id; 
    const { product_id, variant_id, quantity = 1 } = req.body;

    if (!product_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin sản phẩm',
      });
    }

    const product = await Product.findByPk(product_id, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại',
      });
    }


    if (quantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải lớn hơn 0',
      });
    }

    let stockQuantity;
    let variantInfo = null;

    if (product.has_variant) {
      if (!variant_id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn biến thể sản phẩm',
        });
      }

      variantInfo = await Variant.findOne({
        where: { id: variant_id, product_id },
        transaction,
      });

      if (!variantInfo) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Biến thể sản phẩm không tồn tại',
        });
      }

      stockQuantity = variantInfo.stock_quantity;
    } else {
      stockQuantity = product.stock_quantity;
    }

    if (stockQuantity < quantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Số lượng sản phẩm trong kho không đủ',
      });
    }

    const [cart, created] = await Cart.findOrCreate({
      where: { user_id: userId, status: 'active' },
      defaults: {
        user_id: userId,
        status: 'active',
        subtotal: 0,
        total_amount: 0,
        discount_code: null,
        applied_discount_amount: 0
      },
      transaction,
    });
        // Tránh tự động áp dụng mã giảm giá không phù hợp
        if (cart.discount_code) {
          await cart.update(
            {
              discount_code: null,
              applied_discount_amount: 0
            },
            { transaction }
          );
        }

    // ✅ KHÔNG áp dụng discount_code từ cart ở đây
    const priceData = await calculatePrice(userId, product_id, variant_id, quantity, {
      // appliedDiscountCode: cart.discount_code,  ← xoá dòng này để tránh tự động áp
    });

    let cartItem = await CartItem.findOne({
      where: {
        cart_id: cart.id,
        product_id,
        variant_id: variant_id || null,
      },
      transaction,
    });

    if (cartItem) {
      const newQuantity = cartItem.quantity + parseInt(quantity);

      if (stockQuantity < newQuantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Số lượng sản phẩm trong kho không đủ',
        });
      }

      await cartItem.update(
        {
          quantity: newQuantity,
          unit_price: priceData.finalPrice,
          total_price: priceData.finalPrice * newQuantity,
          discount_code: priceData.appliedRule ? `RULE-${priceData.appliedRule.id}` : null,
          discount_amount: priceData.discountAmount * newQuantity,
        },
        { transaction }
      );
    } else {
      cartItem = await CartItem.create(
        {
          cart_id: cart.id,
          product_id,
          variant_id: variant_id || null,
          quantity,
          unit_price: priceData.finalPrice,
          total_price: priceData.finalPrice * quantity,
          discount_code: priceData.appliedRule ? `RULE-${priceData.appliedRule.id}` : null,
          discount_amount: priceData.discountAmount * quantity,
        },
        { transaction }
      );
    }

    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.id },
      transaction,
    });

    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    const totalDiscount = cartItems.reduce((sum, item) => sum + parseFloat(item.discount_amount || 0), 0);

    await cart.update(
      {
        subtotal,
        applied_discount_amount: totalDiscount,
        total_amount: subtotal,
      },
      { transaction }
    );

    await transaction.commit();

 
    res.status(200).json({
      success: true,
      message: 'Đã thêm sản phẩm vào giỏ hàng',
      data: {
        cart_id: cart.id,
        item: {
          id: cartItem.id,
          product_id,
          variant_id: variant_id || null,
          quantity: cartItem.quantity,
          unit_price: priceData.finalPrice,
          original_price: priceData.originalPrice,
          total_price: cartItem.total_price,
          discount_amount: cartItem.discount_amount || 0,
          applied_rule: priceData.appliedRule
            ? {
                id: priceData.appliedRule.id,
                name: priceData.appliedRule.name,
                discount_type: priceData.appliedRule.discount_type,
                discount_value: priceData.appliedRule.discount_value,
              }
            : null,
        },
        cart_total: {
          subtotal,
          discount_amount: totalDiscount,
          total_amount: subtotal,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể thêm sản phẩm vào giỏ hàng',
      error: error.message,
    });
  }
};


export const updateCartItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { id: cart_item_id } = req.params;
    const { quantity } = req.body;

    if (!quantity && quantity !== 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp số lượng',
      });
    }

    const cart = await Cart.findOne({
      where: { user_id: userId, status: 'active' },
      transaction,
    });

    if (!cart) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng',
      });
    }

    const cartItem = await CartItem.findOne({
      where: { id: cart_item_id, cart_id: cart.id },
      include: [
        {
          model: Product,
          as: 'product',
        },
        {
          model: Variant,
          as: 'variant',
        },
      ],
      transaction,
    });

    if (!cartItem) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng',
      });
    }

    if (quantity === 0) {
      await cartItem.destroy({ transaction });
    } else {
      const stockQuantity = cartItem.variant ? cartItem.variant.stock_quantity : cartItem.product.stock_quantity;

      if (stockQuantity < quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Số lượng sản phẩm trong kho không đủ',
        });
      }

      // Lấy đơn giá mỗi sản phẩm
      const priceData = await calculatePrice(userId, cartItem.product_id, cartItem.variant_id, 1); // ⚠️ số lượng = 1

      await cartItem.update(
        {
          quantity,
          unit_price: priceData.finalPrice, // Đơn giá mỗi sản phẩm
          total_price: priceData.finalPrice * quantity, // Tổng giá = đơn giá * số lượng
          discount_code: priceData.appliedRule ? `RULE-${priceData.appliedRule.id}` : null,
          discount_amount: priceData.discountAmount * quantity, // Tổng giảm giá
        },
        { transaction }
      );
    }

    // Lấy lại tất cả các cart items để tính toán lại subtotal
    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.id },
      transaction,
    });

    // Tính subtotal một cách rõ ràng
    const subtotal = cartItems.reduce((sum, item) => {
      const itemPrice = Number(item.unit_price) * Number(item.quantity);
      return sum + itemPrice;
    }, 0);
    
    const totalDiscount = cartItems.reduce((sum, item) => sum + Number(item.discount_amount || 0), 0);

    // Loại bỏ discount code nếu cập nhật quantity
    await cart.update(
      {
        subtotal,
        applied_discount_amount: totalDiscount,
        total_amount: subtotal - (cart.discount_code ? cart.applied_discount_amount : 0),
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: quantity === 0 ? 'Đã xóa sản phẩm khỏi giỏ hàng' : 'Đã cập nhật số lượng sản phẩm',
      data: {
        cart_id: cart.id,
        subtotal,
        discount_amount: cart.applied_discount_amount || 0,
        total_amount: subtotal - (cart.applied_discount_amount || 0),
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật sản phẩm trong giỏ hàng',
      error: error.message,
    });
  }
};
export const removeFromCart = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { id: cart_item_id } = req.params;

    const cart = await Cart.findOne({
      where: { user_id: userId, status: 'active' },
      transaction,
    });

    if (!cart) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng',
      });
    }

    const cartItem = await CartItem.findOne({
      where: { id: cart_item_id, cart_id: cart.id },
      transaction,
    });

    if (!cartItem) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng',
      });
    }

    await cartItem.destroy({ transaction });

    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.id },
      transaction,
    });

    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    const totalDiscount = cartItems.reduce((sum, item) => sum + parseFloat(item.discount_amount || 0), 0);

    await cart.update(
      {
        subtotal,
        applied_discount_amount: totalDiscount,
        total_amount: subtotal,
      },
      { transaction }
    );

    await transaction.commit();
    return await getCart(req, res);

    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      data: {
        cart_id: cart.id,
        subtotal,
        discount_amount: totalDiscount,
        total_amount: subtotal,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa sản phẩm khỏi giỏ hàng',
      error: error.message,
    });
  }
};

export const clearCart = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({
      where: { user_id: userId, status: 'active' },
      transaction,
    });

    if (!cart) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng',
      });
    }

    await CartItem.destroy({
      where: { cart_id: cart.id },
      transaction,
    });
    await cart.update(
      {
        subtotal: 0,
        shipping_fee: 0,
        applied_discount_amount: 0,
        total_amount: 0,
        discount_code: null,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Đã xóa toàn bộ giỏ hàng',
      data: {
        cart_id: cart.id,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa toàn bộ giỏ hàng',
      error: error.message,
    });
  }
};


export const updateShippingInfo = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { shipping_address_id, note } = req.body;

    const cart = await Cart.findOne({
      where: { user_id: userId, status: 'active' },
      transaction,
    });

    if (!cart) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng',
      });
    }

    if (shipping_address_id) {
      const address = await Address.findOne({
        where: { id: shipping_address_id, user_id: userId },
        transaction,
      });

      if (!address) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Địa chỉ giao hàng không tồn tại',
        });
      }
    }

    const updateData = {};
    if (shipping_address_id !== undefined) {
      updateData.shipping_address_id = shipping_address_id;
    }
    if (note !== undefined) {
      updateData.note = note;
    }

    if (Object.keys(updateData).length > 0) {
      await cart.update(updateData, { transaction });
    }

    await transaction.commit();

    // ✅ Sau khi cập nhật, gọi lại getCart để trả về thông tin đầy đủ (gồm phí vận chuyển mới)
    req.query = {
      apply_discount: 'false', // mặc định không tính discount, frontend sẽ trigger lại nếu cần
    };
    await getCart(req, res);

  } catch (error) {
    await transaction.rollback();
    console.error('Error updating shipping info:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông tin giao hàng',
      error: error.message,
    });
  }
};


export const applyDiscount = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { discount_code, selected_item_ids = [] } = req.body;

    console.log("Request data:", { discount_code, selected_item_ids });

    if (!discount_code) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
    }

    const cart = await Cart.findOne({
      where: { user_id: userId, status: 'active' },
      transaction,
    });

    if (!cart) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng' });
    }

    const discount = await Discount.findOne({
      where: {
        discount_code: String(discount_code).trim(),
        start_date: { [Op.lte]: sequelize.literal('NOW()') },
        end_date: {
          [Op.or]: [
            { [Op.gte]: sequelize.literal('NOW()') },
            { [Op.is]: null }
          ]
        },
        is_active: true,
      },
      include: [
        { model: Product, as: 'products', required: false },
        { model: Variant, as: 'variants', required: false },
        { model: User, as: 'customers', required: false },
      ],
      transaction,
    });

    if (!discount) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
    }

    console.log(`Discount info:`, {
      code: discount.discount_code,
      type: discount.discount_type,
      value: discount.value,
      minOrderAmount: discount.min_order_amount,
      maxDiscountAmount: discount.max_discount_amount
    });

    // Lấy các cart items đã được chọn
    const cartItems = await CartItem.findAll({
      where: { 
        cart_id: cart.id,
        id: { [Op.in]: selected_item_ids.length > 0 ? selected_item_ids : [0] }
      },
      include: [
        { model: Product, as: 'product' },
        { model: Variant, as: 'variant' },
      ],
      transaction,
    });

    if (cartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một sản phẩm để áp dụng mã giảm giá',
      });
    }

    // Tính tổng giá trị đơn hàng một cách rõ ràng
    const itemDetails = cartItems.map(item => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const totalPrice = unitPrice * quantity;
      
      return {
        id: item.id,
        name: item.product?.name || 'Unknown',
        quantity,
        unitPrice,
        totalPrice
      };
    });

    console.log("Item Details:", JSON.stringify(itemDetails));

    // Tính tổng một cách rõ ràng
    const subtotal = itemDetails.reduce((sum, item) => sum + item.totalPrice, 0);
    console.log("Calculated Subtotal:", subtotal);

    // Kiểm tra điều kiện min_order_amount
    console.log(`Raw min_order_amount from DB: ${JSON.stringify(discount.min_order_amount)}`);
    console.log(`Type of min_order_amount: ${typeof discount.min_order_amount}`);
    
    const minOrderAmount = Number(discount.min_order_amount);
    console.log(`Converted min_order_amount: ${minOrderAmount}, isNaN: ${isNaN(minOrderAmount)}`);
    
    if (!isNaN(minOrderAmount) && minOrderAmount > 0 && subtotal < minOrderAmount) {
      console.log("Discount rejected: Order total is less than minimum requirement");
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Giá trị đơn hàng tối thiểu phải là ${minOrderAmount.toLocaleString('vi-VN')}đ (hiện tại: ${subtotal.toLocaleString('vi-VN')}đ)`,
      });
    }

    // Kiểm tra các điều kiện áp dụng discount
    let canApplyDiscount = true;
    
    if (discount.products && discount.products.length > 0) {
      const productIdsInCart = cartItems.map(item => item.product_id);
      const hasMatchingProduct = discount.products.some(p => productIdsInCart.includes(p.id));
      if (!hasMatchingProduct) {
        canApplyDiscount = false;
        console.log("Discount rejected: No matching products");
      }
    }
    
    if (discount.variants && discount.variants.length > 0) {
      const variantIdsInCart = cartItems
        .filter(item => item.variant_id)
        .map(item => item.variant_id);
      const hasMatchingVariant = discount.variants.some(v => variantIdsInCart.includes(v.id));
      if (!hasMatchingVariant) {
        canApplyDiscount = false;
        console.log("Discount rejected: No matching variants");
      }
    }
    
    if (discount.customers && discount.customers.length > 0) {
      const isCustomerAllowed = discount.customers.some(c => c.id === userId);
      if (!isCustomerAllowed) {
        canApplyDiscount = false;
        console.log("Discount rejected: Customer not allowed");
      }
    }

    if (!canApplyDiscount) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá không áp dụng cho sản phẩm nào trong giỏ hàng',
      });
    }

    // Tính giảm giá cho toàn bộ đơn hàng
    let discountAmount = 0;
    
    if (discount.discount_type === 'percentage') {
      discountAmount = (subtotal * Number(discount.value)) / 100;
      console.log(`Percentage discount: ${Number(discount.value)}% of ${subtotal} = ${discountAmount}`);
    } else if (discount.discount_type === 'fixed') {
      discountAmount = Number(discount.value);
      console.log(`Fixed discount: ${discountAmount}`);
    } else if (discount.discount_type === 'free_shipping') {
      discountAmount = Number(cart.shipping_fee || 0);
      console.log(`Free shipping discount: ${discountAmount}`);
    }
    
    // Áp dụng max_discount_amount nếu có
    const maxDiscountAmount = Number(discount.max_discount_amount);
    if (!isNaN(maxDiscountAmount) && maxDiscountAmount > 0 && discountAmount > maxDiscountAmount) {
      console.log(`Capping discount at max: ${discountAmount} -> ${maxDiscountAmount}`);
      discountAmount = maxDiscountAmount;
    }

    // Tính total_amount sau khi áp dụng giảm giá
    const totalAmount = Math.max(subtotal - discountAmount, 0);
    console.log(`Final calculations: subtotal=${subtotal}, discountAmount=${discountAmount}, totalAmount=${totalAmount}`);

    // Lưu mã giảm giá vào cart
    await cart.update(
      {
        discount_code,
        applied_discount_amount: discountAmount,
        subtotal: subtotal, // ⚠️ Cập nhật lại subtotal trong cart
        total_amount: totalAmount,
      },
      { transaction }
    );

    await transaction.commit();

    // Lấy thông tin cart mới nhất
    const updatedCart = await Cart.findOne({
      where: { id: cart.id },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            { model: Product, as: 'product' },
            { model: Variant, as: 'variant' },
          ],
        },
        {
          model: Address,
          as: 'shipping_address',
        },
      ],
    });

    const formattedItems = updatedCart.items.map(item => {
      const productData = item.product;
      const variantData = item.variant;
      
      return {
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: productData?.name || '',
        image: variantData?.image_url || productData?.image_url,
        sku: variantData?.sku || null,
        quantity: item.quantity,
        stock_quantity: variantData?.stock_quantity || productData?.stock_quantity || 0,
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.total_price),
        discount_amount: parseFloat(item.discount_amount || 0),
        original_price: parseFloat(variantData?.original_price || productData?.original_price || 0),
      };
    });

    res.status(200).json({
      success: true,
      message: 'Đã áp dụng mã giảm giá',
      data: {
        id: updatedCart.id,
        items: formattedItems,
        item_count: formattedItems.length,
        subtotal: subtotal, // ⚠️ Sử dụng subtotal đã được tính lại
        shipping_fee: parseFloat(updatedCart.shipping_fee || 0),
        discount_code: updatedCart.discount_code,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        shipping_address: updatedCart.shipping_address,
        note: updatedCart.note,
        created_at: updatedCart.createdAt,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error applying discount:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể áp dụng mã giảm giá',
      error: error.message,
    });
  }
};


export const removeDiscount = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { selected_item_ids = [] } = req.body;

    const cart = await Cart.findOne({
      where: { user_id: userId, status: 'active' },
      transaction,
    });

    if (!cart) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng',
      });
    }

    // Gỡ mã và cập nhật tổng tiền lại
    await cart.update(
      {
        discount_code: null,
        applied_discount_amount: 0,
      },
      { transaction }
    );

    await transaction.commit();

    // Gắn lại selected_item_ids để `getCart` tính lại chính xác
    req.query.apply_discount = 'false';
    req.query.selected_item_ids = selected_item_ids.join(',');

    return await getCart(req, res);
  } catch (error) {
    await transaction.rollback();
    console.error('Error removing discount:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể hủy mã giảm giá',
      error: error.message,
    });
  }
};


export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  updateShippingInfo,
  applyDiscount,
  removeDiscount,
};