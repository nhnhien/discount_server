import { Product, Variant, ProductComparison } from '../../models/index.js';
import { Op } from 'sequelize';
import scraperService from '../../service/scraper.js';
import { calculatePrice } from '../../util/calculatePrice.js';

// Helper function to save comparison data to database
const saveComparisonData = async (productId, variantId, ourPrice, comparisonData) => {
  try {
    if (!comparisonData || !comparisonData.length) return;
    
    // Delete existing comparison data for this product/variant
    await ProductComparison.destroy({
      where: {
        product_id: productId,
        variant_id: variantId || null,
      }
    });
    
    // Create new comparison records
    const records = comparisonData.map(item => ({
      product_id: productId,
      variant_id: variantId || null,
      marketplace: item.source,
      external_product_id: item.id || null,
      external_product_name: item.title,
      external_product_url: item.url || null,
      external_product_image: item.image || null,
      external_price: item.price,
      our_price: ourPrice,
      price_difference: item.price_difference,
      price_difference_percentage: item.price_difference_percentage,
      is_cheaper: item.is_cheaper,
      external_rating: item.rating || null,
      sku: item.sku || null,
      external_model_id: item.model_id || null,
      country: item.country || 'VN',
    }));
    
    await ProductComparison.bulkCreate(records);
  } catch (error) {
    console.error('Error saving comparison data:', error);
    // Don't throw the error, just log it - we don't want to break the main flow
  }
};

export const getHistoricalComparisons = async (req, res) => {
  try {
    const { product_id, variant_id, days = 30 } = req.params;
    
    // Calculate date range (for the past X days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Query for historical data
    const historicalData = await ProductComparison.findAll({
      where: {
        product_id,
        variant_id: variant_id || null,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['created_at', 'DESC']],
    });
    
    // Group by date and marketplace for easier visualization
    const groupedData = historicalData.reduce((acc, item) => {
      const date = item.created_at.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!acc[date]) {
        acc[date] = {};
      }
      
      if (!acc[date][item.marketplace]) {
        acc[date][item.marketplace] = [];
      }
      
      acc[date][item.marketplace].push(item);
      
      return acc;
    }, {});
    
    return res.status(200).json({
      success: true,
      message: 'Historical comparison data retrieved successfully',
      data: {
        raw: historicalData,
        grouped: groupedData
      }
    });
  } catch (error) {
    console.error('Error in getHistoricalComparisons:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving historical comparison data',
      error: error.message
    });
  }
};

