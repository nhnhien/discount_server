import { VNPay } from 'vnpay';

const vnpay = new VNPay({
  tmnCode: '13NYHJME',
  secureSecret: 'Z99CEX0JOHT5J8SQ233Y661OEIK3C1M2',
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: 'SHA512',
  enableLog: false,
});

export default vnpay;