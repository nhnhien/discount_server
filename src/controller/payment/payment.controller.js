import vnpay from '../../config/vnpay.config.js';
import { ProductCode, VnpLocale, dateFormat } from 'vnpay';
import { Payment, Order } from '../../models/index.js';

// Cập nhật trạng thái thanh toán
const updatePaymentStatus = async (paymentId, status, txnRef, amount, responseCode) => {
  try {
    await Payment.update(
      {
        status,
        txn_ref: txnRef,
        amount: parseInt(amount),
        response_code: responseCode,
      },
      { where: { id: paymentId } }
    );
  } catch (err) {
    console.error('[VNPay] Lỗi updatePaymentStatus:', err);
  }
};

// Khởi tạo thanh toán mới
const processPayment = async (req, res) => {
  const { orderId } = req.body; // ❌ KHÔNG nhận totalAmount từ client

  try {
    const order = await Order.findByPk(orderId);

    if (!order || order.payment_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng không hợp lệ hoặc đã thanh toán',
      });
    }

    const totalAmount = parseFloat(order.total_amount); // ✅ lấy từ DB, đã tính sẵn giá đã giảm
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Tổng tiền đơn hàng không hợp lệ',
      });
    }

    // Tạo bản ghi Payment nếu chưa có
    const [payment] = await Payment.findOrCreate({
      where: { order_id: orderId },
      defaults: { status: 'pending' },
    });

    const now = new Date();
    const expireDate = new Date(now.getTime() + 10 * 60 * 1000); // 10 phút

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: Math.round(totalAmount),
      vnp_TxnRef: orderId.toString(),
      vnp_OrderInfo: `Thanh toán đơn hàng #${orderId}`,
      vnp_IpAddr: req.ip || req.connection.remoteAddress,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `${process.env.BACKEND_URL}/api/payment/vnpay-return`,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(now),
      vnp_ExpireDate: dateFormat(expireDate),
    });

    return res.status(200).json({
      success: true,
      paymentUrl,
    });
  } catch (err) {
    console.error('[VNPay] Lỗi khi tạo thanh toán:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo thanh toán',
      error: err.message,
    });
  }
};


// Xử lý callback từ VNPay (redirect backend)
const handleVnpayCallback = async (req, res) => {
  const { vnp_ResponseCode, vnp_TxnRef, vnp_SecureHash, vnp_Amount } = req.query;

  try {
    const isValid = vnpay.verifyReturnUrl(req.query, vnp_SecureHash);
    if (!isValid) {
      return res.redirect(`${process.env.CLIENT_URL}/order-failed?reason=invalid_hash`);
    }

    const orderId = parseInt(vnp_TxnRef, 10);
    const payment = await Payment.findOne({ where: { order_id: orderId } });

    if (!payment) {
      return res.redirect(`${process.env.CLIENT_URL}/order-failed?reason=payment_not_found`);
    }

    const actualAmount = parseInt(vnp_Amount) / 100;

    if (vnp_ResponseCode === '00') {
      await updatePaymentStatus(payment.id, 'completed', vnp_TxnRef, actualAmount, vnp_ResponseCode);
      await Order.update({ payment_status: 'paid', status: 'confirmed' }, { where: { id: orderId } });
      return res.redirect(`${process.env.CLIENT_URL}/order-success/${orderId}`);
    } else if (vnp_ResponseCode === '24') {
      await updatePaymentStatus(payment.id, 'cancelled', vnp_TxnRef, actualAmount, vnp_ResponseCode);
      return res.redirect(`${process.env.CLIENT_URL}/order-failed?reason=cancelled`);
    } else {
      await updatePaymentStatus(payment.id, 'failed', vnp_TxnRef, actualAmount, vnp_ResponseCode);
      return res.redirect(`${process.env.CLIENT_URL}/order-failed?reason=failed`);
    }
  } catch (err) {
    console.error('[VNPay] Callback error:', err);
    return res.redirect(`${process.env.CLIENT_URL}/order-failed?reason=server_error`);
  }
};

// Thanh toán lại
const repayment = async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findByPk(orderId);

    if (!order || order.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã thanh toán hoặc không hợp lệ',
      });
    }

    const totalAmount = parseFloat(order.total_amount);
    console.log('[VNPay] Chi tiết đơn hàng:', {
      orderId: orderId,
      subtotal: parseFloat(order.subtotal),
      shippingFee: parseFloat(order.shipping_fee),
      discount: parseFloat(order.discount_amount),
      totalAmount: totalAmount
    });
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Tổng tiền đơn hàng không hợp lệ',
      });
    }

    const payment = await Payment.findOne({ where: { order_id: orderId } });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi thanh toán',
      });
    }

    await payment.update({ status: 'pending' });

    const now = new Date();
    const expireDate = new Date(now.getTime() + 10 * 60 * 1000); // 10 phút

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: Math.round(totalAmount * 100),
      vnp_TxnRef: orderId.toString(),
      vnp_OrderInfo: `Thanh toán lại đơn hàng #${orderId}`,
      vnp_IpAddr: req.ip || req.connection.remoteAddress,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `${process.env.BACKEND_URL}/api/payment/vnpay-return`,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(now),
      vnp_ExpireDate: dateFormat(expireDate),
    });
    console.log('[VNPay] totalAmount:', totalAmount);

    return res.status(200).json({
      success: true,
      paymentUrl,
    });
  } catch (err) {
    console.error('[VNPay] Lỗi tạo lại thanh toán:', err);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo lại thanh toán',
      error: err.message,
    });
  }
};


export { processPayment, handleVnpayCallback, repayment };