export const getProductComparison = async (req, res) => {
  try {
    const { product_id, variant_id } = req.params;
    const userId = req.query.userId ? Number(req.query.userId) : req.user?.id || null;

    let product, productName, sku, imageUrl, ourPrice;

    if (variant_id) {
      const variant = await Variant.findOne({
        where: { id: variant_id, product_id },
        include: [{ model: Product, as: 'product' }],
      });

      if (!variant) {
        return res.status(404).json({ success: false, message: 'Variant not found' });
      }

      product = variant.product;
      productName = `${product.name} ${variant.name || ''}`.trim();
      sku = variant.sku || product.sku;
      imageUrl = variant.image_url || product.image_url;

      const { finalPrice } = await calculatePrice(userId, product.id, variant.id, 1, { applyQuantityBreak: false });
      ourPrice = finalPrice;
    } else {
      product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      productName = product.name;
      sku = product.sku;
      imageUrl = product.image_url;

      const { finalPrice } = await calculatePrice(userId, product.id, null, 1, { applyQuantityBreak: false });
      ourPrice = finalPrice;
    }

    console.log(`💰 Final price after rule: ${ourPrice}`);

    console.log('⚠️ Custom price trong DB:', product.custom_price);

    console.log(`🔍 Tìm kiếm sản phẩm: ${productName} (SKU: ${sku || 'N/A'})`);
    console.log(`💰 Giá cuối cùng (final_price): ${ourPrice}`);  // Log the price for debugging

    // === PHÂN TÍCH TỪ KHÓA ===
    const baseKeyword = productName.split('|')[0].split('-')[0].trim();
    const modelMatch = productName.match(/\b[A-Z]{2,6}[\dA-Z]{1,6}\b/);
    const modelKeyword = modelMatch ? modelMatch[0] : null;
    const keywords = extractKeywords(productName);

    console.log(`📝 Keywords: ${keywords.join(', ')}`);
    console.log(`🔍 Base keyword: ${baseKeyword}`);
    console.log(`🔍 Model keyword: ${modelKeyword}`);

    let externalProducts = [];

    // Tìm theo model keyword
    if (modelKeyword) {
      const modelResults = await scraperService.searchAllMarketplaces(modelKeyword, {
        tiki: true,
        amazon: true,
        ebay: true,
        limit: 5
      });
      externalProducts.push(...modelResults);
    }

    // Tìm theo base keyword
    if (baseKeyword) {
      const baseResults = await scraperService.searchAllMarketplaces(baseKeyword, {
        tiki: true,
        amazon: true,
        ebay: true,
        limit: 5
      });
      externalProducts.push(...baseResults);
    }

    // Tìm theo tên đầy đủ nếu kết quả còn ít
    if (externalProducts.length < 3) {
      const fullResults = await scraperService.searchAllMarketplaces(productName, {
        tiki: true,
        amazon: true,
        ebay: true,
        limit: 3
      });
      externalProducts.push(...fullResults);
    }

    // Tìm thêm bằng SKU
    // if (sku && sku.length > 3 && !isGenericSku(sku)) {
    //   console.log(`🔍 Tìm kiếm theo SKU: ${sku}`);
    //   const skuResults = await scraperService.searchAllMarketplaces(sku, {
    //     tiki: true,
    //     amazon: true,
    //     ebay: true,
    //     limit: 3
    //   });
    //   externalProducts.push(...skuResults);
    // }

    // === XỬ LÝ KẾT QUẢ ===
    // Bổ sung lọc loại trừ sản phẩm không liên quan
    externalProducts = filterByCategoryKeyword(externalProducts, productName);
    externalProducts = removeDuplicates(externalProducts, 'url');
    externalProducts = calculateSimilarityScores(externalProducts, productName, keywords);

    // Log tất cả similarity theo nguồn
    console.log('📊 Similarity results:');
    console.table(externalProducts.map(p => ({
      source: p.source,
      title: p.title.slice(0, 50),
      similarity: p.similarity
    })));

    // Sắp xếp và lọc
    externalProducts.sort((a, b) => b.similarity - a.similarity);

    const filtered = externalProducts.filter(p => p.similarity >= 0.05);
    externalProducts = filtered.length > 0
      ? filtered.slice(0, 6)
      : externalProducts.slice(0, 6); // fallback nếu không có cái nào đủ similarity

    const comparisonData = {
      our_product: {
        id: product_id,
        variant_id: variant_id || null,
        name: productName,
        sku: sku || '',
        price: ourPrice,
        image_url: imageUrl,
        source: 'our_store',
        title: productName
      },
      comparisons: []
    };

    if (externalProducts.length > 0) {
      comparisonData.comparisons = externalProducts.map(product => {
        const externalPrice = product.price;
        const priceDifference = (ourPrice - externalPrice).toFixed(2);
        let percentageDiff = 0;

        if (externalPrice > 0) {
          percentageDiff = Math.max(-999.99, Math.min(999.99, ((ourPrice - externalPrice) / externalPrice * 100))).toFixed(2);
        } else {
          percentageDiff = "999.99";
        }

        const country = product.country || (['amazon', 'ebay'].includes(product.source) ? 'US' : 'VN');

        return {
          ...product,
          price_difference: priceDifference,
          price_difference_percentage: percentageDiff,
          is_cheaper: ourPrice < externalPrice,
          country
        };
      });
    }

    // Nếu vẫn không có thì fallback cho áo
    if (comparisonData.comparisons.length === 0) {
      if (productName.toLowerCase().includes('áo') || productName.toLowerCase().includes('thể thao') || productName.toLowerCase().includes('gym')) {
        console.log("⚠️ Fallback mock data cho áo thể thao");
        comparisonData.comparisons = [
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
            similarity: 0.95,
            price_difference: (ourPrice - 12.90 * 25000).toFixed(2),
            price_difference_percentage: Math.min(999.99, ((ourPrice - 12.90 * 25000) / (12.90 * 25000) * 100)).toFixed(2),
            is_cheaper: ourPrice < 12.90 * 25000
          }
        ];
      } else {
        console.log("⚠️ Không tìm thấy sản phẩm tương đương (không fallback)");
      }
    }

    if (comparisonData.comparisons.length > 0) {
      await saveComparisonData(product_id, variant_id || null, ourPrice, comparisonData.comparisons);
    }

    return res.status(200).json({
      success: true,
      message: 'Price comparison retrieved successfully',
      data: comparisonData
    });
  } catch (error) {
    console.error('Error in price comparison:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving price comparison',
      error: error.message
    });
  }
};


