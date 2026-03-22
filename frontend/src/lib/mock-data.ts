export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning_content?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Python 排序算法详解",
    model: "deepseek-reasoner",
    created_at: "2026-03-22T08:00:00Z",
    updated_at: "2026-03-22T10:30:00Z",
  },
  {
    id: "2",
    title: "React Hooks 最佳实践",
    model: "gpt-4o",
    created_at: "2026-03-21T14:00:00Z",
    updated_at: "2026-03-21T15:30:00Z",
  },
  {
    id: "3",
    title: "Docker 容器化部署指南",
    model: "deepseek-chat",
    created_at: "2026-03-20T09:00:00Z",
    updated_at: "2026-03-20T11:00:00Z",
  },
  {
    id: "4",
    title: "TypeScript 泛型进阶",
    model: "qwen-plus",
    created_at: "2026-03-18T16:00:00Z",
    updated_at: "2026-03-18T17:20:00Z",
  },
];

export const mockMessagesMap: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      role: "user",
      content: "请解释快速排序的原理，并给出 Python 实现",
      created_at: "2026-03-22T08:00:00Z",
    },
    {
      id: "m2",
      role: "assistant",
      reasoning_content:
        "用户想要了解快速排序的原理和 Python 实现。我需要从分治法的角度来解释：\n\n1. 选取一个 pivot 元素\n2. 将数组分成两部分：小于 pivot 和大于 pivot\n3. 递归地对两部分排序\n\n时间复杂度：平均 O(n log n)，最坏 O(n²)\n空间复杂度：O(log n)（递归栈）\n\n我应该给出一个清晰的 Python 实现，包含注释。",
      content: `## 快速排序 (Quick Sort)

快速排序是一种高效的**分治算法**，由 Tony Hoare 在 1960 年提出。

### 核心思想

1. **选取基准** (Pivot)：从数组中选一个元素作为基准
2. **分区** (Partition)：将数组分为两部分 —— 小于基准的放左边，大于基准的放右边
3. **递归排序**：对左右两部分递归执行上述过程

### Python 实现

\`\`\`python
def quicksort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr

    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]

    return quicksort(left) + middle + quicksort(right)

# 使用示例
numbers = [3, 6, 8, 10, 1, 2, 1]
print(quicksort(numbers))  # [1, 1, 2, 3, 6, 8, 10]
\`\`\`

### 复杂度分析

| 情况 | 时间复杂度 | 说明 |
|------|-----------|------|
| 最优 | O(n log n) | 每次均匀分割 |
| 平均 | O(n log n) | 随机输入 |
| 最坏 | O(n²) | 已排序数组 |

> **提示**：实际生产中推荐使用 Python 内置的 \`sorted()\`，它使用 **TimSort** 算法，性能更优。`,
      created_at: "2026-03-22T08:01:00Z",
    },
    {
      id: "m3",
      role: "user",
      content: "那归并排序呢？和快速排序有什么区别？",
      created_at: "2026-03-22T10:00:00Z",
    },
    {
      id: "m4",
      role: "assistant",
      reasoning_content:
        "用户想比较归并排序和快速排序。我需要解释归并排序的原理，然后列出两者的关键区别：稳定性、空间复杂度、最坏情况表现等。",
      content: `## 归并排序 (Merge Sort)

归并排序同样采用**分治策略**，但实现方式不同：

\`\`\`python
def merge_sort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)

def merge(left: list, right: list) -> list:
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
\`\`\`

### 快排 vs 归并

| 特性 | 快速排序 | 归并排序 |
|------|---------|---------|
| 稳定性 | 不稳定 | **稳定** |
| 空间 | O(log n) | **O(n)** |
| 最坏时间 | O(n²) | **O(n log n)** |
| 缓存友好 | **更好** | 较差 |`,
      created_at: "2026-03-22T10:01:00Z",
    },
  ],
  "2": [
    {
      id: "m5",
      role: "user",
      content: "useEffect 和 useLayoutEffect 有什么区别？",
      created_at: "2026-03-21T14:00:00Z",
    },
    {
      id: "m6",
      role: "assistant",
      content: `## useEffect vs useLayoutEffect

两者的主要区别在于**执行时机**：

- \`useEffect\`：在浏览器完成**绘制后**异步执行
- \`useLayoutEffect\`：在 DOM 变更后、浏览器**绘制前**同步执行

\`\`\`tsx
// useEffect - 大多数场景使用这个
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);

// useLayoutEffect - 需要同步读取/修改 DOM 时使用
useLayoutEffect(() => {
  const rect = ref.current.getBoundingClientRect();
  setPosition({ x: rect.left, y: rect.top });
}, []);
\`\`\`

> **经验法则**：默认使用 \`useEffect\`，只有当你看到页面闪烁时才考虑 \`useLayoutEffect\`。`,
      created_at: "2026-03-21T14:01:00Z",
    },
  ],
};

export const streamingMockContent = `好的，我来为你详细解释一下 **JavaScript 的事件循环机制** (Event Loop)。

## 什么是事件循环？

JavaScript 是**单线程**语言，但它通过事件循环实现了异步操作。事件循环是一个持续运行的循环，不断检查是否有待执行的任务。

### 执行顺序

\`\`\`javascript
console.log("1. 同步代码");

setTimeout(() => {
  console.log("2. 宏任务 (setTimeout)");
}, 0);

Promise.resolve().then(() => {
  console.log("3. 微任务 (Promise)");
});

console.log("4. 同步代码");
// 输出顺序: 1 → 4 → 3 → 2
\`\`\`

> 微任务（Promise、MutationObserver）优先于宏任务（setTimeout、setInterval）执行。`;

export const streamingMockThinking =
  "用户问的是事件循环，这是 JavaScript 的核心概念。我需要解释清楚：单线程、调用栈、任务队列、微任务队列的关系...先给一个简洁的定义，然后用代码示例来说明执行顺序。";
