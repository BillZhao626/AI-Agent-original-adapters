import { ActivityTracker, ModelCallOptions, ResearchState } from "./types";
import { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } from "./constants";
import { delay } from "./utils";

// 讯飞星火 API 的正确认证方式
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
      const appId = process.env.XINGHUO_APPID;
      
      if (!apiKey || !appId) {
        throw new Error('Xinghuo API credentials not configured');
      }

      // 使用正确的讯飞星火 API 端点
      const response = await fetch('https://spark-api-open.xf-yun.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-App-Id': appId,
        },
        body: JSON.stringify({
          model: 'spark-pro',
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
