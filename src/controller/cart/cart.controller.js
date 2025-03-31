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
  
  const calculatePrice = async (userId, productId, variantId = null, transaction = null) => {
    let product, variant, originalPrice, finalPrice;
    let appliedRule = null;
  
    if (variantId) {
      variant = await Variant.findByPk(variantId, { transaction });
      if (!variant) throw new Error('Variant not found');
  
      originalPrice = variant.original_price;
      finalPrice = variant.final_price;
  
      const variantPricingRules = await CustomPricing.findAll({
        include: [
          { model: User, as: 'customers', where: { id: userId }, required: false },
          { model: Variant, as: 'variants', where: { id: variantId }, required: false },
        ],
        transaction,
      });
  
      let maxDiscount = 0;
      variantPricingRules.forEach((rule) => {
        if (rule.variants.some((v) => v.id === variantId)) {
          let discount = 0;
  
          if (rule.discount_type === 'percentage') {
            discount = (rule.discount_value / 100) * originalPrice;
          } else if (rule.discount_type === 'fixed') {
            discount = rule.discount_value;
          }
  
          if (discount > maxDiscount) {
            maxDiscount = discount;
            appliedRule = rule;
          }
        }
      });
  
      if (maxDiscount > 0) {
        finalPrice = Math.max(originalPrice - maxDiscount, 0);
      }
    } else {
      product = await Product.findByPk(productId, { transaction });
      if (!product) throw new Error('Product not found');
  
      originalPrice = product.original_price;
      finalPrice = product.final_price;
      const productPricingRules = await CustomPricing.findAll({
        include: [
          { model: User, as: 'customers', where: { id: userId }, required: false },
          { model: Product, as: 'products', where: { id: productId }, required: false },
        ],
        transaction,
      });
  
      let maxDiscount = 0;
      productPricingRules.forEach((rule) => {
        if (rule.products.some((p) => p.id === productId)) {
          let discount = 0;
  
          if (rule.discount_type === 'percentage') {
            discount = (rule.discount_value / 100) * originalPrice;
          } else if (rule.discount_type === 'fixed') {
            discount = rule.discount_value;
          }
  
          if (discount > maxDiscount) {
            maxDiscount = discount;
            appliedRule = rule;
          }
        }
      });
  
      if (maxDiscount > 0) {
        finalPrice = Math.max(originalPrice - maxDiscount, 0);
      }
    }
  
    return {
      originalPrice,
      finalPrice,
      discountAmount: originalPrice - finalPrice,
      appliedRule,
    };
  };
  
  export const getCart = async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
      }
            const [cart, created] = await Cart.findOrCreate({
        where: { user_id: userId, status: 'active' },
        defaults: {
          user_id: userId,
          status: 'active',
          subtotal: 0,
          total_amount: 0,
        },
      });
  
      let shippingAddress = null;
      if (cart.shipping_address_id) {
        shippingAddress = await Address.findByPk(cart.shipping_address_id);
      }
  
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
  
      const formattedItems = cartItems.map((item) => {
        const productData = item.product;
        const variantData = item.variant;
  
        return {
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          name: productData.name,
          image: variantData ? variantData.image_url : productData.image_url,
          sku: variantData ? variantData.sku : null,
          quantity: item.quantity,
          stock_quantity: variantData ? variantData.stock_quantity : productData.stock_quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          discount_code: item.discount_code,
          discount_amount: item.discount_amount || 0,
        };
      });
  
      res.status(200).json({
        success: true,
        data: {
          id: cart.id,
          items: formattedItems,
          item_count: cartItems.length,
          subtotal: cart.subtotal,
          shipping_fee: cart.shipping_fee || 0,
          discount_amount: cart.applied_discount_amount || 0,
          total_amount: cart.total_amount,
          shipping_address: shippingAddress,
          note: cart.note,
          created_at: cart.created_at,
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
      const userId = req.body.user.id;
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
      const priceData = await calculatePrice(userId, product_id, variant_id, transaction);
  
      const [cart, created] = await Cart.findOrCreate({
        where: { user_id: userId, status: 'active' },
        defaults: {
          user_id: userId,
          status: 'active',
          subtotal: 0,
          total_amount: 0,
        },
        transaction,
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
  
        const priceData = await calculatePrice(userId, cartItem.product_id, cartItem.variant_id, transaction);
  
        await cartItem.update(
          {
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
        message: quantity === 0 ? 'Đã xóa sản phẩm khỏi giỏ hàng' : 'Đã cập nhật số lượng sản phẩm',
        data: {
          cart_id: cart.id,
          subtotal,
          discount_amount: totalDiscount,
          total_amount: subtotal,
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
  
      res.status(200).json({
        success: true,
        message: 'Đã cập nhật thông tin giao hàng',
        data: {
          cart_id: cart.id,
          shipping_address_id: cart.shipping_address_id,
          note: cart.note,
        },
      });
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
      const { discount_code } = req.body;
  
      if (!discount_code) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mã giảm giá',
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
  
      const discount = await Discount.findOne({
        where: {
          discount_code: discount_code,
          start_date: { [Op.lte]: new Date() },
          end_date: { [Op.or]: [{ [Op.gte]: new Date() }, { [Op.is]: null }] },
          is_active: true,
        },
        transaction,
      });
  
      if (!discount) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn',
        });
      }
  
      if (discount.min_order_value && cart.subtotal < discount.min_order_value) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Giá trị đơn hàng tối thiểu phải là ${discount.min_order_value.toLocaleString('vi-VN')} VND`,
        });
      }
  
      let discountAmount = 0;
      if (discount.discount_type === 'percentage') {
        discountAmount = (discount.value / 100) * cart.subtotal;
        if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
          discountAmount = discount.max_discount_amount;
        }
      } else if (discount.discount_type === 'fixed') {
        discountAmount = discount.value;
      }
  
      await cart.update(
        {
          discount_code: discount_code,
          applied_discount_amount: discountAmount,
          total_amount: cart.subtotal - discountAmount,
        },
        { transaction }
      );
  
      await transaction.commit();
  
      res.status(200).json({
        success: true,
        message: 'Đã áp dụng mã giảm giá',
        data: {
          cart_id: cart.id,
          discount_code: discount_code,
          discount_amount: discountAmount,
          subtotal: cart.subtotal,
          total_amount: cart.subtotal - discountAmount,
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
  
      await cart.update(
        {
          discount_code: null,
          applied_discount_amount: 0,
          total_amount: cart.subtotal,
        },
        { transaction }
      );
  
      await transaction.commit();
  
      res.status(200).json({
        success: true,
        message: 'Đã hủy mã giảm giá',
        data: {
          cart_id: cart.id,
          subtotal: cart.subtotal,
          total_amount: cart.subtotal,
        },
      });
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
  