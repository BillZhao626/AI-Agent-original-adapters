import { ActivityTracker, ModelCallOptions, ResearchState } from "./types";
import { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } from "./constants";
import { delay } from "./utils";

// 简化的模型调用，直接使用 HTTP 请求
export async function callModel<T>({
    model, prompt, system, schema, activityType = "generate"
}: ModelCallOptions<T>,
researchState: ResearchState,
activityTracker: ActivityTracker
): Promise<T | string> {

  let attempts = 0;
  let lastError: Error | null = null;

  // 暂时使用简单的文本生成，避免复杂的 schema 解析
  while(attempts < MAX_RETRY_ATTEMPTS) {
    try {
      activityTracker.add(activityType, "pending", "Calling model...");
      
      // 使用讯飞星火 API
      const response = await fetch('https://spark-api-open.xf-yun.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.XINGHUO_API_KEY}`,
          'X-App-Id': process.env.XINGHUO_APPID || '',
          'Host': 'spark-api-open.xf-yun.com',
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
