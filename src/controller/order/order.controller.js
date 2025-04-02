import { Op } from 'sequelize';
import { Order, User, Address, Product, Variant, Delivery, OrderItem, Discount, sequelize } from '../../models/index.js';

export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, payment_status, start_date, end_date, search } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (payment_status) {
      whereClause.payment_status = payment_status;
    }

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    } else if (start_date) {
      whereClause.created_at = {
        [Op.gte]: new Date(start_date),
      };
    } else if (end_date) {
      whereClause.created_at = {
        [Op.lte]: new Date(end_date),
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } },
        { '$customer.name$': { [Op.like]: `%${search}%` } },
        { '$customer.email$': { [Op.like]: `%${search}%` } },
        { '$customer.phone$': { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows: orders, count } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'customer',
          required: !!search,
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'image_url'],
            },
            {
              model: Variant,
              attributes: ['id', 'sku', 'image_url'],
            },
          ],
        },
        {
          model: Discount,
          attributes: ['id', 'discount_code', 'discount_type', 'value'],
        },
        {
          model: Address,
          as: 'shippingAddress',
          attributes: ['id', 'full_name', 'address', 'city', 'phone_number'],
        },
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'status', 'tracking_number', 'carrier', 'shipped_at', 'delivered_at'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: orders,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error in getOrders:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn hàng',
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'image_url', 'description'],
            },
            {
              model: Variant,
              attributes: ['id', 'sku', 'image_url'],
            },
          ],
        },
        {
          model: Discount,
          attributes: ['id', 'discount_code', 'discount_type', 'value', 'description'],
        },
        {
          model: Address,
          as: 'billingAddress',
          attributes: ['id', 'full_name', 'address', 'city', 'phone_number'],
        },
        {
          model: Address,
          as: 'shippingAddress',
          attributes: ['id', 'full_name', 'address', 'city', 'phone_number'],
        },
        {
          model: Delivery,
          as: 'delivery',
          attributes: [
            'id',
            'status',
            'tracking_number',
            'carrier',
            'shipped_at',
            'delivered_at',
            'estimated_delivery',
            'shipping_method',
            'notes',
          ],
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    console.error('Error in getOrderById:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đơn hàng',
      error: error.message,
    });
  }
};

