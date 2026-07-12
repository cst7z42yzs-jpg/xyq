import { createClient } from '@supabase/supabase-js';

// Supabase 配置 - 请替换为你的项目地址和 anon key
// 可在 Supabase 控制台 → Settings → API 中找到
const SUPABASE_URL = 'https://111.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ojmjS_1idBfOwknHzmuLUw_uOB0m5Sg';

// 初始化 Supabase 客户端
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 存储一条聊天记录到 Supabase
 * @param {string} userId - 访客唯一标识
 * @param {string} sender - 发送方：'user' 或 'assistant'
 * @param {string} message - 消息内容
 * @returns {Promise<{ success: boolean, data?: any, error?: any }>}
 */
export async function saveChatMessage(userId, sender, message) {
    try {
        const { data, error } = await supabase
            .from('chats')
            .insert([
                {
                    user_id: userId,
                    sender: sender,
                    message: message,
                }
            ])
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('保存聊天记录失败:', error.message);
        return { success: false, error };
    }
}

/**
 * 按 user_id 读取某个访客的历史聊天记录
 * @param {string} userId - 访客唯一标识
 * @param {number} limit - 最多读取条数，默认 100
 * @returns {Promise<Array<{ id: number, user_id: string, sender: string, message: string, created_at: string }>>}
 */
export async function getChatHistory(userId, limit = 100) {
    try {
        const { data, error } = await supabase
            .from('chats')
            .select('id, user_id, sender, message, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('读取聊天记录失败:', error.message);
        return [];
    }
}
