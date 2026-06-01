// Unsplash API 图片搜索服务
const UNSPLASH_ACCESS_KEY = '4l_h6e31e5VJ0tPmedT--t37x7igUNYMZh0KscQUUo4';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

// 内存缓存：key -> { url, expiry }
const imageCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

/**
 * 通过菜品英文名称搜索 Unsplash 图片
 * @param {string} query - 英文搜索关键词（如 "Tomato Braised Beef Brisket"）
 * @returns {Promise<string|null>} 图片 URL
 */
export async function searchFoodImage(query) {
  if (!query || typeof query !== 'string') return null;

  const cacheKey = query.toLowerCase().trim();

  // 检查内存缓存
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_DURATION) {
    return cached.url;
  }

  try {
    const params = new URLSearchParams({
      query: cacheKey,
      per_page: '1',
      orientation: 'landscape',
      client_id: UNSPLASH_ACCESS_KEY,
    });

    const response = await fetch(`${UNSPLASH_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.error('Unsplash API 请求失败:', response.status, await response.text());
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // 优先使用 small 尺寸，加载更快；如果没有则回退
      const url = data.results[0].urls?.small
        || data.results[0].urls?.regular
        || data.results[0].urls?.raw
        || null;

      if (url) {
        imageCache.set(cacheKey, { url, ts: Date.now() });
        return url;
      }
    }

    return null;
  } catch (err) {
    console.error('Unsplash 图片搜索失败:', err);
    return null;
  }
}

/**
 * 批量预加载图片（用于推荐列表）
 * @param {Array<{food_name_en: string}>} foods
 */
export function preloadFoodImages(foods) {
  if (!Array.isArray(foods)) return;
  foods.forEach((food) => {
    if (food?.food_name_en) {
      searchFoodImage(food.food_name_en);
    }
  });
}
