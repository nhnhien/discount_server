import { Address } from '../../models/index.js';
 
 export const getUserAddresses = async (req, res) => {
   try {
     const userId = req.user?.id;
 
     if (!userId) {
       return res.status(401).json({ success: false, message: 'Không tìm thấy người dùng' });
     }
 
     const addresses = await Address.findAll({
       where: { user_id: userId },
       order: [['createdAt', 'DESC']],
     });
 
     return res.status(200).json({
       success: true,
       message: 'Lấy danh sách địa chỉ thành công',
       data: addresses,
     });
   } catch (error) {
     console.error('getUserAddresses error:', error);
     return res.status(500).json({
       success: false,
       message: 'Lỗi khi lấy danh sách địa chỉ',
       error: error.message,
     });
   }
 };
 
 export const createAddress = async (req, res) => {
   try {
     const userId = req.user?.id;
     const { full_name, phone_number, address, city } = req.body;
 
     if (!full_name || !phone_number || !address || !city) {
       return res.status(400).json({
         success: false,
         message: 'Vui lòng điền đầy đủ thông tin địa chỉ',
       });
     }
 
     const newAddress = await Address.create({
       user_id: userId,
       full_name,
       phone_number,
       address,
       city,
     });
 
     return res.status(201).json({
       success: true,
       message: 'Đã thêm địa chỉ mới',
       data: newAddress,
     });
   } catch (error) {
     console.error('createAddress error:', error);
     return res.status(500).json({
       success: false,
       message: 'Lỗi khi thêm địa chỉ',
       error: error.message,
     });
   }
 };
 
 export const updateAddress = async (req, res) => {
   try {
     const userId = req.user?.id;
     const { id } = req.params;
     const { full_name, phone_number, address, city } = req.body;
 
     const existing = await Address.findOne({
       where: { id, user_id: userId },
     });
 
     if (!existing) {
       return res.status(404).json({
         success: false,
         message: 'Địa chỉ không tồn tại hoặc không thuộc về bạn',
       });
     }
 
     await existing.update({ full_name, phone_number, address, city });
 
     return res.status(200).json({
       success: true,
       message: 'Đã cập nhật địa chỉ',
       data: existing,
     });
   } catch (error) {
     console.error('updateAddress error:', error);
     return res.status(500).json({
       success: false,
       message: 'Lỗi khi cập nhật địa chỉ',
       error: error.message,
     });
   }
 };
 
 export const deleteAddress = async (req, res) => {
   try {
     const userId = req.user?.id;
     const { id } = req.params;
 
     const existing = await Address.findOne({
       where: { id, user_id: userId },
     });
 
     if (!existing) {
       return res.status(404).json({
         success: false,
         message: 'Địa chỉ không tồn tại hoặc không thuộc về bạn',
       });
     }
 
     await existing.destroy();
 
     return res.status(200).json({
       success: true,
       message: 'Đã xóa địa chỉ',
     });
   } catch (error) {
     console.error('deleteAddress error:', error);
     return res.status(500).json({
       success: false,
       message: 'Lỗi khi xóa địa chỉ',
       error: error.message,
     });
   }
 };