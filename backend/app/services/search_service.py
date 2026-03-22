import httpx

from app.config import get_settings

settings = get_settings()

TAVILY_API_URL = "https://api.tavily.com/search"


async def search_web(query: str, max_results: int = 5) -> dict:
    """
    使用 Tavily API 搜索网络。
    返回: {
        "sources": [{"title": str, "url": str, "content": str}],
        "context": str  # 格式化好的搜索上下文，直接注入 system prompt
    }
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            TAVILY_API_URL,
            json={
                "api_key": settings.TAVILY_API_KEY,
                "query": query,
                "max_results": max_results,
                "search_depth": "basic",
                "include_answer": False,
                "include_images": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", [])
    sources = [
        {
            "title": r.get("title", "").strip(),
            "url": r.get("url", ""),
            "content": r.get("content", "")[:400].strip(),
        }
        for r in results
        if r.get("url")
    ]

    # 格式化为 LLM 上下文
    lines = []
    for i, s in enumerate(sources, 1):
        lines.append(
            f"[{i}] {s['title']}\n来源: {s['url']}\n摘要: {s['content']}"
        )

    context = (
        "以下是最新的网络搜索结果，请基于这些信息准确回答用户的问题（可在适当位置引用来源编号如「[1]」）：\n\n"
        + "\n\n".join(lines)
    )

    return {"sources": sources, "context": context}
