import { Market } from '../../models/index.js';

const getMarket = async (req, res) => {
  let result = {
    success: false,
    message: 'Could not get products',
  };
  try {
    const markets = await Market.findAll({});
    if (markets) {
      result.success = true;
      result.message = 'Get markets successfully';
      result.data = markets;
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(result);
  }
};

export { getMarket };