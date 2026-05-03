/**
 * POST /api/auth/register — 用户注册
 *
 * Route Handler 的标准写法（项目中所有 POST/PATCH/DELETE 端点都遵循此模式）：
 *
 *   1. requireUser() — 获取当前登录用户（注册接口例外，不需要此步骤）
 *   2. req.json() — 解析请求体
 *   3. xxxSchema.parse(body) — 用 zod 校验输入（校验失败自动抛 ZodError）
 *   4. service.xxx(input, actorId) — 调用 Service 层执行业务逻辑
 *   5. ok(data, 201) — 返回统一的成功响应
 *   6. catch → fail(error) — 统一错误转换（AppError/ZodError/未知错误 → ApiResponse）
 *
 * lib/api-response.ts 的 ok() 和 fail() 封装了统一的 { success, data/error } 格式。
 *
 * 设计文档参考：Section 18.3 (Route Handler 示例)
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { registerSchema } from "@/schemas/auth.schema";
import { register } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // parse() 会抛 ZodError 如果校验失败 → fail() 自动转为 400 响应
    const input = registerSchema.parse(body);
    const user = await register(input);
    return ok(user, 201);
  } catch (error) {
    return fail(error as Error);
  }
}
