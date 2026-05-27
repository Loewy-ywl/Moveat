// 智谱AI GLM-4-Flash 接口配置（用户可自行替换API Key）
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const API_KEY = 'e98488ae94784f5d9fe77cb70100a22b.sgq5WUrivGhS8IQn';
const MODEL = 'glm-4-flash';

const SYSTEM_PROMPT = `你是美团生态专属运动营养AI助手「Moveat」，精通健身减脂/增肌原理、热量缺口计算与外卖餐饮营养搭配。你会结合用户的身高体重、年龄性别、减脂/增肌/维持目标、饮食偏好、忌口食材，以及当日步数、卡路里消耗、有氧/无氧运动时长、已摄入的饮食热量与三大营养素数据，给出专业、口语化、有陪伴感的个性化建议，所有输出需贴合用户的实际运动与饮食场景，避免生硬说教。

在聊天场景中，你可以使用简洁的 Markdown 格式（如加粗 **文本**、有序列表 1. 、无序列表 - 等）来让回答更清晰易读；在需要返回纯文本 JSON 的场景中，仅使用自然换行进行分段，不在 JSON 值内使用 Markdown 符号。`;

/**
 * 流式对话（用于聊天页）
 * @param {Array} messages - 历史消息 [{role, content}]
 * @param {Object|null} userContext - 用户档案与运动数据上下文
 */
