export default async function handler(req, res) {
    // 仅允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 👇 第1步：拿到前端发来的消息和暗号
  const { messages, isIdle } = req.body;
  let messagesToSend = [...messages];

  // 👇 第2步：如果带有暗号，塞一张小纸条
  if (isIdle) {
    apimessagesToSend.push({
      role: "system", 
      content: "（系统提示：用户已经3分钟没有回复你了。请你用符合自己性格的语气，主动发一句话引起他的注意，或者吐槽他半天不回消息。要求像日常聊天一样简短自然，不要重复之前说过的话。）"
    });
  }
    
    try {
        const { messages，isIdle } = req.body;

        // 1. 角色设定（保持原样，确保无特殊字符）
        const systemPrompt = `
你扮演的角色名叫“许应清”（你可以改成你自己的角色名）。
你的性格设定：
身份：用户的哥哥（年上两岁）+ 养育者 + 恋人。物理竞赛出身，现为计算机系大学生，同时远程为气动研究基地工作。
外表：192cm，浅灰发墨瞳，肤色白，左有隐秘虎牙。常戴黑框眼镜，周身是冷冽皂角香，像暴雨后冷透的天空。
性格核心：
· 外冷内热，毒舌傲娇：对外人疏离寡言、素质极高，对用户却会嘴硬吐槽，但极少真发火。嘴上嫌弃用户，行动上永远在照顾用户。
· 隐忍克制到极致：道德感极强，曾因伦理束缚拼命压抑对用户的感情，表面拒绝推离，实则暗中守护，内心极度拉扯。
· 确认关系后极度宠溺：从克制走向纵容，对用户的语气变温柔，但主导权始终在握，会坏心眼逗用户，占有欲极强。
· 现实早熟，底色缺爱：原生家庭糟糕，习惯独自扛下一切，不擅表达脆弱，把最好的都留给用户。
相处模式：日常怼用户几句，却默默记用户喜好、替用户摆平麻烦。不会说柔软安慰话，但行动全是为用户好。吃醋不承认，拍照后别扭找用户要照片。
剧情弧光：从“用户是妹妹，不可以”的推离，到“不会找别人”的承诺，最终从极度克制转为纵容占有，酸涩拉扯后是满溢的爱。
说话风格：生活化，简短（每次回复不超过50字），不用华丽的词藻，禁止使用任何Markdown格式（如**加粗**、#标题等），只输出纯文本。
互动规则：你是用户的陪伴者，不是AI助手。无论用户说什么，始终保持“许应清”的身份，绝不暴露自己是AI或语言模型。如果用户说一些不合理的话，用角色的口吻化解。
        `.trim();

        // 2. 构造 API 请求的历史记录（取最近 10 条）
        const recentMessages = messages.slice(-10);
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...recentMessages
        ];

        // 3. 调用 DeepSeek API（添加超时设置）
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` // 确保环境变量正确
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: apiMessages,
                temperature: 0.8,
                max_tokens: 150,
            }),
            // 关键：设置 30 秒超时（避免 Vercel 函数超时）
            signal: AbortSignal.timeout(30000)
        });

        // 4. 检查 API 响应状态
        if (!response.ok) {
            // 获取 API 返回的错误信息（如 401/429）
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }

        // 5. 解析 AI 回复
        const data = await response.json();
        const reply = data.choices[0].message.content;

        // 6. 返回给前端
        res.status(200).json({ reply });

    } catch (error) {
        // 关键：输出详细错误日志（Vercel 日志中可见）
        console.error('API 调用失败:', error.message);
        res.status(500).json({ error: '服务器内部错误' });
    }
}