// Hàm bổ sung: Trích xuất từ khóa quan trọng từ tên sản phẩm
function extractKeywords(productName) {
  // Danh sách từ không quan trọng (stopwords)
  const stopwords = ['áo', 'quần', 'của', 'cho', 'và', 'với', 'các', 'những', 'cái', 'chiếc', 'có', 'là', 'cao', 'cấp', 'chất', 'lượng', 'the'];

  // Chuyển đổi sang chữ thường và tách thành các từ
  const words = productName.toLowerCase().split(/\s+/);

  // Lọc ra các từ quan trọng (từ dài hơn 2 ký tự và không nằm trong stopwords)
  const keywords = words.filter(word => 
    word.length > 2 && 
    !stopwords.includes(word) &&
    !word.match(/^\d+$/) // Loại bỏ các chuỗi chỉ chứa số
  );

  return [...new Set(keywords)]; // Loại bỏ từ trùng lặp
}

// Hàm bổ sung: Kiểm tra xem SKU có quá generic không
function isGenericSku(sku) {
  // Các SKU quá generic như: 123, abc, a123, v.v.
  const genericPatterns = [
    /^[a-z]{1,3}$/i,     // 1-3 chữ cái
    /^\d{1,4}$/,          // 1-4 chữ số
    /^[a-z]\d{1,3}$/i     // 1 chữ cái + 1-3 số
  ];

  return genericPatterns.some(pattern => sku.match(pattern));
}

// Hàm bổ sung: Loại bỏ các sản phẩm trùng lặp dựa trên trường nhất định
function removeDuplicates(products, field) {
  const uniqueValues = new Set();
  return products.filter(product => {
    if (!product[field] || uniqueValues.has(product[field])) {
      return false;
    }
    uniqueValues.add(product[field]);
    return true;
  });
}



function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Loại bỏ ký tự đặc biệt và dấu câu
    .replace(/\s+/g, ' ')             // Gộp khoảng trắng
    .trim();
}

// Hàm bổ sung: Tính điểm tương đồng giữa sản phẩm và từ khóa
function calculateSimilarityScores(products, productName, keywords) {
  const cleanProductName = normalizeText(productName);

  // Nếu có model code, boost điểm nếu khớp
  const modelMatch = productName.match(/\b[A-Z]{2,6}[\dA-Z]{1,6}\b/);
  const modelKeyword = modelMatch ? modelMatch[0].toLowerCase() : null;

  return products.map(product => {
    const cleanTitle = normalizeText(product.title);

    // Tính số từ khóa khớp
    const keywordMatches = keywords.filter(keyword => cleanTitle.includes(keyword));
    const keywordScore = keywords.length > 0 ? keywordMatches.length / keywords.length : 0;

    // So sánh từng từ trong tên sản phẩm với tiêu đề
    const productWords = cleanProductName.split(/\s+/);
    const titleWords = cleanTitle.split(/\s+/);

    let wordMatchScore = 0;
    for (const pWord of productWords) {
      if (pWord.length < 3) continue;

      for (const tWord of titleWords) {
        if (tWord.length < 3) continue;

        const maxLen = Math.max(pWord.length, tWord.length);
        let matchCount = 0;
        for (let i = 0; i < Math.min(pWord.length, tWord.length); i++) {
          if (pWord[i] === tWord[i]) matchCount++;
        }

        const wordSimilarity = matchCount / maxLen;
        if (wordSimilarity > 0.7) {
          wordMatchScore += wordSimilarity / productWords.length;
        }
      }
    }

    // Tính điểm tổng hợp
    const weights = {
      keywordScore: 0.7,
      wordMatchScore: 0.3
    };

    let similarity = (keywordScore * weights.keywordScore) +
                     (wordMatchScore * weights.wordMatchScore);

    // Boost nếu có chứa model code
    if (modelKeyword && cleanTitle.includes(modelKeyword)) {
      similarity += 0.25;
    }

    // Ưu tiên tiki nhẹ (tuỳ chỉnh nếu cần)
    if (product.source === 'tiki') {
      similarity += 0.05;
    }

    // Clamp điểm về [0, 1]
    const finalScore = Math.min(1, Math.max(0, similarity));

    return {
      ...product,
      similarity: parseFloat(finalScore.toFixed(2)),
      keyword_matches: keywordMatches
    };
  });
}


