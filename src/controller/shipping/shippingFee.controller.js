import { ShippingFee } from '../../models/index.js';

export const getAllShippingFees = async (req, res) => {
  try {
    const fees = await ShippingFee.findAll({ order: [['created_at', 'DESC']] });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách phí vận chuyển', error: error.message });
  }
};

export const getShippingFeeById = async (req, res) => {
  try {
    const fee = await ShippingFee.findByPk(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Không tìm thấy phí vận chuyển' });
    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy phí vận chuyển', error: error.message });
  }
};

export const createShippingFee = async (req, res) => {
  try {
    const fee = await ShippingFee.create(req.body);
    res.status(201).json(fee);
  } catch (error) {
    res.status(400).json({ message: 'Không thể tạo phí vận chuyển', error: error.message });
  }
};

export const updateShippingFee = async (req, res) => {
  try {
    const fee = await ShippingFee.findByPk(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Không tìm thấy phí vận chuyển' });
    await fee.update(req.body);
    res.json(fee);
  } catch (error) {
    res.status(400).json({ message: 'Không thể cập nhật phí vận chuyển', error: error.message });
  }
};

export const deleteShippingFee = async (req, res) => {
  try {
    const fee = await ShippingFee.findByPk(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Không tìm thấy phí vận chuyển' });
    await fee.destroy();
    res.json({ message: 'Đã xoá phí vận chuyển' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xoá phí vận chuyển', error: error.message });
  }
};

export const toggleShippingFee = async (req, res) => {
  try {
    const { is_active } = req.body;
    const fee = await ShippingFee.findByPk(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Không tìm thấy phí vận chuyển' });
    await fee.update({ is_active });
    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái', error: error.message });
  }
};
