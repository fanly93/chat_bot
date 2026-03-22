"""
LLM 流式输出 + 思考链测试脚本
测试 DeepSeek 和 Qwen 模型的流式返回字段结构，为前端对接提供参考。
"""

import json
from openai import OpenAI

DEEPSEEK_API_KEY = "sk-84e283a544754d56adc7483616dc6c2d"
DASHSCOPE_API_KEY = "sk-1b084b473f7d4818882782c45c7501a4"

SEPARATOR = "=" * 80


def test_deepseek_stream_thinking():
    """测试 DeepSeek deepseek-chat 模型 + thinking 参数开启思考模式的流式输出"""
    print(SEPARATOR)
    print("TEST 1: DeepSeek deepseek-chat + thinking 模式 (流式)")
    print(SEPARATOR)

    client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")

    messages = [{"role": "user", "content": "9.11和9.8哪个大？请简短回答。"}]

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        extra_body={"thinking": {"type": "enabled"}},
    )

    reasoning_content = ""
    content = ""
    chunk_count = 0
    first_chunk_raw = None
    reasoning_chunk_raw = None
    content_chunk_raw = None
    last_chunk_raw = None

    for chunk in response:
        chunk_count += 1
        raw = chunk.model_dump()

        if chunk_count == 1:
            first_chunk_raw = raw

        delta = chunk.choices[0].delta if chunk.choices else None
        finish_reason = chunk.choices[0].finish_reason if chunk.choices else None

        if delta:
            rc = getattr(delta, "reasoning_content", None)
            if rc:
                reasoning_content += rc
                if reasoning_chunk_raw is None:
                    reasoning_chunk_raw = raw

            c = getattr(delta, "content", None)
            if c:
                content += c
                if content_chunk_raw is None:
                    content_chunk_raw = raw

        if finish_reason:
            last_chunk_raw = raw

    print(f"\n总 chunk 数: {chunk_count}")
    print(f"\n--- 第 1 个 chunk (完整 JSON) ---")
    print(json.dumps(first_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 第一个 reasoning_content chunk ---")
    print(json.dumps(reasoning_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 第一个 content chunk ---")
    print(json.dumps(content_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 最后一个 chunk (finish_reason) ---")
    print(json.dumps(last_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 思考内容 (前 500 字) ---")
    print(reasoning_content[:500])
    print(f"\n--- 正文内容 ---")
    print(content)
    print()


def test_deepseek_stream_no_thinking():
    """测试 DeepSeek deepseek-chat 模型不开启思考模式的流式输出"""
    print(SEPARATOR)
    print("TEST 2: DeepSeek deepseek-chat 普通模式 (流式, 无思考)")
    print(SEPARATOR)

    client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")

    messages = [{"role": "user", "content": "用一句话介绍Python。"}]

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
    )

    content = ""
    chunk_count = 0
    first_chunk_raw = None
    content_chunk_raw = None
    last_chunk_raw = None

    for chunk in response:
        chunk_count += 1
        raw = chunk.model_dump()

        if chunk_count == 1:
            first_chunk_raw = raw

        delta = chunk.choices[0].delta if chunk.choices else None
        finish_reason = chunk.choices[0].finish_reason if chunk.choices else None

        if delta:
            rc = getattr(delta, "reasoning_content", None)
            if rc:
                print(f"  [意外] 收到 reasoning_content: {rc[:50]}")

            c = getattr(delta, "content", None)
            if c:
                content += c
                if content_chunk_raw is None:
                    content_chunk_raw = raw

        if finish_reason:
            last_chunk_raw = raw

    print(f"\n总 chunk 数: {chunk_count}")
    print(f"\n--- 第 1 个 chunk ---")
    print(json.dumps(first_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 第一个 content chunk ---")
    print(json.dumps(content_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 最后一个 chunk ---")
    print(json.dumps(last_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 正文内容 ---")
    print(content)
    print()


def test_qwen_stream_thinking():
    """测试 Qwen qwen3-235b-a22b 模型开启思考模式的流式输出"""
    print(SEPARATOR)
    print("TEST 3: Qwen qwen3-235b-a22b + enable_thinking (流式)")
    print(SEPARATOR)

    client = OpenAI(
        api_key=DASHSCOPE_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "9.11和9.8哪个大？请简短回答。"},
    ]

    response = client.chat.completions.create(
        model="qwen3-235b-a22b",
        messages=messages,
        stream=True,
        stream_options={"include_usage": True},
        extra_body={"enable_thinking": True},
    )

    reasoning_content = ""
    content = ""
    chunk_count = 0
    first_chunk_raw = None
    reasoning_chunk_raw = None
    content_chunk_raw = None
    last_chunk_raw = None
    usage_chunk_raw = None

    for chunk in response:
        chunk_count += 1
        raw = chunk.model_dump()

        if chunk_count == 1:
            first_chunk_raw = raw

        if chunk.usage:
            usage_chunk_raw = raw

        if not chunk.choices:
            continue

        delta = chunk.choices[0].delta
        finish_reason = chunk.choices[0].finish_reason

        rc = getattr(delta, "reasoning_content", None)
        if rc:
            reasoning_content += rc
            if reasoning_chunk_raw is None:
                reasoning_chunk_raw = raw

        c = getattr(delta, "content", None)
        if c:
            content += c
            if content_chunk_raw is None:
                content_chunk_raw = raw

        if finish_reason:
            last_chunk_raw = raw

    print(f"\n总 chunk 数: {chunk_count}")
    print(f"\n--- 第 1 个 chunk ---")
    print(json.dumps(first_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 第一个 reasoning_content chunk ---")
    print(json.dumps(reasoning_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 第一个 content chunk ---")
    print(json.dumps(content_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 最后一个 chunk (finish_reason) ---")
    print(json.dumps(last_chunk_raw, indent=2, ensure_ascii=False))
    if usage_chunk_raw:
        print(f"\n--- usage chunk ---")
        print(json.dumps(usage_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 思考内容 (前 500 字) ---")
    print(reasoning_content[:500])
    print(f"\n--- 正文内容 ---")
    print(content)
    print()


def test_qwen_stream_no_thinking():
    """测试 Qwen qwen-plus 模型不开启思考模式的流式输出"""
    print(SEPARATOR)
    print("TEST 4: Qwen qwen-plus 普通模式 (流式, 无思考)")
    print(SEPARATOR)

    client = OpenAI(
        api_key=DASHSCOPE_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "用一句话介绍Python。"},
    ]

    response = client.chat.completions.create(
        model="qwen-plus",
        messages=messages,
        stream=True,
        stream_options={"include_usage": True},
    )

    content = ""
    chunk_count = 0
    first_chunk_raw = None
    content_chunk_raw = None
    last_chunk_raw = None
    usage_chunk_raw = None

    for chunk in response:
        chunk_count += 1
        raw = chunk.model_dump()

        if chunk_count == 1:
            first_chunk_raw = raw

        if chunk.usage:
            usage_chunk_raw = raw

        if not chunk.choices:
            continue

        delta = chunk.choices[0].delta
        finish_reason = chunk.choices[0].finish_reason

        rc = getattr(delta, "reasoning_content", None)
        if rc:
            print(f"  [意外] 收到 reasoning_content: {rc[:50]}")

        c = getattr(delta, "content", None)
        if c:
            content += c
            if content_chunk_raw is None:
                content_chunk_raw = raw

        if finish_reason:
            last_chunk_raw = raw

    print(f"\n总 chunk 数: {chunk_count}")
    print(f"\n--- 第 1 个 chunk ---")
    print(json.dumps(first_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 第一个 content chunk ---")
    print(json.dumps(content_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 最后一个 chunk ---")
    print(json.dumps(last_chunk_raw, indent=2, ensure_ascii=False))
    if usage_chunk_raw:
        print(f"\n--- usage chunk ---")
        print(json.dumps(usage_chunk_raw, indent=2, ensure_ascii=False))
    print(f"\n--- 正文内容 ---")
    print(content)
    print()


if __name__ == "__main__":
    print("\n" + "LLM Stream Field Structure Test".center(70))
    print(SEPARATOR)

    test_deepseek_stream_thinking()
    test_deepseek_stream_no_thinking()
    test_qwen_stream_thinking()
    test_qwen_stream_no_thinking()

    print(SEPARATOR)
    print("全部测试完成")
