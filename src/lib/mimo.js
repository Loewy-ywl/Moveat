const MIMO_API_URL = 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions';
const MIMO_API_KEY = 'tp-co78md2rfg0vin629k1p7lt0ofrc8sy9m7fcohvsmmv7ejk7';

/**
 * 使用 MiMo AI 分析食物图片
 * @param {string} imageBase64 - Base64 编码的图片（带 data:image/jpeg;base64, 前缀）
 * @returns {Promise<Object>} - 识别结果
 */
export async function analyzeFoodImage(imageBase64) {
  const response = await fetch(MIMO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MIMO_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mimo-v2.5',
      messages: [
        {
          role: 'system',
          content: 'You are MiMo, an AI assistant developed by Xiaomi. You are a nutrition expert. Analyze food images and provide accurate nutritional information.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
              },
            },
            {
              type: 'text',
              text: `分析图片中的食物，返回JSON（不要任何其他文字）：
{"food_name":"食物名称","calorie":整数热量kcal,"protein":整数蛋白质g,"carb":整数碳水g,"fat":整数脂肪g,"description":"一句话描述"}
要求：
1. 只返回纯JSON，不要markdown代码块
2. 数值用整数，不要引号
3. 根据食物分量合理估算`,
            },
          ],
        },
      ],
      max_completion_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`MiMo API 请求失败: ${response.status}`);
  }

  const result = await response.json();
  console.log('MiMo API 原始返回:', result);
  const content = result.choices?.[0]?.message?.content || '';
  console.log('MiMo AI 内容:', content);

  // 提取 JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('无法从内容中提取 JSON，原始内容:', content);
    throw new Error('AI 返回格式错误，无法解析');
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('解析 JSON 失败:', content);
    throw new Error('AI 返回内容解析失败');
  }
}

/**
 * 将文件转为 Base64
 * @param {File} file - 图片文件
 * @returns {Promise<string>} - Base64 字符串
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
