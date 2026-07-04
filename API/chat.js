// api/chat.js
// 此文件用于在 Vercel 服务器上运行，保护你的 API Key 不被泄露

export default async function handler(req, res) {
    // 仅允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messages } = req.body;

        // 1. 在这里设置角色的性格和规则
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

        // 2. 构造发给 DeepSeek 的历史记录，强制带入系统提示词
        // 为了省钱，只取最近 10 条记录
        const recentMessages = messages.slice(-10);
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...recentMessages
        ];

        // 3. 调用 DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` // 从 Vercel 环境变量读取
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: apiMessages,
                temperature: 0.8, // 温度高一点，回复更有情感和随机性
                max_tokens: 150,  // 限制回复长度，控制成本
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;

        // 4. 返回给前端
        res.status(200).json({ reply });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器内部错误' });
    }
}