export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, shipping_address_id, billing_address_id, discount_code, payment_method, notes } = req.body;
  
    const user_id = req.user.id;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ít nhất một sản phẩm trong đơn hàng',
      });
    }

    if (!shipping_address_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ giao hàng',
      });
    }
    const shippingAddress = await Address.findOne({
      where: {
        id: shipping_address_id,
        user_id: user_id,
      },
    });

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Địa chỉ giao hàng không tồn tại hoặc không thuộc về bạn',
      });
    }
    let billingAddressId = billing_address_id;
    if (!billingAddressId) {
      billingAddressId = shipping_address_id;
    } else {
      const billingAddress = await Address.findOne({
        where: {
          id: billingAddressId,
          user_id: user_id,
        },
      });

      if (!billingAddress) {
        return res.status(404).json({
          success: false,
          message: 'Địa chỉ thanh toán không tồn tại hoặc không thuộc về bạn',
        });
      }
    }
    let discount = null;
    let discountAmount = 0;

    if (discount_code) {
      discount = await Discount.findOne({
        where: {
          discount_code,
          is_active: true,
          start_date: { [Op.lte]: new Date() },
          end_date: { [Op.or]: [{ [Op.gte]: new Date() }, { [Op.is]: null }] },
        },
        include: [
          { model: Product, as: 'products', through: { attributes: [] } },
          { model: Variant, as: 'variants', through: { attributes: [] } },
          { model: User, as: 'customers', through: { attributes: [] } },
        ],
      });

      if (!discount) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn',
        });
      }
      if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá đã hết lượt sử dụng',
        });
      }
      if (discount.customers && discount.customers.length > 0 && !discount.customers.some((u) => u.id === user_id)) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá không áp dụng cho tài khoản của bạn',
        });
      }
    }

    let subtotal = 0;
    let taxAmount = 0;
    let shippingFee = 0;
    const orderItems = [];
    for (const item of items) {
      const { product_id, variant_id, quantity } = item;

      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin sản phẩm không hợp lệ',
        });
      }
      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm với ID: ${product_id}`,
        });
      }

      let variantData = null;
      let unitPrice = 0;
      let originalPrice = 0;
      let sku = product.sku || '';
      let itemName = product.name;
      let variantName = '';
      if (variant_id) {
        variantData = await Variant.findOne({
          where: {
            id: variant_id,
            product_id,
          },
        });

        if (!variantData) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy biến thể với ID: ${variant_id} cho sản phẩm này`,
          });
        }
        if (variantData.stock_quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Số lượng yêu cầu (${quantity}) vượt quá số lượng tồn kho (${variantData.stock_quantity}) của biến thể`,
          });
        }

        unitPrice = variantData.final_price;
        originalPrice = variantData.original_price;
        sku = variantData.sku;
        variantName = variantData.name || '';
      } else {
        if (product.stock_quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Số lượng yêu cầu (${quantity}) vượt quá số lượng tồn kho (${product.stock_quantity}) của sản phẩm`,
          });
        }

        unitPrice = product.final_price;
        originalPrice = product.original_price;
      }
      const itemSubtotal = unitPrice * quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        product_id,
        variant_id,
        quantity,
        unit_price: unitPrice,
        original_price: originalPrice,
        subtotal: itemSubtotal,
        product_name: itemName,
        variant_name: variantName,
        sku,
        item_discount: 0,
      });
    }
    if (discount) {
      switch (discount.discount_type) {
        case 'percentage':
          discountAmount = (subtotal * discount.value) / 100;
          break;
        case 'fixed':
          discountAmount = discount.value;
          break;
        case 'free_shipping':
          discountAmount = shippingFee;
          shippingFee = 0;
          break;
      }
      if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
        discountAmount = discount.max_discount_amount;
      }
      if (discount.min_order_amount && subtotal < discount.min_order_amount) {
        return res.status(400).json({
          success: false,
          message: `Giá trị đơn hàng tối thiểu để sử dụng mã giảm giá là ${discount.min_order_amount}`,
        });
      }
      if (discount.products && discount.products.length > 0) {
        const discountProductIds = discount.products.map((p) => p.id);
        const orderProductIds = orderItems.map((item) => item.product_id);
        if (!orderProductIds.some((id) => discountProductIds.includes(id))) {
          return res.status(400).json({
            success: false,
            message: 'Mã giảm giá không áp dụng cho sản phẩm nào trong đơn hàng',
          });
        }
        if (discount.discount_type !== 'free_shipping') {
          discountAmount = 0;

          orderItems.forEach((item) => {
            if (discountProductIds.includes(item.product_id)) {
              let itemDiscount = 0;

              switch (discount.discount_type) {
                case 'percentage':
                  itemDiscount = (item.subtotal * discount.value) / 100;
                  break;
                case 'fixed':
                  const eligibleItems = orderItems.filter((i) => discountProductIds.includes(i.product_id));
                  const totalEligibleAmount = eligibleItems.reduce((sum, i) => sum + i.subtotal, 0);
                  itemDiscount = discount.value * (item.subtotal / totalEligibleAmount);
                  break;
              }

              item.item_discount = itemDiscount;
              discountAmount += itemDiscount;
            }
          });
        }
      }
      //   if (discount.variants && discount.variants.length > 0) {

      //   }
    }

    let totalAmount = subtotal + taxAmount + shippingFee - discountAmount;
    if (totalAmount < 0) totalAmount = 0;
    const orderNumber = `ORD-${Date.now()}`;
    const order = await Order.create(
      {
        order_number: orderNumber,
        user_id,
        status: 'pending',
        total_amount: totalAmount,
        subtotal,
        shipping_fee: shippingFee,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        discount_id: discount ? discount.id : null,
        payment_method: payment_method || 'cod',
        payment_status: 'pending',
        billing_address_id: billingAddressId,
        shipping_address_id,
        notes,
      },
      { transaction }
    );
    for (const item of orderItems) {
      await OrderItem.create(
        {
          ...item,
          order_id: order.id,
        },
        { transaction }
      );
    }
    for (const item of items) {
      const { product_id, variant_id, quantity } = item;

      if (variant_id) {
        await Variant.decrement({ stock_quantity: quantity }, { where: { id: variant_id }, transaction });
      } else {
        await Product.decrement({ stock_quantity: quantity }, { where: { id: product_id }, transaction });
      }
    }
    if (discount) {
      await discount.increment('usage_count', { transaction });
    }
    await Delivery.create(
      {
        order_id: order.id,
        status: 'preparing',
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      { transaction }
    );

    await transaction.commit();

    // Truy vấn lại order để trả về kết quả chi tiết
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, attributes: ['id', 'name', 'image_url'] },
            { model: Variant, attributes: ['id', 'sku', 'image_url'] },
          ],
        },
        { model: Discount, attributes: ['id', 'discount_code', 'discount_type', 'value'] },
        {
          model: Address,
          as: 'shippingAddress',
          attributes: ['id', 'full_name', 'address', 'city', 'phone_number'],
        },
        {
          model: Delivery,
          as: 'delivery', // ✅ FIXED: thêm alias đúng
        },
      ],
    });
  
    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: createdOrder,
    });
  
  } catch (error) {
    // ✅ Rollback nếu transaction chưa hoàn tất
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
  
    console.error('Error in createOrder:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn hàng',
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái mới',
      });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }
    const validStatusTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: [],
    };

    if (!validStatusTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái '${order.status}' sang '${status}'`,
      });
    }
    await order.update(
      {
        status,
        notes: notes ? (order.notes ? `${order.notes}\n\n${notes}` : notes) : order.notes,
        updated_by: req.user.id,
      },
      { transaction }
    );
    const delivery = await Delivery.findOne({ where: { order_id: id } });

    if (delivery) {
      const deliveryUpdates = {
        updated_by: req.user.id,
      };

      if (status === 'shipped') {
        deliveryUpdates.status = 'shipped';
        deliveryUpdates.shipped_at = new Date();
      } else if (status === 'delivered') {
        deliveryUpdates.status = 'delivered';
        deliveryUpdates.delivered_at = new Date();
      } else if (status === 'cancelled') {
        deliveryUpdates.status = 'failed';
      }

      if (Object.keys(deliveryUpdates).length > 1) {
        await delivery.update(deliveryUpdates, { transaction });
      }
    }
    if (status === 'cancelled' || status === 'refunded') {
      const orderItems = await OrderItem.findAll({
        where: { order_id: id },
        include: [{ model: Product }, { model: Variant }],
      });

      for (const item of orderItems) {
        if (item.variant_id) {
          await Variant.increment({ stock_quantity: item.quantity }, { where: { id: item.variant_id }, transaction });
        } else {
          await Product.increment({ stock_quantity: item.quantity }, { where: { id: item.product_id }, transaction });
        }
      }
    }

    await transaction.commit();
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, attributes: ['id', 'name'] },
            { model: Variant, attributes: ['id', 'sku'] },
          ],
        },
        { model: Delivery,
          as: 'delivery',
         },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: updatedOrder,
    });
  } catch (error) {
    try {
      if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError.message);
    }
  
    console.error('Error in updateOrderStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái đơn hàng',
      error: error.message,
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, transaction_id, payment_date, notes } = req.body;

    if (!payment_status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái thanh toán',
      });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }
    await order.update({
      payment_status,
      payment_transaction_id: transaction_id,
      payment_date: payment_date ? new Date(payment_date) : null,
      notes: notes ? (order.notes ? `${order.notes}\n\n${notes}` : notes) : order.notes,
      updated_by: req.user.id,
    });
    if (payment_status === 'paid' && order.status === 'pending') {
      await order.update({
        status: 'confirmed',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thanh toán thành công',
      data: order,
    });
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin thanh toán',
      error: error.message,
    });
  }
};

export const updateDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { tracking_number, carrier, status, shipped_at, estimated_delivery, shipping_method, notes } = req.body;
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này',
      });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    let delivery = await Delivery.findOne({ where: { order_id: id } });

    if (!delivery) {
      delivery = await Delivery.create({
        order_id: id,
        tracking_number,
        carrier,
        status: status || 'preparing',
        shipped_at: shipped_at ? new Date(shipped_at) : null,
        estimated_delivery: estimated_delivery ? new Date(estimated_delivery) : null,
        shipping_method,
        notes,
        updated_by: req.user.id,
      });
    } else {
      await delivery.update({
        tracking_number: tracking_number || delivery.tracking_number,
        carrier: carrier || delivery.carrier,
        status: status || delivery.status,
        shipped_at: shipped_at ? new Date(shipped_at) : delivery.shipped_at,
        estimated_delivery: estimated_delivery ? new Date(estimated_delivery) : delivery.estimated_delivery,
        shipping_method: shipping_method || delivery.shipping_method,
        notes: notes ? (delivery.notes ? `${delivery.notes}\n\n${notes}` : notes) : delivery.notes,
        updated_by: req.user.id,
      });
    }
    if (status) {
      let orderStatus = order.status;

      if (status === 'shipped' && ['pending', 'confirmed', 'processing'].includes(order.status)) {
        orderStatus = 'shipped';
      } else if (status === 'delivered' && order.status !== 'delivered') {
        orderStatus = 'delivered';
      } else if (status === 'failed' && order.status !== 'cancelled') {
        orderStatus = 'cancelled';
      }

      if (orderStatus !== order.status) {
        await order.update({
          status: orderStatus,
          updated_by: req.user.id,
        });
      }
    }
    const updatedDelivery = await Delivery.findOne({
      where: { order_id: id },
      include: [{ model: Order }],
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin giao hàng thành công',
      data: updatedDelivery,
    });
  } catch (error) {
    console.error('Error in updateDelivery:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin giao hàng',
      error: error.message,
    });
  }
};

export const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng ở trạng thái này',
      });
    }
    await order.update(
      {
        status: 'cancelled',
        notes: reason ? (order.notes ? `${order.notes}\n\nLý do hủy: ${reason}` : `Lý do hủy: ${reason}`) : order.notes,
        updated_by: req.user.id,
      },
      { transaction }
    );
    const delivery = await Delivery.findOne({ where: { order_id: id } });
    if (delivery) {
      await delivery.update(
        {
          status: 'failed',
          notes: reason
            ? delivery.notes
              ? `${delivery.notes}\n\nLý do hủy: ${reason}`
              : `Lý do hủy: ${reason}`
            : delivery.notes,
          updated_by: req.user.id,
        },
        { transaction }
      );
    }
    const orderItems = await OrderItem.findAll({
      where: { order_id: id },
    });

    for (const item of orderItems) {
      if (item.variant_id) {
        await Variant.increment({ stock_quantity: item.quantity }, { where: { id: item.variant_id }, transaction });
      } else {
        await Product.increment({ stock_quantity: item.quantity }, { where: { id: item.product_id }, transaction });
      }
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: { id, status: 'cancelled' },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in cancelOrder:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy đơn hàng',
      error: error.message,
    });
  }
};

export const getOrderStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const dateFilter = {};
    if (start_date && end_date) {
      dateFilter.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    } else if (start_date) {
      dateFilter.created_at = {
        [Op.gte]: new Date(start_date),
      };
    } else if (end_date) {
      dateFilter.created_at = {
        [Op.lte]: new Date(end_date),
      };
    }

    const ordersByStatus = await Order.findAll({
      where: dateFilter,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
      ],
      group: ['status'],
    });
    const ordersByPayment = await Order.findAll({
      where: dateFilter,
      attributes: [
        'payment_method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
      ],
      group: ['payment_method'],
    });
    const totalRevenue = await Order.sum('total_amount', {
      where: {
        ...dateFilter,
        status: { [Op.in]: ['delivered', 'shipped'] },
      },
    });
    const dailyRevenue = await Order.findAll({
      where: {
        ...dateFilter,
        status: { [Op.in]: ['delivered', 'shipped'] },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
    });
    const topProducts = await OrderItem.findAll({
      attributes: [
        'product_id',
        'product_name',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'total_revenue'],
      ],
      include: [
        {
          model: Order,
          where: {
            ...dateFilter,
            status: { [Op.in]: ['delivered', 'shipped', 'processing'] },
          },
          attributes: [],
        },
      ],
      group: ['product_id'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 10,
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê đơn hàng thành công',
      data: {
        orders_by_status: ordersByStatus,
        orders_by_payment: ordersByPayment,
        total_revenue: totalRevenue || 0,
        daily_revenue: dailyRevenue,
        top_products: topProducts,
      },
    });
  } catch (error) {
    console.error('Error in getOrderStatistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê đơn hàng',
      error: error.message,
    });
  }
};

export default {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  updateDelivery,
};