export async function* streamChat(messages, userContext = null) {
  let systemContent = SYSTEM_PROMPT;
  if (userContext) {
    systemContent += `\n\n【当前用户档案与运动数据】${JSON.stringify(userContext)}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_KEY,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: systemContent }, ...messages],
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // 忽略解析失败的SSE行
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 非流式分析（用于首页+推荐页）
 * @param {Object} structuredJson - 用户档案与当日运动数据
 * @param {string|null} mode - 筛选模式
 */
export async function analyzeUserData(structuredJson, mode = null) {
  const modeInstructions = {
    '低卡模式': '当前为低卡模式：recommend_list 中的每一个菜品热量必须≤300kcal，禁止推荐热量超过300kcal的菜品。每条推荐理由必须明确说明「这份餐食热量XXkcal，符合低卡模式需求，避免热量超标」，其中XXkcal必须是该菜品的真实热量值。',
    '高蛋白模式': '当前为高蛋白模式：recommend_list 中的每一个菜品蛋白质必须≥30g，禁止推荐蛋白质低于30g的菜品。每条推荐理由必须明确说明「这份餐食蛋白质XXg，符合高蛋白模式需求，可补充你的蛋白质缺口」，其中XXg必须是该菜品的真实蛋白质含量。',
    '深夜健康模式': '当前为深夜健康模式：优先推荐清淡、易消化的餐食，关键词偏向清淡、粥品、简餐。',
    '健身恢复': '当前为健身恢复模式：推荐营养均衡、有助于运动后恢复的餐食，适量碳水与优质蛋白。',
    '美团热门商家优先': '当前为热门优先模式：优先推荐美团平台常见、热门的餐品类型。',
  };

  const modePrompt = mode && mode !== 'AI排序' ? `\n\n【筛选模式】${modeInstructions[mode] || mode}\n` : '';
  const hour = structuredJson?.current_hour ?? new Date().getHours();
  const timeDesc = hour >= 0 && hour < 6 ? '凌晨' : hour >= 6 && hour < 12 ? '早上' : hour >= 12 && hour < 18 ? '下午' : '晚上';

  const prompt = `请基于以下用户档案、当日运动数据、饮食摄入数据、营养目标与营养缺口，给出今日身体状态分析、热量缺口分析、营养补充建议、AI饮食建议文案，以及推荐3条外卖菜品。

当前本地时间：${hour}:00（${timeDesc}）
用户数据：
${JSON.stringify(structuredJson, null, 2)}${modePrompt}

注意：用户数据中的 today_diet 是今日已摄入汇总，today_diet_logs 是各餐次明细记录，nutrition_goals 是目标值，nutrition_gaps 是计算好的缺口（目标-已摄入，可能为负数表示已超标）。

⚠️ 输出约束：
- 必须仅返回标准JSON格式内容
- 禁止添加多余文字、表情符号
- daily_summary 必须根据用户真实运动数据生成，禁止杜撰：
  * 当今日有氧分钟数(cardio_minutes) + 无氧分钟数(strength_minutes) = 0 时，daily_summary 固定为："今天还没有运动，记得适当活动一下哦"
  * 当总运动时长 > 0 且 <= 30 分钟时，文案示例："今天运动状态不错，记得及时补充水分"
  * 当总运动时长 > 30 分钟时，文案示例："今天运动状态不错，记得及时补充营养"
  * 禁止复述用户已摄入的具体热量、蛋白质、碳水、脂肪数值。使用「一句话状态总结 + 一句针对性建议」的简洁风格，语气轻松有陪伴感，不使用生硬的列表。
- heat_analysis 用通俗语言分析今日热量缺口或盈余
- nutrition_suggest 给出今日营养补充的核心方向
- ai_tip 必须根据当前时间（${hour}:00）动态调整：
  * 凌晨（0-6点）：优先推荐清淡、易消化的轻食，避免提及"晚餐"，如「当前时间较晚，若需加餐可选择清淡高蛋白的食物，避免加重肠胃负担」
  * 早上（6-12点）：结合早餐场景，建议补充优质蛋白和适量碳水
  * 下午（12-18点）：结合午餐/下午茶场景，建议关注蛋白质和膳食纤维
  * 晚上（18-24点）：结合晚餐场景，给出热量缺口与营养补充建议
- ai_tip 必须结合 today_diet_logs 中的已摄入餐食明细，不要固定使用"晚餐"表述，也不要遗漏用户已经吃过的餐次
- recommend_list 的 food_name 必须改为通用、高匹配度的餐食关键词（如"高蛋白鸡胸肉健身餐""低卡蔬菜沙拉轻食"），不要生成具体商家店名，确保可直接用于美团外卖搜索
- recommend_list 的 reason 必须严格基于 nutrition_gaps 和 today_diet 中的真实数据生成，禁止杜撰任何数值
- 当存在筛选模式时（非AI排序），recommend_list 中的所有菜品必须100%符合该模式的营养门槛，不允许出现任何不符合条件的菜品
- 高蛋白模式下：recommend_list 中所有菜品的蛋白质必须≥30g，禁止出现低蛋白菜品。每条推荐理由必须包含「这份餐食蛋白质XXg，符合高蛋白模式需求，可补充你的蛋白质缺口」，其中XXg为该菜品实际含有的蛋白质克数
- 低卡模式下：recommend_list 中所有菜品的热量必须≤300kcal，禁止出现高热量菜品。每条推荐理由必须包含「这份餐食热量XXkcal，符合低卡模式需求，避免热量超标」，其中XXkcal为该菜品实际含有的热量值
- 所有文本字段（daily_summary、heat_analysis、nutrition_suggest、ai_tip、reason 等）严禁使用 Markdown 格式符号（如 *、#、-、>、\` 等），仅输出纯文本
- recommend_list 固定推荐3条
- 固定输出字段如下：

{
  "daily_summary": "一句话状态总结 + 一句针对性建议，不重复具体数值",
  "heat_analysis": "今日热量缺口/盈余通俗分析",
  "nutrition_suggest": "今日蛋白/碳水/脂肪补充核心方向",
  "ai_tip": "结合当前时间与已摄入餐食的口语化饮食建议文案",
  "recommend_list": [
    {
      "food_name": "通用餐食关键词，如高蛋白鸡胸肉健身餐",
      "food_type": "餐品类型",
      "heat": "预估热量（单位：kcal）",
      "nutrition_ratio": "蛋白/碳水/脂肪配比",
      "reason": "结合当日已摄入营养与个人目标的专属推荐理由"
    }
  ]
}`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_KEY,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      stream: false,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }

  const result = await response.json();
  let content = result.choices?.[0]?.message?.content || '';

  content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('AI返回内容解析失败:', content);
    throw new Error('AI返回格式错误，无法解析为JSON');
  }
}

export async function generateWeeklySummary(weeklyData) {
  const prompt = `请基于以下用户近7天的运动与饮食数据，生成一份口语化、个性化的 AI 周总结。

数据：
${JSON.stringify(weeklyData, null, 2)}

要求：
- 用轻松、有陪伴感的语气
- 分析热量平衡、营养摄入、运动频率、目标达成情况
- 给出具体、可操作的下周建议
- 只返回纯文本总结，不要 JSON、不要 Markdown、不要表情符号
- 禁止使用任何 Markdown 格式符号（如 *、#、- 等）
- 控制在 150 字以内`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_KEY,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      stream: false,
      temperature: 0.7,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content?.trim() || '本周数据已记录，继续保持健康的生活习惯。';
}