// Hàm bổ sung: Đối sánh SKU
function matchSku(productSku, externalTitle) {
  if (!productSku || productSku.length < 3) return 0;
  
  // Tối ưu hóa SKU để tìm kiếm
  const cleanSku = productSku.toLowerCase().trim();
  const cleanTitle = externalTitle.toLowerCase();
  
  // Kiểm tra nếu SKU xuất hiện trong tiêu đề
  if (cleanTitle.includes(cleanSku)) {
    // Nếu SKU xuất hiện nguyên vẹn, điểm cao
    return 1;
  }
  
  // Kiểm tra nếu phần lớn ký tự của SKU xuất hiện liên tiếp
  const skuChars = cleanSku.split('');
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  
  for (let i = 0; i < cleanTitle.length - 2; i++) {
    if (cleanTitle.substring(i, i + 3).includes(cleanSku.substring(0, 3))) {
      // Nếu 3 ký tự đầu của SKU xuất hiện, kiểm tra liên tiếp
      let matchCount = 0;
      for (let j = 0; j < Math.min(cleanSku.length, cleanTitle.length - i); j++) {
        if (cleanTitle[i + j] === cleanSku[j]) {
          matchCount++;
        } else {
          break;
        }
      }
      
      maxConsecutive = Math.max(maxConsecutive, matchCount);
    }
  }
  
  // Tỷ lệ ký tự khớp liên tiếp
  const consecutive_ratio = maxConsecutive / cleanSku.length;
  
  // Chỉ quan tâm nếu khớp ít nhất 50% ký tự liên tiếp
  return consecutive_ratio >= 0.5 ? consecutive_ratio : 0;
}

// Hàm bổ sung: Tìm kiếm từ đồng nghĩa
function findSynonyms(keyword) {
  // Dictionary đơn giản cho từ đồng nghĩa phổ biến
  const synonyms = {
    'áo': ['shirt', 'tee', 't-shirt', 'top'],
    'quần': ['pants', 'trousers', 'jeans', 'shorts'],
    'giày': ['shoes', 'sneakers', 'footwear'],
    'dép': ['sandals', 'slippers', 'flip-flops'],
    'túi': ['bag', 'handbag', 'purse', 'backpack'],
    'thể thao': ['sports', 'athletic', 'gym', 'workout', 'training'],
    'nam': ['men', 'male', 'man', 'men\'s'],
    'nữ': ['women', 'female', 'woman', 'women\'s'],
    'trẻ em': ['kids', 'children', 'youth', 'junior'],
    'đồng hồ': ['watch', 'timepiece', 'wristwatch'],
    'điện thoại': ['phone', 'smartphone', 'mobile', 'cellphone'],
    'máy tính': ['computer', 'laptop', 'notebook', 'pc'],
    'tai nghe': ['headphones', 'earphones', 'earbuds', 'headset'],
    'sạc': ['charger', 'charging', 'power adapter'],
  };
  
  const keywordLower = keyword.toLowerCase();
  return synonyms[keywordLower] || [];
}

// Hàm bổ sung: Kiểm tra nếu 2 giá gần nhau (tolerance là %)
function isPriceClose(price1, price2, tolerancePercent = 20) {
  if (price1 <= 0 || price2 <= 0) return false;
  
  const ratio = price1 / price2;
  const minRatio = (100 - tolerancePercent) / 100;
  const maxRatio = (100 + tolerancePercent) / 100;
  
  return ratio >= minRatio && ratio <= maxRatio;
}

// Hàm lọc loại trừ sản phẩm không liên quan dựa trên từ khóa
function filterByCategoryKeyword(products, productName) {
  const nameLower = productName.toLowerCase();
  // Xác định loại sản phẩm chính
  let mainType = '';
  if (nameLower.includes('quần') || nameLower.includes('pants') || nameLower.includes('trousers')) {
    mainType = 'pants';
  } else if (nameLower.includes('áo') || nameLower.includes('shirt') || nameLower.includes('t-shirt')) {
    mainType = 'shirt';
  } // Có thể mở rộng thêm các loại khác

  // Từ khóa loại trừ cho từng loại
  const excludeMap = {
    pants: ['áo', 'shirt', 't-shirt', 'hoodie', 'jacket', 'sweater', 'blouse'],
    shirt: ['quần', 'pants', 'trousers', 'jeans', 'shorts'],
  };
  const excludeWords = excludeMap[mainType] || [];

  return products.filter(p => {
    const title = (p.title || '').toLowerCase();
    // Nếu là pants, loại các sản phẩm có từ khóa áo...
    for (const ex of excludeWords) {
      if (title.includes(ex)) return false;
    }
    // Nếu là shirt, loại các sản phẩm có từ khóa quần...
    // ...
    return true;
  });
}

export default {
  getProductComparison,
  getHistoricalComparisons
};