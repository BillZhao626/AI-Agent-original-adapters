import { ActivityTracker, ModelCallOptions, ResearchState } from "./types";
import { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } from "./constants";
import { delay } from "./utils";
import crypto from 'crypto';

// 讯飞星火 API v2 的正确认证方式
export async function callModel<T>({
    model, prompt, system, schema, activityType = "generate"
}: ModelCallOptions<T>,
researchState: ResearchState,
activityTracker: ActivityTracker
): Promise<T | string> {

  let attempts = 0;
  let lastError: Error | null = null;

  while(attempts < MAX_RETRY_ATTEMPTS) {
    try {
      activityTracker.add(activityType, "pending", "Calling model...");
      
      const apiKey = process.env.XINGHUO_API_KEY;
      const apiSecret = process.env.XINGHUO_APISECRET;
      const appId = process.env.XINGHUO_APPID;
      const baseUrl = process.env.XINGHUO_BASE_URL || 'https://spark-api-open.xf-yun.com/v2';
      const modelName = process.env.XINGHUO_MODEL || 'spark-x1-32k';
      
      if (!apiKey || !apiSecret || !appId) {
        throw new Error('Xinghuo API credentials not configured');
      }

      // 生成认证签名
      const date = new Date().toUTCString();
      const signature = generateSignature(apiSecret, date);

      // 使用正确的讯飞星火 API v2 端点
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-App-Id': appId,
          'X-Date': date,
          'X-Signature': signature,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: system || 'You are a helpful research assistant.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Xinghuo API error:', errorText);
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from API');
      }

      // 如果是 schema 调用，尝试解析 JSON
      if (schema) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            researchState.tokenUsed += data.usage?.total_tokens || 0;
            researchState.completedSteps++;
            activityTracker.add(activityType, "complete", "Model call successful");
            return parsed as T;
          }
        } catch (parseError) {
          console.log('JSON parse error:', parseError);
        }
      }

      researchState.tokenUsed += data.usage?.total_tokens || 0;
      researchState.completedSteps++;
      activityTracker.add(activityType, "complete", "Model call successful");
      return content;

    } catch (error) {
      attempts++;
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempts < MAX_RETRY_ATTEMPTS) {
        activityTracker.add(activityType, 'warning', `Model call failed, attempt ${attempts}/${MAX_RETRY_ATTEMPTS}. Retrying...`);
        await delay(RETRY_DELAY_MS * attempts);
      }
    }
  }

  activityTracker.add(activityType, 'error', `Model call failed after ${MAX_RETRY_ATTEMPTS} attempts`);
  throw lastError || new Error(`Failed after ${MAX_RETRY_ATTEMPTS} attempts!`);
}

// 生成讯飞星火 API 签名
function generateSignature(apiSecret: string, date: string): string {
  const stringToSign = `date: ${date}\nhost: spark-api-open.xf-yun.com\nPOST /v2/chat/completions HTTP/1.1`;
  const signature = crypto.createHmac('sha256', apiSecret).update(stringToSign).digest('base64');
  return `hmac-sha256 api_key="${process.env.XINGHUO_API_KEY}", algorithm="hmac-sha256", headers="date host request-line", signature="${signature}"`;
}
