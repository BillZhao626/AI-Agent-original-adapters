import { NextResponse } from "next/server";
import { z } from "zod";

// 讯飞星火 API 配置
const XINGHUO_API_KEY = process.env.XINGHUO_API_KEY || "";
const XINGHUO_BASE_URL = process.env.XINGHUO_BASE_URL || 'https://spark-api-open.xf-yun.com/v1';

// 问题生成 schema
const QuestionsSchema = z.object({
  questions: z.array(z.string())
});

const clarifyResearchGoals = async (topic: string) => {
  const prompt = `
  Given the research topic <topic>${topic}</topic>, generate 2-4 clarifying questions to help narrow down the research scope. Focus on identifying:
  - Specific aspects of interest
  - Required depth/complexity level
  - Any particular perspective or excluded sources
  
  Please respond with a JSON object containing an array of questions like this:
  {"questions": ["question1", "question2", "question3"]}
  `;

  try {
    const response = await fetch(`${XINGHUO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XINGHUO_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'spark-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from API');
    }

    // 尝试解析 JSON 响应
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return QuestionsSchema.parse(parsed).questions;
      }
    } catch (parseError) {
      console.log('JSON parse error, trying to extract questions from text:', parseError);
    }

    // 如果 JSON 解析失败，尝试从文本中提取问题
    const questions = content
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(q => q.length > 0);

    return questions.length > 0 ? questions : [
      `请详细说明你对"${topic}"的哪个方面最感兴趣？`,
      `你希望了解"${topic}"的什么层次的信息？`,
      `你是否有特定的应用场景或目的？`
    ];

  } catch (error) {
    console.error("Error while generating questions:", error);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    console.log("Topic:", topic);

    if (!XINGHUO_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "XINGHUO_API_KEY not configured"
      }, { status: 500 });
    }

    const questions = await clarifyResearchGoals(topic);
    console.log("Generated questions:", questions);

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to generate questions"
    }, { status: 500 });
  }
}
