import { ActivityTracker, ModelCallOptions, ResearchState } from "./types";
import { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } from "./constants";
import { delay } from "./utils";

// 模拟模型调用，返回预设的响应
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
      
      // 模拟 API 调用延迟
      await delay(500 + Math.random() * 1000);
      
      // 根据不同的 activityType 返回不同的模拟响应
      let mockResponse: any;
      
      if (activityType === "planning") {
        // 研究计划生成 - 根据主题生成更多样化的查询
        const topic = researchState.topic || "研究主题";
        
        // 生成多角度、多层次的搜索查询
        const baseQueries = [
          `${topic}的定义和基本概念`,
          `${topic}的核心原理和机制`,
          `${topic}的主要应用领域`,
          `${topic}的发展历史和里程碑`,
          `${topic}的当前趋势和前沿`,
          `${topic}的挑战和限制`,
          `${topic}的伦理和社会影响`,
          `${topic}的未来展望和预测`,
          `${topic}的最佳实践和案例`,
          `${topic}的技术实现和工具`,
          `${topic}的经济影响和商业模式`,
          `${topic}的教育和人才培养`
        ];
        
        // 随机选择 6-8 个查询，确保覆盖不同角度
        const selectedQueries = baseQueries
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 3) + 6); // 6-8 个查询
        
        mockResponse = {
          searchQueries: selectedQueries
        };
      } else if (activityType === "extract") {
        // 内容提取 - 生成更丰富和详细的内容
        const topic = researchState.topic || "相关主题";
        const query = prompt.split("from")[1]?.trim() || "相关查询";
        
        // 生成详细的内容片段
        const contentTemplates = [
          `关于${query}的深度分析：这是一个复杂且多层面的主题，涉及多个技术领域和实践应用。从技术角度来看，${query}代表了当前技术发展的重要方向，具有显著的理论价值和实践意义。`,
          
          `${query}的核心特征包括：1）技术先进性 - 采用最新的技术架构和方法论；2）实用性强 - 能够解决实际业务问题；3）可扩展性 - 支持未来功能扩展和升级；4）稳定性 - 经过充分测试和验证。`,
          
          `在应用层面，${query}已经在多个行业得到成功应用。例如，在制造业中，它帮助提升了生产效率20-30%；在金融领域，风险控制准确率提高了15-25%；在医疗健康领域，诊断准确率显著提升。`,
          
          `技术实现方面，${query}基于以下关键技术：机器学习算法、大数据处理、云计算平台、人工智能技术等。这些技术的结合使用，形成了强大的技术生态系统，为用户提供了全面的解决方案。`,
          
          `市场趋势显示，${query}正处于快速发展期。预计未来3-5年，市场规模将增长200-300%，用户数量将大幅增加。这主要得益于技术进步、成本下降和用户认知提升。`,
          
          `面临的挑战包括：技术复杂度高、实施周期长、人才需求大、投资成本高等。然而，随着技术成熟度提升和生态完善，这些挑战正在逐步得到解决。`,
          
          `未来发展方向：1）技术标准化 - 建立统一的技术标准和规范；2）生态完善 - 构建完整的产业链生态；3）应用拓展 - 扩展到更多行业和场景；4）智能化升级 - 提升自动化程度和智能化水平。`
        ];
        
        // 随机选择 2-4 个内容片段组合
        const numFragments = Math.floor(Math.random() * 3) + 2;
        const selectedFragments = contentTemplates
          .sort(() => Math.random() - 0.5)
          .slice(0, numFragments);
        
        mockResponse = selectedFragments.join('\n\n');
      } else if (activityType === "analyze") {
        // 内容分析 - 更智能的迭代决策
        const topic = researchState.topic || "研究主题";
        const currentIteration = researchState.iterations || 0;
        
        // 根据迭代次数和发现数量决定是否需要更多研究
        const findingsCount = researchState.findings?.length || 0;
        const isEarlyIteration = currentIteration < 2;
        const hasFewFindings = findingsCount < 5;
        
        // 早期迭代或发现较少时，倾向于继续研究
        const shouldContinue = isEarlyIteration || hasFewFindings || Math.random() > 0.6;
        
        // 生成具体的分析反馈
        const possibleGaps = [
          "需要更多实际应用案例",
          "缺乏技术细节和实现方法",
          "缺少最新的发展趋势信息",
          "需要更多行业专家观点",
          "缺乏对比分析和竞品研究",
          "需要更多数据和统计信息",
          "缺少失败案例和经验教训",
          "需要更多未来预测和展望"
        ];
        
        const possibleQueries = [
          `${topic}的实际应用案例和成功故事`,
          `${topic}的技术实现细节和架构设计`,
          `${topic}的最新发展趋势和前沿研究`,
          `${topic}的行业专家观点和权威分析`,
          `${topic}的对比分析和竞品研究`,
          `${topic}的统计数据和市场报告`,
          `${topic}的挑战和失败案例`,
          `${topic}的未来预测和发展方向`
        ];
        
        // 随机选择 1-3 个gap和对应的query
        const numGaps = Math.floor(Math.random() * 3) + 1;
        const selectedGaps = possibleGaps
          .sort(() => Math.random() - 0.5)
          .slice(0, numGaps);
        
        const selectedQueries = possibleQueries
          .sort(() => Math.random() - 0.5)
          .slice(0, numGaps);
        
        mockResponse = {
          sufficient: !shouldContinue,
          gaps: shouldContinue ? selectedGaps : [],
          queries: shouldContinue ? selectedQueries : []
        };
      } else if (activityType === "report" || activityType === "generate") {
        // 报告生成 - 更详细和结构化的报告
        const topic = researchState.topic || "研究主题";
        const findingsCount = researchState.findings?.length || 0;
        const iterations = researchState.iterations || 1;
        
        // 根据研究发现数量调整报告深度
        const isDeepResearch = findingsCount > 8 && iterations > 2;
        
        mockResponse = `<report>
# ${topic} 深度研究报告

## 执行摘要

本报告通过${iterations}轮迭代研究，收集了${findingsCount}项关键发现，深入分析了${topic}的多个维度。研究采用了系统性方法，从基础概念到实际应用，从历史发展到未来趋势，全面覆盖了该领域的核心内容。

**核心发现**：
- ${topic}正在经历快速发展期，技术成熟度不断提升
- 实际应用案例日益丰富，跨行业应用趋势明显
- 面临技术挑战和伦理考量，需要平衡创新与风险
- 未来发展潜力巨大，预计将在未来5-10年产生重大影响

## 1. 研究概述

### 1.1 研究目标
本研究旨在全面了解${topic}的发展现状、技术原理、应用场景和未来趋势，为相关决策提供科学依据。

### 1.2 研究方法
采用多轮迭代研究方法：
- **第1轮**：基础概念和核心原理研究
- **第2轮**：应用案例和实际效果分析
- **第3轮**：挑战问题和解决方案探讨
- **第4轮**：未来趋势和发展预测

### 1.3 研究范围
涵盖技术、应用、商业、社会等多个维度，确保研究的全面性和深度。

## 2. 核心概念与原理

### 2.1 基本定义
${topic}是指通过先进的技术手段和方法，实现特定目标的技术体系。其核心特征包括：
- 智能化程度高
- 自动化能力强
- 适应性和灵活性好
- 可扩展性和可维护性强

### 2.2 技术原理
基于以下核心技术：
- 算法优化和机器学习
- 数据处理和分析技术
- 系统集成和接口设计
- 用户体验和人机交互

### 2.3 技术架构
采用分层架构设计：
- 数据层：负责数据收集和存储
- 处理层：核心算法和业务逻辑
- 服务层：API接口和服务提供
- 应用层：用户界面和交互体验

## 3. 发展历程与现状

### 3.1 发展历程
**萌芽期（2000-2010）**：
- 理论基础建立
- 早期概念验证
- 技术可行性探索

**发展期（2010-2020）**：
- 技术逐步成熟
- 应用场景扩展
- 商业化进程启动

**成熟期（2020至今）**：
- 大规模应用部署
- 生态系统完善
- 标准化程度提高

### 3.2 当前现状
**技术成熟度**：已达到商业化应用水平
**市场接受度**：逐步提高，用户认知增强
**产业生态**：上下游产业链日趋完善
**政策环境**：支持性政策陆续出台

## 4. 应用领域与案例

### 4.1 主要应用领域
1. **工业制造**：智能制造、质量控制、预测维护
2. **金融服务**：风险评估、欺诈检测、智能投顾
3. **医疗健康**：疾病诊断、药物发现、个性化治疗
4. **交通运输**：自动驾驶、路径优化、交通管理
5. **教育培训**：个性化学习、智能辅导、知识图谱

### 4.2 典型应用案例
**案例1：智能制造系统**
- 应用场景：汽车生产线质量控制
- 技术方案：计算机视觉 + 机器学习
- 实施效果：缺陷检测准确率提升30%，成本降低20%

**案例2：金融风控系统**
- 应用场景：银行贷款风险评估
- 技术方案：大数据分析 + 深度学习
- 实施效果：风险识别准确率提升25%，审批效率提高40%

### 4.3 应用效果分析
**积极影响**：
- 提高工作效率和质量
- 降低人工成本和错误率
- 增强决策的科学性和准确性
- 创造新的商业价值

**挑战与限制**：
- 技术复杂度和实施难度
- 数据质量和隐私保护
- 人才短缺和技能要求
- 投资回报周期较长

## 5. 技术挑战与解决方案

### 5.1 主要技术挑战
1. **数据质量挑战**
   - 数据不完整和不一致
   - 数据噪声和异常值
   - 数据更新和同步问题

2. **算法性能挑战**
   - 计算复杂度和资源消耗
   - 模型精度和泛化能力
   - 实时性和响应速度

3. **系统集成挑战**
   - 异构系统兼容性
   - 接口标准化问题
   - 部署和维护复杂性

### 5.2 解决方案
**数据质量提升**：
- 建立数据质量评估体系
- 实施数据清洗和预处理
- 构建数据治理框架

**算法优化**：
- 采用分布式计算架构
- 优化模型结构和参数
- 实施模型压缩和加速

**系统集成**：
- 制定统一的技术标准
- 开发标准化的接口协议
- 建立系统集成测试体系

## 6. 发展趋势与预测

### 6.1 短期趋势（1-3年）
- 技术标准化程度进一步提高
- 应用场景持续扩展
- 成本持续下降，普及率提升
- 人才需求快速增长

### 6.2 中期趋势（3-5年）
- 技术成熟度达到新高度
- 跨行业融合应用增多
- 商业模式创新活跃
- 监管政策趋于完善

### 6.3 长期趋势（5-10年）
- 成为基础设施的重要组成部分
- 深度融入各行各业
- 催生新的产业生态
- 对社会经济产生深远影响

## 7. 商业影响与机会

### 7.1 市场机会
**市场规模**：预计未来5年市场规模将增长300%以上
**增长驱动**：
- 技术进步和成本下降
- 应用场景不断扩展
- 政策支持和投资增加
- 用户需求持续增长

### 7.2 商业模式
1. **技术授权模式**：核心技术许可和授权
2. **平台服务模式**：提供平台和工具服务
3. **解决方案模式**：提供端到端解决方案
4. **数据服务模式**：基于数据的增值服务

### 7.3 投资机会
**早期投资**：关注技术创新和团队能力
**成长期投资**：关注市场拓展和商业模式
**成熟期投资**：关注规模效应和盈利能力

## 8. 社会影响与伦理考量

### 8.1 积极影响
- 提高社会生产效率
- 改善生活质量
- 创造就业机会
- 促进社会进步

### 8.2 潜在风险
- 就业结构变化
- 隐私和安全问题
- 数字鸿沟扩大
- 伦理和道德挑战

### 8.3 应对策略
- 建立完善的监管体系
- 加强伦理审查和评估
- 促进公平和包容性发展
- 提高公众意识和参与度

## 9. 结论与建议

### 9.1 主要结论
1. ${topic}正处于快速发展期，技术日趋成熟
2. 应用场景广泛，市场潜力巨大
3. 面临技术、商业、社会等多重挑战
4. 未来发展前景良好，需要统筹规划

### 9.2 发展建议

**技术发展**：
- 加强基础研究和技术创新
- 建立产学研合作机制
- 完善技术标准和规范
- 培养专业技术人才

**产业发展**：
- 构建完整的产业生态
- 促进产业链协同发展
- 创新商业模式和服务
- 加强国际合作交流

**政策支持**：
- 制定支持性政策法规
- 提供资金和税收优惠
- 建立监管和评估体系
- 促进公平竞争环境

**社会参与**：
- 提高公众认知和接受度
- 加强伦理和社会责任
- 促进包容性发展
- 建立多方参与机制

### 9.3 实施路径
**短期目标（1年）**：
- 完善技术标准和规范
- 建立示范应用项目
- 培养核心人才队伍

**中期目标（3年）**：
- 实现规模化商业应用
- 建立完整产业生态
- 形成国际竞争优势

**长期目标（5年）**：
- 成为全球领先技术
- 深度融入经济社会发展
- 创造巨大社会价值

## 10. 附录

### 10.1 研究方法说明
本研究采用多轮迭代方法，通过以下步骤进行：
1. 文献调研和资料收集
2. 专家访谈和实地调研
3. 案例分析和比较研究
4. 趋势分析和预测建模

### 10.2 数据来源
- 学术论文和研究报告
- 行业报告和市场分析
- 专家观点和访谈记录
- 公开数据和统计信息

### 10.3 研究局限
- 数据时效性限制
- 信息获取渠道局限
- 预测准确性的不确定性
- 主观判断的影响

---

**报告完成时间**：${new Date().toLocaleDateString('zh-CN')}
**研究轮次**：${iterations}轮迭代
**发现数量**：${findingsCount}项关键发现
**报告状态**：${isDeepResearch ? '深度研究完成' : '基础研究完成'}
</report>`;
      } else {
        // 默认响应
        mockResponse = `这是关于"${prompt.substring(0, 50)}..."的模拟响应。在实际应用中，这里会是真实的 AI 模型响应。`;
      }

      researchState.tokenUsed += Math.floor(Math.random() * 1000) + 500;
      researchState.completedSteps++;
      activityTracker.add(activityType, "complete", "Model call successful (mock)");
      
      return mockResponse;

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
