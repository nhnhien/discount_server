// File: src/service/scraper.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';
import UserAgent from 'user-agents';

// Tạo danh sách User-Agent để luân phiên
const generateRandomUserAgent = () => {
  const userAgent = new UserAgent();
  return userAgent.toString();
};

// Danh sách proxy miễn phí (cần thay thế bằng proxy thực tế hoặc dịch vụ proxy)
const proxyList = [
  // Placeholder - thay thế bằng proxy thực tế
  // 'http://username:password@proxy.example.com:8080',
];

// Lấy proxy ngẫu nhiên
const getRandomProxy = () => {
  if (proxyList.length === 0) return null;
  return proxyList[Math.floor(Math.random() * proxyList.length)];
};

// Tạo axios client với proxy và user-agent ngẫu nhiên
const createAxiosClient = () => {
  const config = {
    headers: {
      'User-Agent': generateRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
    },
    timeout: 10000,
  };

  const proxy = getRandomProxy();
  if (proxy) {
    config.httpsAgent = new HttpsProxyAgent(proxy);
    config.proxy = false; // Disable axios's default proxy handling
  }

  return axios.create(config);
};

// Rate limiting để tránh bị chặn
const rateLimiter = {
  // Lưu thời gian request gần nhất cho từng domain
  lastRequestTime: {},
  // Khoảng thời gian tối thiểu giữa các request (ms)
  minDelay: {
    'shopee.vn': 1000,    // 1 giây
    'tiki.vn': 1500,      // 1.5 giây
    'lazada.vn': 2000,    // 2 giây
    'amazon.com': 2000,   // 2 giây
    'ebay.com': 2000,     // 2 giây
    'default': 1000       // Mặc định
  },
  
  // Kiểm tra và đợi nếu cần
  async checkAndWait(domain) {
    const now = Date.now();
    const delay = this.minDelay[domain] || this.minDelay.default;
    const lastTime = this.lastRequestTime[domain] || 0;
    const elapsed = now - lastTime;
    
    if (elapsed < delay) {
      const waitTime = delay - elapsed;
      console.log(`Rate limiting: Waiting ${waitTime}ms for ${domain}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime[domain] = Date.now();
  }
};

// ===== TIKI SCRAPER =====
export const searchTikiProducts = async (keyword, limit = 10) => {
  try {
    const domain = 'tiki.vn';
    await rateLimiter.checkAndWait(domain);
    
    console.log(`🔍 Đang tìm kiếm trên Tiki: "${keyword}"`);
    
    // Sử dụng Tiki API
    const apiUrl = 'https://tiki.vn/api/v2/products';
    const params = {
      q: keyword,
      limit,
      page: 1,
      sort: 'top_seller'
    };
    
    const client = createAxiosClient();
    const response = await client.get(apiUrl, { 
      params,
      headers: {
        'Referer': `https://tiki.vn/search?q=${encodeURIComponent(keyword)}`
      }
    });
    
    if (response.data && response.data.data) {
      // API trả về kết quả
      return response.data.data.map(item => ({
        id: item.id,
        title: item.name,
        price: item.price,
        url: item.url_path.startsWith('http') 
          ? item.url_path 
          : `https://tiki.vn/${item.url_path}`,
        image: item.thumbnail_url,
        shop_name: item.seller_name || 'Tiki Trading',
        rating: item.rating_average || 0,
        source: 'tiki',
        country: 'VN',
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching Tiki products:', error);
    
    // Fallback: HTML scraping
    try {
      const searchUrl = `https://tiki.vn/search?q=${encodeURIComponent(keyword)}`;
      const client = createAxiosClient();
      const response = await client.get(searchUrl);
      
      const $ = cheerio.load(response.data);
      const products = [];
      
      // Định vị các product card trên Tiki
      $('.product-item').each((i, el) => {
        if (i >= limit) return false;
        
        try {
          const productElem = $(el);
          const link = productElem.find('a').attr('href');
          const title = productElem.find('.name').text().trim();
          const price = parseFloat(productElem.find('.price-discount__price').text().replace(/[^\d]/g, ''));
          const image = productElem.find('.thumbnail img').attr('src');
          const seller = productElem.find('.seller-name').text().trim();
          const rating = parseFloat(productElem.find('.rating__average').text()) || 0;
          
          // Trích xuất ID từ URL
          const idMatch = link.match(/p(\d+)/);
          const id = idMatch ? idMatch[1] : '';
          
          // Chỉ lấy URL trực tiếp đến sản phẩm
          if (link && !link.includes('/search?')) {
            products.push({
              id,
              title,
              price,
              url: link.startsWith('http') ? link : `https://tiki.vn${link}`,
              image,
              shop_name: seller || 'Tiki Seller',
              rating,
              source: 'tiki',
              country: 'VN',
            });
          }
        } catch (parseError) {
          console.error('Error parsing Tiki product element:', parseError);
        }
      });
      
      return products;
    } catch (fallbackError) {
      console.error('Tiki fallback scraping failed:', fallbackError);
      return [];
    }
  }
};

// ===== AMAZON SCRAPER =====
export const searchAmazonProducts = async (keyword, limit = 5) => {
  try {
    const domain = 'amazon.com';
    await rateLimiter.checkAndWait(domain);

    console.log(`🔍 Đang tìm kiếm trên Amazon: "${keyword}"`);

    const searchUrl = 'https://www.amazon.com/s';
    const params = { k: keyword, ref: 'nb_sb_noss', page: 1 };

    const client = createAxiosClient();
    const response = await client.get(searchUrl, {
      params,
      headers: {
        'Referer': 'https://www.amazon.com/',
      },
    });

    const $ = cheerio.load(response.data);
    const products = [];

    // CAPTCHA fallback check
    if ($('form[action="/errors/validateCaptcha"]').length > 0) {
      console.warn('⚠️ Amazon CAPTCHA detected. Dùng mock data.');
      return getMockAmazonProducts(keyword, limit);
    }

    $('.s-main-slot .s-result-item[data-asin]').each((i, el) => {
      if (products.length >= limit) return false;

      const asin = $(el).attr('data-asin');
      const title = $(el).find('h2 a span').text().trim();
      const urlPath = $(el).find('h2 a').attr('href');
      const image = $(el).find('img.s-image').attr('src');

      const priceWhole = $(el).find('.a-price .a-price-whole').first().text().replace(/[^\d]/g, '');
      const priceFraction = $(el).find('.a-price .a-price-fraction').first().text().replace(/[^\d]/g, '');
      const price = priceWhole && priceFraction ? parseFloat(`${priceWhole}.${priceFraction}`) * 25000 : null;

      const ratingText = $(el).find('.a-icon-alt').first().text();
      const rating = ratingText ? parseFloat(ratingText) : 0;

      if (asin && title && price && urlPath) {
        products.push({
          id: asin,
          title,
          price,
          url: `https://www.amazon.com${urlPath}`,
          image,
          shop_name: 'Amazon',
          rating,
          source: 'amazon',
          country: 'US',
        });
      }
    });

    if (products.length === 0) {
      console.warn('⚠️ Không tìm thấy sản phẩm nào trên Amazon. Dùng mock data.');
      return getMockAmazonProducts(keyword, limit);
    }

    return products;
  } catch (error) {
    console.error(`❌ Lỗi tìm kiếm trên Amazon: ${error.message}`);
    return getMockAmazonProducts(keyword, limit);
  }
};



// ===== EBAY SCRAPER =====
export const searchEbayProducts = async (keyword, limit = 5) => {
  try {
    const domain = 'ebay.com';
    await rateLimiter.checkAndWait(domain);

    console.log(`🔍 Đang tìm kiếm trên eBay: "${keyword}"`);

    const searchUrl = 'https://www.ebay.com/sch/i.html';
    const params = {
      _nkw: keyword,
      _sacat: 0,
      LH_TitleDesc: 1,
    };

    const client = createAxiosClient();
    const response = await client.get(searchUrl, {
      params,
      headers: {
        'Referer': 'https://www.ebay.com/',
      },
    });

    const $ = cheerio.load(response.data);
    const products = [];

    $('.s-item').each((i, el) => {
      if (products.length >= limit) return false;

      const title = $(el).find('.s-item__title').text().trim();
      const url = $(el).find('.s-item__link').attr('href');
      let image = $(el).find('.s-item__image-img').attr('src');
      if (!image || image.includes('1x1.gif')) {
        // Fallback: thử lấy từ data-src hoặc các nguồn khác
        image = $(el).find('.s-item__image-img').attr('data-src') 
             || $(el).find('.s-item__image-img').attr('data-image') 
             || $(el).find('img').attr('src');
      }
      
            const priceText = $(el).find('.s-item__price').text();
      const ratingText = $(el).find('.x-star-rating span.clipped').text();

      let price = null;
      if (priceText) {
        // Check if price is in VND (₫ or VND), skip conversion
        const isVND = priceText.includes('₫') || priceText.toLowerCase().includes('vnd');
        const rawPrice = parseFloat(priceText.replace(/[^\d.]/g, ''));
      
        price = isVND ? rawPrice : rawPrice * 25000;
      }
            const rating = parseFloat(ratingText) || 0;

      if (title && url && price) {
        console.log(`[eBay] 🖼️ Hình ảnh: ${image}`);
        products.push({
          id: url.match(/itm\/(\d+)/)?.[1] || `ebay-${i}`,
          title,
          price,
          url,
          image,
          shop_name: 'eBay Seller',
          rating,
          source: 'ebay',
          country: 'US',
        });
      }
      
    });

    return products;
  } catch (error) {
    console.error(`❌ Lỗi tìm kiếm trên eBay: ${error.message}`);
    return [];
  }
};


// ===== SEARCH ALL MARKETPLACES =====
export const searchAllMarketplaces = async (keyword, options = {}) => {
  const { 
    tiki = true,
    amazon = true,
    ebay = true,
    limit = 5
  } = options;
  
  console.log(`🔍 Đang tìm kiếm trên tất cả các sàn: "${keyword}" (limit: ${limit})`);
  
  const tasks = [];
  const results = { tiki: [], amazon: [], ebay: [] };
  
  try {
    // Sử dụng Promise.allSettled để tránh một sàn lỗi ảnh hưởng các sàn khác
    if (tiki) tasks.push(searchTikiProducts(keyword, limit).then(data => results.tiki = data).catch(err => {
      console.error(`❌ Lỗi khi tìm Tiki: ${err.message}`);
      results.tiki = [];
    }));
    
    if (amazon) tasks.push(searchAmazonProducts(keyword, limit).then(data => results.amazon = data).catch(err => {
      console.error(`❌ Lỗi khi tìm Amazon: ${err.message}`);
      results.amazon = [];
    }));
    
    if (ebay) tasks.push(searchEbayProducts(keyword, limit).then(data => results.ebay = data).catch(err => {
      console.error(`❌ Lỗi khi tìm eBay: ${err.message}`);
      results.ebay = [];
    }));
    
    await Promise.all(tasks);
    
    console.log(`✅ Kết quả tìm kiếm từ tất cả các sàn:`, {
      tiki: results.tiki.length,
      amazon: results.amazon.length,
      ebay: results.ebay.length
    });
    
    // Gộp kết quả từ tất cả các sàn
    return [...results.tiki, ...results.amazon, ...results.ebay];
  } catch (error) {
    console.error(`❌ Lỗi tổng thể khi tìm kiếm tất cả sàn: ${error.message}`);
    
    // Trả về những gì đã có, dù có lỗi
    return [...results.tiki, ...results.amazon, ...results.ebay];
  }
};

// Hàm tìm kiếm sản phẩm theo SKU (sẽ chỉ dùng để so sánh sau khi tìm theo tên)
export const findProductBySku = async (sku, options = {}) => {
  try {
    // ⚠️ KHÔNG dùng sku làm keyword tìm kiếm nữa
    const { productName } = options;

    if (!productName) {
      console.error('Thiếu productName trong options khi gọi findProductBySku');
      return null;
    }

    // Tìm kiếm bằng tên sản phẩm thay vì SKU
    const allProducts = await searchAllMarketplaces(productName, options);

    // So sánh theo độ tương đồng với SKU nếu cần
    if (allProducts.length > 0) {
      const exactMatch = allProducts.find(p =>
        p.title?.toLowerCase().includes(sku.toLowerCase())
      );
      return exactMatch || allProducts[0];
    }

    return null;
  } catch (error) {
    console.error('Error finding product by SKU:', error);
    return null;
  }
};


// Hàm helper cho mock data Amazon
function getMockAmazonProducts(keyword, limit) {
  const keywordLower = keyword.toLowerCase();
  const products = [];
  
  if (keywordLower.includes('gym') || keywordLower.includes('sport') || 
      keywordLower.includes('shirt') || keywordLower.includes('tshirt')) {
    products.push(
      {
        id: 'B08C4Z8VKB',
        title: `Amazon Essentials Men's Tech Stretch Short-Sleeve T-Shirt`,
        price: 12.90 * 25000,
        url: 'https://www.amazon.com/Amazon-Essentials-Short-Sleeve-T-Shirt-Heather/dp/B08C4Z8VKB',
        image: 'https://m.media-amazon.com/images/I/71RDMJlfHsL._AC_UL320_.jpg',
        shop_name: 'Amazon Essentials',
        rating: 4.4,
        source: 'amazon',
        country: 'US',
      },
      {
        id: 'B07QXMB2RJ',
        title: `Under Armour Men's Tech 2.0 Short-Sleeve T-Shirt`,
        price: 22.50 * 25000,
        url: 'https://www.amazon.com/Under-Armour-Tech-Short-Sleeve-Academy/dp/B07QXMB2RJ',
        image: 'https://m.media-amazon.com/images/I/71lz0yfJ-iL._AC_UL320_.jpg',
        shop_name: 'Under Armour',
        rating: 4.7,
        source: 'amazon',
        country: 'US',
      },
      {
        id: 'B08FMKXZZJ',
        title: `Nike Men's Dri-FIT Training T-Shirt`,
        price: 30.00 * 25000,
        url: 'https://www.amazon.com/NIKE-Legend-Short-Sleeve-T-Shirt/dp/B08FMKXZZJ',
        image: 'https://m.media-amazon.com/images/I/61LtuGz5IVL._AC_UL320_.jpg',
        shop_name: 'Nike',
        rating: 4.6,
        source: 'amazon',
        country: 'US',
      }
    );
  } else if (keywordLower.includes('phone') || keywordLower.includes('smartphone')) {
    products.push(
      {
        id: 'B0CHX3QBFR',
        title: `Apple iPhone 15 (128 GB) - Black`,
        price: 799.00 * 25000,
        url: 'https://www.amazon.com/Apple-iPhone-15-128GB-Black/dp/B0CHX3QBFR',
        image: 'https://m.media-amazon.com/images/I/71657TiFeHL._AC_UL320_.jpg',
        shop_name: 'Apple',
        rating: 4.7,
        source: 'amazon',
        country: 'US',
      }
    );
  }
  
  return products.slice(0, limit);
}

// Hàm helper cho mock data eBay
function getMockEbayProducts(keyword, limit) {
  const keywordLower = keyword.toLowerCase();
  const products = [];
  
  if (keywordLower.includes('gym') || keywordLower.includes('sport') || 
      keywordLower.includes('shirt') || keywordLower.includes('tshirt')) {
    products.push(
      {
        id: '255059370694',
        title: `Men's Gym T-Shirt Quick Dry Running Sports Workout Tee Athletic Training Top`,
        price: 11.99 * 25000,
        url: 'https://www.ebay.com/itm/255059370694',
        image: 'https://i.ebayimg.com/thumbs/images/g/Aq4AAOSwfzJitvEE/s-l300.jpg',
        shop_name: 'sportswear_outlet',
        rating: 4.8,
        source: 'ebay',
        country: 'US',
      },
      {
        id: '266789531559',
        title: `Men's UA Tech 2.0 Short Sleeve T-Shirt - Under Armour Athletic Gym Training Tee`,
        price: 19.95 * 25000,
        url: 'https://www.ebay.com/itm/266789531559',
        image: 'https://i.ebayimg.com/thumbs/images/g/UUYAAOSwaAlkXSG5/s-l300.jpg',
        shop_name: 'underfive_sports',
        rating: 4.9,
        source: 'ebay',
        country: 'US',
      }
    );
  }
  
  return products.slice(0, limit);
}

export default {
  searchTikiProducts,
  searchAmazonProducts,
  searchEbayProducts,
  searchAllMarketplaces,
  findProductBySku
};