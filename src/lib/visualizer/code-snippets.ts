import type { DataStructureType } from './data-structures';

export type AlgorithmicLanguage = 'typescript' | 'javascript' | 'python' | 'java' | 'cpp' | 'go';

export const SUPPORTED_CODE_LANGUAGES: { id: AlgorithmicLanguage; label: string }[] = [
  { id: 'typescript', label: 'TS' },
  { id: 'javascript', label: 'JS' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'go', label: 'Go' },
];

export function getCodeSnippet(
  dsType: DataStructureType,
  operation: string,
  lang: AlgorithmicLanguage,
): string {
  const op = operation.toLowerCase();

  // =========================================================================
  // 1. ARRAY & DYNAMIC BUFFER
  // =========================================================================
  if (dsType === 'array') {
    if (op.includes('push') || op.includes('append')) {
      switch (lang) {
        case 'typescript':
          return `function push<T>(arr: T[], val: T): number {\n  // Check capacity & append\n  arr[arr.length] = val;\n  return arr.length;\n}`;
        case 'javascript':
          return `function push(arr, val) {\n  // Check capacity & append\n  arr[arr.length] = val;\n  return arr.length;\n}`;
        case 'python':
          return `def push(arr: list, val: int) -> int:\n    # Append to dynamic list\n    arr.append(val)\n    return len(arr)`;
        case 'java':
          return `public int push(List<Integer> arr, int val) {\n    // Dynamic array append\n    arr.add(val);\n    return arr.size();\n}`;
        case 'cpp':
          return `int push(std::vector<int>& arr, int val) {\n    // Vector push_back\n    arr.push_back(val);\n    return arr.size();\n}`;
        case 'go':
          return `func push(arr []int, val int) []int {\n    // Slice append\n    arr = append(arr, val)\n    return arr\n}`;
      }
    }

    if (op.includes('pop')) {
      switch (lang) {
        case 'typescript':
          return `function pop<T>(arr: T[]): T | undefined {\n  if (arr.length === 0) return undefined;\n  const val: T = arr[arr.length - 1];\n  arr.length--;\n  return val;\n}`;
        case 'javascript':
          return `function pop(arr) {\n  if (arr.length === 0) return undefined;\n  const val = arr[arr.length - 1];\n  arr.length--;\n  return val;\n}`;
        case 'python':
          return `def pop(arr: list) -> int | None:\n    if not arr:\n        return None\n    return arr.pop()`;
        case 'java':
          return `public Integer pop(List<Integer> arr) {\n    if (arr.isEmpty()) return null;\n    return arr.remove(arr.size() - 1);\n}`;
        case 'cpp':
          return `int pop(std::vector<int>& arr) {\n    if (arr.empty()) return -1;\n    int val = arr.back();\n    arr.pop_back();\n    return val;\n}`;
        case 'go':
          return `func pop(arr *[]int) (int, bool) {\n    if len(*arr) == 0 { return 0, false }\n    n := len(*arr)\n    val := (*arr)[n-1]\n    *arr = (*arr)[:n-1]\n    return val, true\n}`;
      }
    }

    if (op.includes('insert')) {
      switch (lang) {
        case 'typescript':
          return `function insertAt<T>(arr: T[], index: number, val: T): void {\n  for (let i: number = arr.length; i > index; i--) {\n    arr[i] = arr[i - 1]; // Shift right\n  }\n  arr[index] = val;\n}`;
        case 'javascript':
          return `function insertAt(arr, index, val) {\n  for (let i = arr.length; i > index; i--) {\n    arr[i] = arr[i - 1]; // Shift right\n  }\n  arr[index] = val;\n}`;
        case 'python':
          return `def insert_at(arr: list, index: int, val: int) -> None:\n    arr.append(0)  # Make room\n    for i in range(len(arr) - 1, index, -1):\n        arr[i] = arr[i - 1]  # Shift right\n    arr[index] = val`;
        case 'java':
          return `public void insertAt(int[] arr, int index, int val, int size) {\n    for (int i = size; i > index; i--) {\n        arr[i] = arr[i - 1]; // Shift right\n    }\n    arr[index] = val;\n}`;
        case 'cpp':
          return `void insertAt(std::vector<int>& arr, int index, int val) {\n    arr.push_back(0);\n    for (int i = arr.size() - 1; i > index; --i) {\n        arr[i] = arr[i - 1]; // Shift right\n    }\n    arr[index] = val;\n}`;
        case 'go':
          return `func insertAt(arr []int, index int, val int) []int {\n    arr = append(arr, 0)\n    for i := len(arr) - 1; i > index; i-- {\n        arr[i] = arr[i-1]\n    }\n    arr[index] = val\n    return arr\n}`;
      }
    }

    if (op.includes('delete')) {
      switch (lang) {
        case 'typescript':
          return `function deleteAt<T>(arr: T[], index: number): T | undefined {\n  const removed: T = arr[index];\n  for (let i: number = index; i < arr.length - 1; i++) {\n    arr[i] = arr[i + 1]; // Shift left\n  }\n  arr.length--;\n  return removed;\n}`;
        case 'javascript':
          return `function deleteAt(arr, index) {\n  const removed = arr[index];\n  for (let i = index; i < arr.length - 1; i++) {\n    arr[i] = arr[i + 1]; // Shift left\n  }\n  arr.length--;\n  return removed;\n}`;
        case 'python':
          return `def delete_at(arr: list, index: int) -> int:\n    removed = arr[index]\n    for i in range(index, len(arr) - 1):\n        arr[i] = arr[i + 1]  # Shift left\n    arr.pop()\n    return removed`;
        case 'java':
          return `public int deleteAt(int[] arr, int index, int size) {\n    int removed = arr[index];\n    for (int i = index; i < size - 1; i++) {\n        arr[i] = arr[i + 1]; // Shift left\n    }\n    return removed;\n}`;
        case 'cpp':
          return `int deleteAt(std::vector<int>& arr, int index) {\n    int removed = arr[index];\n    for (size_t i = index; i < arr.size() - 1; ++i) {\n        arr[i] = arr[i + 1];\n    }\n    arr.pop_back();\n    return removed;\n}`;
        case 'go':
          return `func deleteAt(arr []int, index int) ([]int, int) {\n    removed := arr[index]\n    for i := index; i < len(arr)-1; i++ {\n        arr[i] = arr[i+1]\n    }\n    return arr[:len(arr)-1], removed\n}`;
      }
    }

    if (op.includes('reverse')) {
      switch (lang) {
        case 'typescript':
          return `function reverse<T>(arr: T[]): void {\n  let left = 0, right = arr.length - 1;\n  while (left < right) {\n    [arr[left], arr[right]] = [arr[right], arr[left]];\n    left++; right--;\n  }\n}`;
        case 'javascript':
          return `function reverse(arr) {\n  let left = 0, right = arr.length - 1;\n  while (left < right) {\n    [arr[left], arr[right]] = [arr[right], arr[left]];\n    left++; right--;\n  }\n}`;
        case 'python':
          return `def reverse(arr: list) -> None:\n    left, right = 0, len(arr) - 1\n    while left < right:\n        arr[left], arr[right] = arr[right], arr[left]\n        left += 1\n        right -= 1`;
        case 'java':
          return `public void reverse(int[] arr) {\n    int left = 0, right = arr.length - 1;\n    while (left < right) {\n        int temp = arr[left];\n        arr[left] = arr[right];\n        arr[right] = temp;\n        left++; right--;\n    }\n}`;
        case 'cpp':
          return `void reverse(std::vector<int>& arr) {\n    int left = 0, right = arr.size() - 1;\n    while (left < right) {\n        std::swap(arr[left], arr[right]);\n        left++; right--;\n    }\n}`;
        case 'go':
          return `func reverse(arr []int) {\n    left, right := 0, len(arr)-1\n    for left < right {\n        arr[left], arr[right] = arr[right], arr[left]\n        left++\n        right--\n    }\n}`;
      }
    }

    if (op.includes('search')) {
      switch (lang) {
        case 'typescript':
          return `function search<T>(arr: T[], target: T): number {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] === target) return i;\n  }\n  return -1;\n}`;
        case 'javascript':
          return `function search(arr, target) {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] === target) return i;\n  }\n  return -1;\n}`;
        case 'python':
          return `def search(arr: list, target: int) -> int:\n    for i in range(len(arr)):\n        if arr[i] == target:\n            return i\n    return -1`;
        case 'java':
          return `public int search(int[] arr, int target) {\n    for (int i = 0; i < arr.length; i++) {\n        if (arr[i] == target) return i;\n    }\n    return -1;\n}`;
        case 'cpp':
          return `int search(const std::vector<int>& arr, int target) {\n    for (size_t i = 0; i < arr.size(); ++i) {\n        if (arr[i] == target) return i;\n    }\n    return -1;\n}`;
        case 'go':
          return `func search(arr []int, target int) int {\n    for i, v := range arr {\n        if v == target { return i }\n    }\n    return -1\n}`;
      }
    }
  }

  // =========================================================================
  // 2. LINKED LIST
  // =========================================================================
  if (dsType === 'linked-list') {
    if (op.includes('insert head')) {
      switch (lang) {
        case 'typescript':
          return `interface ListNode<T> {\n  val: T;\n  next: ListNode<T> | null;\n}\n\nfunction insertHead<T>(head: ListNode<T> | null, val: T): ListNode<T> {\n  return { val, next: head };\n}`;
        case 'javascript':
          return `function insertHead(head, val) {\n  const node = new ListNode(val);\n  node.next = head;\n  return node;\n}`;
        case 'python':
          return `class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef insert_head(head: ListNode | None, val: int) -> ListNode:\n    return ListNode(val, head)`;
        case 'java':
          return `public ListNode insertHead(ListNode head, int val) {\n    ListNode node = new ListNode(val);\n    node.next = head;\n    return node;\n}`;
        case 'cpp':
          return `ListNode* insertHead(ListNode* head, int val) {\n    ListNode* node = new ListNode(val);\n    node->next = head;\n    return node;\n}`;
        case 'go':
          return `func insertHead(head *ListNode, val int) *ListNode {\n    return &ListNode{Val: val, Next: head}\n}`;
      }
    }

    if (op.includes('insert tail')) {
      switch (lang) {
        case 'typescript':
          return `function insertTail<T>(head: ListNode<T> | null, val: T): ListNode<T> {\n  const node: ListNode<T> = { val, next: null };\n  if (!head) return node;\n  let curr = head;\n  while (curr.next) curr = curr.next;\n  curr.next = node;\n  return head;\n}`;
        case 'javascript':
          return `function insertTail(head, val) {\n  const node = new ListNode(val);\n  if (!head) return node;\n  let curr = head;\n  while (curr.next) curr = curr.next;\n  curr.next = node;\n  return head;\n}`;
        case 'python':
          return `def insert_tail(head: ListNode | None, val: int) -> ListNode:\n    node = ListNode(val)\n    if not head:\n        return node\n    curr = head\n    while curr.next:\n        curr = curr.next\n    curr.next = node\n    return head`;
        case 'java':
          return `public ListNode insertTail(ListNode head, int val) {\n    ListNode node = new ListNode(val);\n    if (head == null) return node;\n    ListNode curr = head;\n    while (curr.next != null) curr = curr.next;\n    curr.next = node;\n    return head;\n}`;
        case 'cpp':
          return `ListNode* insertTail(ListNode* head, int val) {\n    ListNode* node = new ListNode(val);\n    if (!head) return node;\n    ListNode* curr = head;\n    while (curr->next) curr = curr->next;\n    curr->next = node;\n    return head;\n}`;
        case 'go':
          return `func insertTail(head *ListNode, val int) *ListNode {\n    node := &ListNode{Val: val}\n    if head == nil { return node }\n    curr := head\n    for curr.Next != nil { curr = curr.Next }\n    curr.Next = node\n    return head\n}`;
      }
    }

    if (op.includes('insert at') || op.includes('index')) {
      switch (lang) {
        case 'typescript':
          return `function insertAt<T>(head: ListNode<T> | null, index: number, val: T): ListNode<T> {\n  if (index === 0) return { val, next: head };\n  let curr = head;\n  for (let i = 0; i < index - 1 && curr; i++) curr = curr.next;\n  if (curr) curr.next = { val, next: curr.next };\n  return head!;\n}`;
        case 'javascript':
          return `function insertAt(head, index, val) {\n  if (index === 0) {\n    const node = new ListNode(val);\n    node.next = head;\n    return node;\n  }\n  let curr = head;\n  for (let i = 0; i < index - 1 && curr; i++) curr = curr.next;\n  if (curr) {\n    const node = new ListNode(val);\n    node.next = curr.next;\n    curr.next = node;\n  }\n  return head;\n}`;
        case 'python':
          return `def insert_at(head: ListNode | None, index: int, val: int) -> ListNode | None:\n    if index == 0:\n        return ListNode(val, head)\n    curr = head\n    for _ in range(index - 1):\n        if not curr: break\n        curr = curr.next\n    if curr:\n        curr.next = ListNode(val, curr.next)\n    return head`;
        case 'java':
          return `public ListNode insertAt(ListNode head, int index, int val) {\n    if (index == 0) return new ListNode(val, head);\n    ListNode curr = head;\n    for (int i = 0; i < index - 1 && curr != null; i++) curr = curr.next;\n    if (curr != null) curr.next = new ListNode(val, curr.next);\n    return head;\n}`;
        case 'cpp':
          return `ListNode* insertAt(ListNode* head, int index, int val) {\n    if (index == 0) return new ListNode(val, head);\n    ListNode* curr = head;\n    for (int i = 0; i < index - 1 && curr; ++i) curr = curr->next;\n    if (curr) curr->next = new ListNode(val, curr->next);\n    return head;\n}`;
        case 'go':
          return `func insertAt(head *ListNode, index int, val int) *ListNode {\n    if index == 0 { return &ListNode{Val: val, Next: head} }\n    curr := head\n    for i := 0; i < index-1 && curr != nil; i++ { curr = curr.Next }\n    if curr != nil { curr.Next = &ListNode{Val: val, Next: curr.Next} }\n    return head\n}`;
      }
    }

    if (op.includes('delete')) {
      switch (lang) {
        case 'typescript':
          return `function deleteValue<T>(head: ListNode<T> | null, val: T): ListNode<T> | null {\n  if (!head) return null;\n  if (head.val === val) return head.next;\n  let curr = head;\n  while (curr.next && curr.next.val !== val) curr = curr.next;\n  if (curr.next) curr.next = curr.next.next;\n  return head;\n}`;
        case 'javascript':
          return `function deleteValue(head, val) {\n  if (!head) return null;\n  if (head.val === val) return head.next;\n  let curr = head;\n  while (curr.next && curr.next.val !== val) curr = curr.next;\n  if (curr.next) curr.next = curr.next.next;\n  return head;\n}`;
        case 'python':
          return `def delete_value(head: ListNode | None, val: int) -> ListNode | None:\n    if not head: return None\n    if head.val == val: return head.next\n    curr = head\n    while curr.next and curr.next.val != val:\n        curr = curr.next\n    if curr.next:\n        curr.next = curr.next.next\n    return head`;
        case 'java':
          return `public ListNode deleteValue(ListNode head, int val) {\n    if (head == null) return null;\n    if (head.val == val) return head.next;\n    ListNode curr = head;\n    while (curr.next != null && curr.next.val != val) curr = curr.next;\n    if (curr.next != null) curr.next = curr.next.next;\n    return head;\n}`;
        case 'cpp':
          return `ListNode* deleteValue(ListNode* head, int val) {\n    if (!head) return nullptr;\n    if (head->val == val) return head->next;\n    ListNode* curr = head;\n    while (curr->next && curr->next->val != val) curr = curr->next;\n    if (curr->next) curr->next = curr->next->next;\n    return head;\n}`;
        case 'go':
          return `func deleteValue(head *ListNode, val int) *ListNode {\n    if head == nil { return nil }\n    if head.Val == val { return head.Next }\n    curr := head\n    for curr.Next != nil && curr.Next.Val != val { curr = curr.Next }\n    if curr.Next != nil { curr.Next = curr.Next.Next }\n    return head\n}`;
      }
    }

    if (op.includes('reverse')) {
      switch (lang) {
        case 'typescript':
          return `function reverseList<T>(head: ListNode<T> | null): ListNode<T> | null {\n  let prev: ListNode<T> | null = null;\n  let curr = head;\n  while (curr) {\n    const next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}`;
        case 'javascript':
          return `function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    let next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}`;
        case 'python':
          return `def reverse_list(head: ListNode | None) -> ListNode | None:\n    prev, curr = None, head\n    while curr:\n        next_node = curr.next\n        curr.next = prev\n        prev = curr\n        curr = next_node\n    return prev`;
        case 'java':
          return `public ListNode reverseList(ListNode head) {\n    ListNode prev = null, curr = head;\n    while (curr != null) {\n        ListNode next = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = next;\n    }\n    return prev;\n}`;
        case 'cpp':
          return `ListNode* reverseList(ListNode* head) {\n    ListNode *prev = nullptr, *curr = head;\n    while (curr) {\n        ListNode* next = curr->next;\n        curr->next = prev;\n        prev = curr;\n        curr = next;\n    }\n    return prev;\n}`;
        case 'go':
          return `func reverseList(head *ListNode) *ListNode {\n    var prev *ListNode\n    curr := head\n    for curr != nil {\n        next := curr.Next\n        curr.Next = prev\n        prev = curr\n        curr = next\n    }\n    return prev\n}`;
      }
    }

    if (op.includes('search')) {
      switch (lang) {
        case 'typescript':
          return `function search<T>(head: ListNode<T> | null, val: T): ListNode<T> | null {\n  let curr = head;\n  while (curr) {\n    if (curr.val === val) return curr;\n    curr = curr.next;\n  }\n  return null;\n}`;
        case 'javascript':
          return `function search(head, val) {\n  let curr = head;\n  while (curr) {\n    if (curr.val === val) return curr;\n    curr = curr.next;\n  }\n  return null;\n}`;
        case 'python':
          return `def search(head: ListNode | None, val: int) -> ListNode | None:\n    curr = head\n    while curr:\n        if curr.val == val: return curr\n        curr = curr.next\n    return None`;
        case 'java':
          return `public ListNode search(ListNode head, int val) {\n    ListNode curr = head;\n    while (curr != null) {\n        if (curr.val == val) return curr;\n        curr = curr.next;\n    }\n    return null;\n}`;
        case 'cpp':
          return `ListNode* search(ListNode* head, int val) {\n    ListNode* curr = head;\n    while (curr) {\n        if (curr->val == val) return curr;\n        curr = curr->next;\n    }\n    return nullptr;\n}`;
        case 'go':
          return `func search(head *ListNode, val int) *ListNode {\n    curr := head\n    for curr != nil {\n        if curr.Val == val { return curr }\n        curr = curr.Next\n    }\n    return nil\n}`;
      }
    }
  }

  // =========================================================================
  // 3. STACK (LIFO)
  // =========================================================================
  if (dsType === 'stack') {
    if (op.includes('push')) {
      switch (lang) {
        case 'typescript':
          return `class Stack<T> {\n  private items: T[] = [];\n  push(val: T): void {\n    this.items.push(val);\n  }\n}`;
        case 'javascript':
          return `class Stack {\n  constructor() { this.items = []; }\n  push(val) {\n    this.items.push(val);\n  }\n}`;
        case 'python':
          return `class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, val: int) -> None:\n        self.items.append(val)`;
        case 'java':
          return `public class Stack<T> {\n    private Deque<T> stack = new ArrayDeque<>();\n    public void push(T val) {\n        stack.push(val);\n    }\n}`;
        case 'cpp':
          return `template<typename T>\nclass Stack {\n    std::vector<T> data;\npublic:\n    void push(const T& val) {\n        data.push_back(val);\n    }\n};`;
        case 'go':
          return `type Stack []int\n\nfunc (s *Stack) Push(val int) {\n    *s = append(*s, val)\n}`;
      }
    }

    if (op.includes('pop')) {
      switch (lang) {
        case 'typescript':
          return `pop(): T | undefined {\n  if (this.isEmpty()) return undefined;\n  return this.items.pop();\n}`;
        case 'javascript':
          return `pop() {\n  if (this.isEmpty()) return null;\n  return this.items.pop();\n}`;
        case 'python':
          return `def pop(self) -> int | None:\n    if not self.items:\n        return None\n    return self.items.pop()`;
        case 'java':
          return `public T pop() {\n    if (stack.isEmpty()) return null;\n    return stack.pop();\n}`;
        case 'cpp':
          return `T pop() {\n    if (data.empty()) throw std::out_of_range("Empty");\n    T val = data.back();\n    data.pop_back();\n    return val;\n}`;
        case 'go':
          return `func (s *Stack) Pop() (int, bool) {\n    if len(*s) == 0 { return 0, false }\n    top := (*s)[len(*s)-1]\n    *s = (*s)[:len(*s)-1]\n    return top, true\n}`;
      }
    }

    if (op.includes('peek')) {
      switch (lang) {
        case 'typescript':
          return `peek(): T | undefined {\n  return this.items[this.items.length - 1];\n}`;
        case 'javascript':
          return `peek() {\n  return this.items[this.items.length - 1];\n}`;
        case 'python':
          return `def peek(self) -> int | None:\n    return self.items[-1] if self.items else None`;
        case 'java':
          return `public T peek() {\n    return stack.peek();\n}`;
        case 'cpp':
          return `T peek() const {\n    return data.back();\n}`;
        case 'go':
          return `func (s *Stack) Peek() (int, bool) {\n    if len(*s) == 0 { return 0, false }\n    return (*s)[len(*s)-1], true\n}`;
      }
    }

    if (op.includes('clear')) {
      switch (lang) {
        case 'typescript':
          return `clear(): void {\n  this.items = [];\n}`;
        case 'javascript':
          return `clear() {\n  this.items.length = 0;\n}`;
        case 'python':
          return `def clear(self) -> None:\n    self.items.clear()`;
        case 'java':
          return `public void clear() {\n    stack.clear();\n}`;
        case 'cpp':
          return `void clear() {\n    data.clear();\n}`;
        case 'go':
          return `func (s *Stack) Clear() {\n    *s = (*s)[:0]\n}`;
      }
    }
  }

  // =========================================================================
  // 4. QUEUE & DEQUE
  // =========================================================================
  if (dsType === 'queue') {
    if (op.includes('enqueue') || (op.includes('push') && op.includes('rear'))) {
      switch (lang) {
        case 'typescript':
          return `function enqueue<T>(queue: T[], val: T): void {\n  queue.push(val); // Insert at rear\n}`;
        case 'javascript':
          return `function enqueue(queue, val) {\n  queue.push(val); // Insert at rear\n}`;
        case 'python':
          return `from collections import deque\n\nq = deque()\nq.append(val)  # Enqueue to rear`;
        case 'java':
          return `Queue<Integer> queue = new LinkedList<>();\nqueue.offer(val); // Enqueue at rear`;
        case 'cpp':
          return `std::queue<int> q;\nq.push(val); // Enqueue at rear`;
        case 'go':
          return `type Queue []int\n\nfunc (q *Queue) Enqueue(val int) {\n    *q = append(*q, val)\n}`;
      }
    }

    if (op.includes('dequeue')) {
      switch (lang) {
        case 'typescript':
          return `function dequeue<T>(queue: T[]): T | undefined {\n  return queue.shift(); // Remove from front\n}`;
        case 'javascript':
          return `function dequeue(queue) {\n  return queue.shift(); // Remove from front\n}`;
        case 'python':
          return `val = q.popleft() if q else None  # O(1) Dequeue from front`;
        case 'java':
          return `Integer val = queue.poll(); // Remove from front`;
        case 'cpp':
          return `int val = q.front();\nq.pop(); // Dequeue from front`;
        case 'go':
          return `func (q *Queue) Dequeue() (int, bool) {\n    if len(*q) == 0 { return 0, false }\n    front := (*q)[0]\n    *q = (*q)[1:]\n    return front, true\n}`;
      }
    }

    if (op.includes('push front') || (op.includes('deque') && op.includes('front'))) {
      switch (lang) {
        case 'typescript':
          return `function pushFront<T>(deque: T[], val: T): void {\n  deque.unshift(val);\n}`;
        case 'javascript':
          return `function pushFront(deque, val) {\n  deque.unshift(val);\n}`;
        case 'python':
          return `q.appendleft(val)  # Push to front of deque`;
        case 'java':
          return `Deque<Integer> deque = new ArrayDeque<>();\ndeque.addFirst(val); // Push front`;
        case 'cpp':
          return `std::deque<int> dq;\ndq.push_front(val);`;
        case 'go':
          return `func pushFront(dq *[]int, val int) {\n    *dq = append([]int{val}, *dq...)\n}`;
      }
    }

    if (op.includes('pop back') || (op.includes('deque') && op.includes('back'))) {
      switch (lang) {
        case 'typescript':
          return `function popBack<T>(deque: T[]): T | undefined {\n  return deque.pop();\n}`;
        case 'javascript':
          return `function popBack(deque) {\n  return deque.pop();\n}`;
        case 'python':
          return `val = q.pop()  # Pop back of deque`;
        case 'java':
          return `Integer val = deque.pollLast();`;
        case 'cpp':
          return `int val = dq.back();\ndq.pop_back();`;
        case 'go':
          return `func popBack(dq *[]int) int {\n    n := len(*dq)\n    val := (*dq)[n-1]\n    *dq = (*dq)[:n-1]\n    return val\n}`;
      }
    }

    if (op.includes('peek')) {
      switch (lang) {
        case 'typescript':
          return `function peek<T>(queue: T[]): T | undefined {\n  return queue[0];\n}`;
        case 'javascript':
          return `function peek(queue) {\n  return queue[0];\n}`;
        case 'python':
          return `def peek(q: deque) -> int | None:\n    return q[0] if q else None`;
        case 'java':
          return `public Integer peek(Queue<Integer> queue) {\n    return queue.peek();\n}`;
        case 'cpp':
          return `int peek(const std::queue<int>& q) {\n    return q.front();\n}`;
        case 'go':
          return `func peek(q []int) (int, bool) {\n    if len(q) == 0 { return 0, false }\n    return q[0], true\n}`;
      }
    }
  }

  // =========================================================================
  // 5. BINARY SEARCH TREE & TRIE
  // =========================================================================
  if (dsType === 'binary-search-tree') {
    if (op.includes('insert')) {
      switch (lang) {
        case 'typescript':
          return `interface TreeNode<T> {\n  val: T;\n  left: TreeNode<T> | null;\n  right: TreeNode<T> | null;\n}\n\nfunction insert<T>(root: TreeNode<T> | null, val: T): TreeNode<T> {\n  if (!root) return { val, left: null, right: null };\n  if (val < root.val) root.left = insert(root.left, val);\n  else if (val > root.val) root.right = insert(root.right, val);\n  return root;\n}`;
        case 'javascript':
          return `function insert(root, val) {\n  if (!root) return new TreeNode(val);\n  if (val < root.val) root.left = insert(root.left, val);\n  else if (val > root.val) root.right = insert(root.right, val);\n  return root;\n}`;
        case 'python':
          return `def insert(root: TreeNode | None, val: int) -> TreeNode:\n    if not root:\n        return TreeNode(val)\n    if val < root.val:\n        root.left = insert(root.left, val)\n    elif val > root.val:\n        root.right = insert(root.right, val)\n    return root`;
        case 'java':
          return `public TreeNode insert(TreeNode root, int val) {\n    if (root == null) return new TreeNode(val);\n    if (val < root.val) root.left = insert(root.left, val);\n    else if (val > root.val) root.right = insert(root.right, val);\n    return root;\n}`;
        case 'cpp':
          return `TreeNode* insert(TreeNode* root, int val) {\n    if (!root) return new TreeNode(val);\n    if (val < root->val) root->left = insert(root->left, val);\n    else if (val > root->val) root->right = insert(root->right, val);\n    return root;\n}`;
        case 'go':
          return `func insert(root *TreeNode, val int) *TreeNode {\n    if root == nil { return &TreeNode{Val: val} }\n    if val < root.Val { root.Left = insert(root.Left, val) }\n    else if val > root.Val { root.Right = insert(root.Right, val) }\n    return root\n}`;
      }
    }

    if (op.includes('search')) {
      switch (lang) {
        case 'typescript':
          return `function search<T>(root: TreeNode<T> | null, target: T): TreeNode<T> | null {\n  if (!root || root.val === target) return root;\n  if (target < root.val) return search(root.left, target);\n  return search(root.right, target);\n}`;
        case 'javascript':
          return `function search(root, target) {\n  if (!root || root.val === target) return root;\n  if (target < root.val) return search(root.left, target);\n  return search(root.right, target);\n}`;
        case 'python':
          return `def search(root: TreeNode | None, target: int) -> TreeNode | None:\n    if not root or root.val == target:\n        return root\n    if target < root.val:\n        return search(root.left, target)\n    return search(root.right, target)`;
        case 'java':
          return `public TreeNode search(TreeNode root, int target) {\n    if (root == null || root.val == target) return root;\n    if (target < root.val) return search(root.left, target);\n    return search(root.right, target);\n}`;
        case 'cpp':
          return `TreeNode* search(TreeNode* root, int target) {\n    if (!root || root->val == target) return root;\n    if (target < root->val) return search(root->left, target);\n    return search(root->right, target);\n}`;
        case 'go':
          return `func search(root *TreeNode, target int) *TreeNode {\n    if root == nil || root.Val == target { return root }\n    if target < root.Val { return search(root.Left, target) }\n    return search(root.Right, target)\n}`;
      }
    }

    if (op.includes('in-order') || op.includes('inorder')) {
      switch (lang) {
        case 'typescript':
          return `function inOrder<T>(root: TreeNode<T> | null, res: T[] = []): T[] {\n  if (!root) return res;\n  inOrder(root.left, res);\n  res.push(root.val);\n  inOrder(root.right, res);\n  return res;\n}`;
        case 'javascript':
          return `function inOrder(root, res = []) {\n  if (!root) return res;\n  inOrder(root.left, res);\n  res.push(root.val);\n  inOrder(root.right, res);\n  return res;\n}`;
        case 'python':
          return `def in_order(root: TreeNode | None) -> list[int]:\n    res = []\n    def traverse(node):\n        if not node: return\n        traverse(node.left)\n        res.append(node.val)\n        traverse(node.right)\n    traverse(root)\n    return res`;
        case 'java':
          return `public List<Integer> inOrder(TreeNode root) {\n    List<Integer> res = new ArrayList<>();\n    traverse(root, res);\n    return res;\n}\nprivate void traverse(TreeNode node, List<Integer> res) {\n    if (node == null) return;\n    traverse(node.left, res);\n    res.add(node.val);\n    traverse(node.right, res);\n}`;
        case 'cpp':
          return `void inOrder(TreeNode* root, std::vector<int>& res) {\n    if (!root) return;\n    inOrder(root->left, res);\n    res.push_back(root->val);\n    inOrder(root->right, res);\n}`;
        case 'go':
          return `func inOrder(root *TreeNode) []int {\n    var res []int\n    var traverse func(node *TreeNode)\n    traverse = func(node *TreeNode) {\n        if node == nil { return }\n        traverse(node.Left)\n        res = append(res, node.Val)\n        traverse(node.Right)\n    }\n    traverse(root)\n    return res\n}`;
      }
    }

    if (op.includes('pre-order') || op.includes('preorder')) {
      switch (lang) {
        case 'typescript':
          return `function preOrder<T>(root: TreeNode<T> | null, res: T[] = []): T[] {\n  if (!root) return res;\n  res.push(root.val);\n  preOrder(root.left, res);\n  preOrder(root.right, res);\n  return res;\n}`;
        case 'javascript':
          return `function preOrder(root, res = []) {\n  if (!root) return res;\n  res.push(root.val);\n  preOrder(root.left, res);\n  preOrder(root.right, res);\n  return res;\n}`;
        case 'python':
          return `def pre_order(root: TreeNode | None) -> list[int]:\n    if not root: return []\n    return [root.val] + pre_order(root.left) + pre_order(root.right)`;
        case 'java':
          return `public void preOrder(TreeNode root, List<Integer> res) {\n    if (root == null) return;\n    res.add(root.val);\n    preOrder(root.left, res);\n    preOrder(root.right, res);\n}`;
        case 'cpp':
          return `void preOrder(TreeNode* root, std::vector<int>& res) {\n    if (!root) return;\n    res.push_back(root->val);\n    preOrder(root->left, res);\n    preOrder(root->right, res);\n}`;
        case 'go':
          return `func preOrder(root *TreeNode) []int {\n    if root == nil { return nil }\n    res := []int{root.Val}\n    res = append(res, preOrder(root.Left)...)\n    res = append(res, preOrder(root.Right)...)\n    return res\n}`;
      }
    }

    if (op.includes('delete')) {
      switch (lang) {
        case 'typescript':
          return `function deleteNode<T>(root: TreeNode<T> | null, key: T): TreeNode<T> | null {\n  if (!root) return null;\n  if (key < root.val) root.left = deleteNode(root.left, key);\n  else if (key > root.val) root.right = deleteNode(root.right, key);\n  else {\n    if (!root.left) return root.right;\n    if (!root.right) return root.left;\n    let succ = root.right;\n    while (succ.left) succ = succ.left;\n    root.val = succ.val;\n    root.right = deleteNode(root.right, succ.val);\n  }\n  return root;\n}`;
        case 'javascript':
          return `function deleteNode(root, key) {\n  if (!root) return null;\n  if (key < root.val) root.left = deleteNode(root.left, key);\n  else if (key > root.val) root.right = deleteNode(root.right, key);\n  else {\n    if (!root.left) return root.right;\n    if (!root.right) return root.left;\n    let succ = root.right;\n    while (succ.left) succ = succ.left;\n    root.val = succ.val;\n    root.right = deleteNode(root.right, succ.val);\n  }\n  return root;\n}`;
        case 'python':
          return `def delete_node(root: TreeNode | None, key: int) -> TreeNode | None:\n    if not root: return None\n    if key < root.val:\n        root.left = delete_node(root.left, key)\n    elif key > root.val:\n        root.right = delete_node(root.right, key)\n    else:\n        if not root.left: return root.right\n        if not root.right: return root.left\n        succ = root.right\n        while succ.left: succ = succ.left\n        root.val = succ.val\n        root.right = delete_node(root.right, succ.val)\n    return root`;
        case 'java':
          return `public TreeNode deleteNode(TreeNode root, int key) {\n    if (root == null) return null;\n    if (key < root.val) root.left = deleteNode(root.left, key);\n    else if (key > root.val) root.right = deleteNode(root.right, key);\n    else {\n        if (root.left == null) return root.right;\n        if (root.right == null) return root.left;\n        TreeNode succ = root.right;\n        while (succ.left != null) succ = succ.left;\n        root.val = succ.val;\n        root.right = deleteNode(root.right, succ.val);\n    }\n    return root;\n}`;
        case 'cpp':
          return `TreeNode* deleteNode(TreeNode* root, int key) {\n    if (!root) return nullptr;\n    if (key < root->val) root->left = deleteNode(root->left, key);\n    else if (key > root->val) root->right = deleteNode(root->right, key);\n    else {\n        if (!root->left) return root->right;\n        if (!root->right) return root->left;\n        TreeNode* succ = root->right;\n        while (succ->left) succ = succ->left;\n        root->val = succ->val;\n        root->right = deleteNode(root->right, succ->val);\n    }\n    return root;\n}`;
        case 'go':
          return `func deleteNode(root *TreeNode, key int) *TreeNode {\n    if root == nil { return nil }\n    if key < root.Val { root.Left = deleteNode(root.Left, key) }\n    else if key > root.Val { root.Right = deleteNode(root.Right, key) }\n    else {\n        if root.Left == nil { return root.Right }\n        if root.Right == nil { return root.Left }\n        succ := root.Right\n        for succ.Left != nil { succ = succ.Left }\n        root.Val = succ.Val\n        root.Right = deleteNode(root.Right, succ.Val)\n    }\n    return root\n}`;
      }
    }
  }

  // =========================================================================
  // 6. BINARY HEAP (PRIORITY QUEUE)
  // =========================================================================
  if (dsType === 'min-heap') {
    if (op.includes('insert') || op.includes('bubble')) {
      switch (lang) {
        case 'typescript':
          return `function insert(heap: number[], val: number): void {\n  heap.push(val);\n  let i = heap.length - 1;\n  while (i > 0) {\n    const parent = Math.floor((i - 1) / 2);\n    if (heap[i] < heap[parent]) {\n      [heap[i], heap[parent]] = [heap[parent], heap[i]];\n      i = parent;\n    } else break;\n  }\n}`;
        case 'javascript':
          return `function insert(heap, val) {\n  heap.push(val);\n  let i = heap.length - 1;\n  while (i > 0) {\n    const p = Math.floor((i - 1) / 2);\n    if (heap[i] < heap[p]) {\n      [heap[i], heap[p]] = [heap[p], heap[i]];\n      i = p;\n    } else break;\n  }\n}`;
        case 'python':
          return `def bubble_up(heap: list[int], val: int) -> None:\n    heap.append(val)\n    i = len(heap) - 1\n    while i > 0:\n        p = (i - 1) // 2\n        if heap[i] < heap[p]:\n            heap[i], heap[p] = heap[p], heap[i]\n            i = p\n        else: break`;
        case 'java':
          return `public void insert(List<Integer> heap, int val) {\n    heap.add(val);\n    int i = heap.size() - 1;\n    while (i > 0) {\n        int p = (i - 1) / 2;\n        if (heap.get(i) < heap.get(p)) {\n            Collections.swap(heap, i, p);\n            i = p;\n        } else break;\n    }\n}`;
        case 'cpp':
          return `void insert(std::vector<int>& heap, int val) {\n    heap.push_back(val);\n    int i = heap.size() - 1;\n    while (i > 0) {\n        int p = (i - 1) / 2;\n        if (heap[i] < heap[p]) {\n            std::swap(heap[i], heap[p]);\n            i = p;\n        } else break;\n    }\n}`;
        case 'go':
          return `func insert(heap *[]int, val int) {\n    *heap = append(*heap, val)\n    i := len(*heap) - 1\n    for i > 0 {\n        p := (i - 1) / 2\n        if (*heap)[i] < (*heap)[p] {\n            (*heap)[i], (*heap)[p] = (*heap)[p], (*heap)[i]\n            i = p\n        } else { break }\n    }\n}`;
      }
    }

    if (op.includes('extract') || op.includes('sift') || op.includes('remove')) {
      switch (lang) {
        case 'typescript':
          return `function extractMin(heap: number[]): number | undefined {\n  if (heap.length === 0) return undefined;\n  const min = heap[0];\n  const last = heap.pop()!;\n  if (heap.length > 0) {\n    heap[0] = last;\n    siftDown(heap, 0);\n  }\n  return min;\n}\n\nfunction siftDown(heap: number[], i: number): void {\n  while (2 * i + 1 < heap.length) {\n    let small = 2 * i + 1;\n    if (small + 1 < heap.length && heap[small + 1] < heap[small]) small++;\n    if (heap[small] < heap[i]) {\n      [heap[i], heap[small]] = [heap[small], heap[i]];\n      i = small;\n    } else break;\n  }\n}`;
        case 'javascript':
          return `function extractMin(heap) {\n  if (heap.length === 0) return null;\n  const min = heap[0];\n  const last = heap.pop();\n  if (heap.length > 0) {\n    heap[0] = last;\n    siftDown(heap, 0);\n  }\n  return min;\n}`;
        case 'python':
          return `def extract_min(heap: list[int]) -> int | None:\n    if not heap: return None\n    min_val = heap[0]\n    last = heap.pop()\n    if heap:\n        heap[0] = last\n        sift_down(heap, 0)\n    return min_val`;
        case 'java':
          return `public int extractMin(List<Integer> heap) {\n    int min = heap.get(0);\n    int last = heap.remove(heap.size() - 1);\n    if (!heap.isEmpty()) {\n        heap.set(0, last);\n        siftDown(heap, 0);\n    }\n    return min;\n}`;
        case 'cpp':
          return `int extractMin(std::vector<int>& heap) {\n    int min = heap[0];\n    heap[0] = heap.back();\n    heap.pop_back();\n    if (!heap.empty()) siftDown(heap, 0);\n    return min;\n}`;
        case 'go':
          return `func extractMin(heap *[]int) (int, bool) {\n    if len(*heap) == 0 { return 0, false }\n    min := (*heap)[0]\n    last := (*heap)[len(*heap)-1]\n    *heap = (*heap)[:len(*heap)-1]\n    if len(*heap) > 0 {\n        (*heap)[0] = last\n        siftDown(*heap, 0)\n    }\n    return min, true\n}`;
      }
    }

    if (op.includes('peek')) {
      switch (lang) {
        case 'typescript':
          return `function peek(heap: number[]): number | undefined {\n  return heap[0]; // Min item at root in O(1)\n}`;
        case 'javascript':
          return `function peek(heap) {\n  return heap[0]; // Min item at root in O(1)\n}`;
        case 'python':
          return `def peek(heap: list[int]) -> int | None:\n    return heap[0] if heap else None`;
        case 'java':
          return `public Integer peek(List<Integer> heap) {\n    return heap.isEmpty() ? null : heap.get(0);\n}`;
        case 'cpp':
          return `int peek(const std::vector<int>& heap) {\n    return heap.front();\n}`;
        case 'go':
          return `func peek(heap []int) (int, bool) {\n    if len(heap) == 0 { return 0, false }\n    return heap[0], true\n}`;
      }
    }

    if (op.includes('heapify')) {
      switch (lang) {
        case 'typescript':
          return `function heapify(arr: number[]): void {\n  // Bottom-up linear time heap construction O(N)\n  for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {\n    siftDown(arr, i);\n  }\n}`;
        case 'javascript':
          return `function heapify(arr) {\n  for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {\n    siftDown(arr, i);\n  }\n}`;
        case 'python':
          return `import heapq\n\ndef build_heap(arr: list[int]) -> None:\n    heapq.heapify(arr)  # Linear time O(N)`;
        case 'java':
          return `public void heapify(int[] arr) {\n    for (int i = arr.length / 2 - 1; i >= 0; i--) {\n        siftDown(arr, i, arr.length);\n    }\n}`;
        case 'cpp':
          return `void heapify(std::vector<int>& arr) {\n    std::make_heap(arr.begin(), arr.end(), std::greater<>{});\n}`;
        case 'go':
          return `func heapify(arr []int) {\n    for i := len(arr)/2 - 1; i >= 0; i-- {\n        siftDown(arr, i)\n    }\n}`;
      }
    }
  }

  // =========================================================================
  // 7. HASH TABLE & MAP
  // =========================================================================
  if (dsType === 'hash-map') {
    if (op.includes('put') || op.includes('insert') || op.includes('set')) {
      switch (lang) {
        case 'typescript':
          return `function put(key: string, val: number): void {\n  const idx = hash(key) % BUCKET_COUNT;\n  const bucket = buckets[idx];\n  const entry = bucket.find(e => e.key === key);\n  if (entry) entry.val = val;\n  else bucket.push({ key, val });\n}`;
        case 'javascript':
          return `function put(key, val) {\n  const idx = hash(key) % BUCKET_COUNT;\n  const bucket = buckets[idx];\n  const entry = bucket.find(e => e.key === key);\n  if (entry) entry.val = val;\n  else bucket.push({ key, val });\n}`;
        case 'python':
          return `def put(key: str, val: int) -> None:\n    idx = hash(key) % len(buckets)\n    for entry in buckets[idx]:\n        if entry[0] == key:\n            entry[1] = val\n            return\n    buckets[idx].append([key, val])`;
        case 'java':
          return `public void put(String key, int val) {\n    int idx = Math.abs(key.hashCode()) % buckets.length;\n    for (Entry e : buckets[idx]) {\n        if (e.key.equals(key)) { e.val = val; return; }\n    }\n    buckets[idx].add(new Entry(key, val));\n}`;
        case 'cpp':
          return `void put(const std::string& key, int val) {\n    size_t idx = std::hash<std::string>{}(key) % buckets.size();\n    for (auto& entry : buckets[idx]) {\n        if (entry.first == key) { entry.second = val; return; }\n    }\n    buckets[idx].emplace_back(key, val);\n}`;
        case 'go':
          return `func (m *HashMap) Put(key string, val int) {\n    idx := hash(key) % len(m.buckets)\n    for i, e := range m.buckets[idx] {\n        if e.Key == key { m.buckets[idx][i].Val = val; return }\n    }\n    m.buckets[idx] = append(m.buckets[idx], Entry{key, val})\n}`;
      }
    }

    if (op.includes('get') || op.includes('search')) {
      switch (lang) {
        case 'typescript':
          return `function get(key: string): number | undefined {\n  const idx = hash(key) % BUCKET_COUNT;\n  const entry = buckets[idx].find(e => e.key === key);\n  return entry ? entry.val : undefined;\n}`;
        case 'javascript':
          return `function get(key) {\n  const idx = hash(key) % BUCKET_COUNT;\n  const entry = buckets[idx].find(e => e.key === key);\n  return entry ? entry.val : undefined;\n}`;
        case 'python':
          return `def get(key: str) -> int | None:\n    idx = hash(key) % len(buckets)\n    for entry in buckets[idx]:\n        if entry[0] == key: return entry[1]\n    return None`;
        case 'java':
          return `public Integer get(String key) {\n    int idx = Math.abs(key.hashCode()) % buckets.length;\n    for (Entry e : buckets[idx]) {\n        if (e.key.equals(key)) return e.val;\n    }\n    return null;\n}`;
        case 'cpp':
          return `int* get(const std::string& key) {\n    size_t idx = std::hash<std::string>{}(key) % buckets.size();\n    for (auto& entry : buckets[idx]) {\n        if (entry.first == key) return &entry.second;\n    }\n    return nullptr;\n}`;
        case 'go':
          return `func (m *HashMap) Get(key string) (int, bool) {\n    idx := hash(key) % len(m.buckets)\n    for _, e := range m.buckets[idx] {\n        if e.Key == key { return e.Val, true }\n    }\n    return 0, false\n}`;
      }
    }

    if (op.includes('remove') || op.includes('delete')) {
      switch (lang) {
        case 'typescript':
          return `function remove(key: string): boolean {\n  const idx = hash(key) % BUCKET_COUNT;\n  const bucket = buckets[idx];\n  const i = bucket.findIndex(e => e.key === key);\n  if (i !== -1) {\n    bucket.splice(i, 1);\n    return true;\n  }\n  return false;\n}`;
        case 'javascript':
          return `function remove(key) {\n  const idx = hash(key) % BUCKET_COUNT;\n  const bucket = buckets[idx];\n  const i = bucket.findIndex(e => e.key === key);\n  if (i !== -1) {\n    bucket.splice(i, 1);\n    return true;\n  }\n  return false;\n}`;
        case 'python':
          return `def remove(key: str) -> bool:\n    idx = hash(key) % len(buckets)\n    bucket = buckets[idx]\n    for i, entry in enumerate(bucket):\n        if entry[0] == key:\n            del bucket[i]\n            return True\n    return False`;
        case 'java':
          return `public boolean remove(String key) {\n    int idx = Math.abs(key.hashCode()) % buckets.length;\n    return buckets[idx].removeIf(e -> e.key.equals(key));\n}`;
        case 'cpp':
          return `bool remove(const std::string& key) {\n    size_t idx = std::hash<std::string>{}(key) % buckets.size();\n    auto& b = buckets[idx];\n    for (auto it = b.begin(); it != b.end(); ++it) {\n        if (it->first == key) { b.erase(it); return true; }\n    }\n    return false;\n}`;
        case 'go':
          return `func (m *HashMap) Remove(key string) bool {\n    idx := hash(key) % len(m.buckets)\n    b := m.buckets[idx]\n    for i, e := range b {\n        if e.Key == key {\n            m.buckets[idx] = append(b[:i], b[i+1:]...)\n            return true\n        }\n    }\n    return false\n}`;
      }
    }

    if (op.includes('rehash') || op.includes('resize')) {
      switch (lang) {
        case 'typescript':
          return `function rehash(): void {\n  const oldBuckets = buckets;\n  buckets = Array.from({ length: oldBuckets.length * 2 }, () => []);\n  for (const bucket of oldBuckets) {\n    for (const entry of bucket) {\n      put(entry.key, entry.val);\n    }\n  }\n}`;
        case 'javascript':
          return `function rehash() {\n  const old = buckets;\n  buckets = Array.from({ length: old.length * 2 }, () => []);\n  for (const b of old) {\n    for (const e of b) put(e.key, e.val);\n  }\n}`;
        case 'python':
          return `def rehash(self) -> None:\n    old_buckets = self.buckets\n    self.buckets = [[] for _ in range(len(old_buckets) * 2)]\n    for bucket in old_buckets:\n        for key, val in bucket:\n            self.put(key, val)`;
        case 'java':
          return `private void rehash() {\n    List<Entry>[] old = buckets;\n    buckets = new List[old.length * 2];\n    for (int i = 0; i < buckets.length; i++) buckets[i] = new ArrayList<>();\n    for (List<Entry> b : old) for (Entry e : b) put(e.key, e.val);\n}`;
        case 'cpp':
          return `void rehash() {\n    auto old = std::move(buckets);\n    buckets.resize(old.size() * 2);\n    for (const auto& b : old) for (const auto& e : b) put(e.first, e.second);\n}`;
        case 'go':
          return `func (m *HashMap) rehash() {\n    old := m.buckets\n    m.buckets = make([][]Entry, len(old)*2)\n    for _, b := range old { for _, e := range b { m.Put(e.Key, e.Val) } }\n}`;
      }
    }
  }

  // =========================================================================
  // 8. GRAPH NETWORK
  // =========================================================================
  if (dsType === 'graph') {
    if (op.includes('bfs') || op.includes('breadth')) {
      switch (lang) {
        case 'typescript':
          return `function bfs(graph: Record<string, string[]>, start: string): string[] {\n  const visited = new Set<string>([start]);\n  const queue: string[] = [start];\n  const order: string[] = [];\n  while (queue.length > 0) {\n    const u = queue.shift()!;\n    order.push(u);\n    for (const v of graph[u] ?? []) {\n      if (!visited.has(v)) {\n        visited.add(v);\n        queue.push(v);\n      }\n    }\n  }\n  return order;\n}`;
        case 'javascript':
          return `function bfs(graph, start) {\n  const visited = new Set([start]);\n  const queue = [start], order = [];\n  while (queue.length > 0) {\n    const u = queue.shift();\n    order.push(u);\n    for (const v of graph[u] || []) {\n      if (!visited.has(v)) {\n        visited.add(v);\n        queue.push(v);\n      }\n    }\n  }\n  return order;\n}`;
        case 'python':
          return `from collections import deque\n\ndef bfs(graph: dict[str, list[str]], start: str) -> list[str]:\n    visited = {start}\n    queue = deque([start])\n    order = []\n    while queue:\n        u = queue.popleft()\n        order.append(u)\n        for v in graph.get(u, []):\n            if v not in visited:\n                visited.add(v)\n                queue.append(v)\n    return order`;
        case 'java':
          return `public List<String> bfs(Map<String, List<String>> graph, String start) {\n    Set<String> visited = new HashSet<>();\n    Queue<String> queue = new ArrayDeque<>();\n    List<String> order = new ArrayList<>();\n    visited.add(start);\n    queue.offer(start);\n    while (!queue.isEmpty()) {\n        String u = queue.poll();\n        order.add(u);\n        for (String v : graph.getOrDefault(u, List.of())) {\n            if (visited.add(v)) queue.offer(v);\n        }\n    }\n    return order;\n}`;
        case 'cpp':
          return `std::vector<std::string> bfs(const std::map<std::string, std::vector<std::string>>& graph, const std::string& start) {\n    std::set<std::string> visited{start};\n    std::queue<std::string> q; q.push(start);\n    std::vector<std::string> order;\n    while (!q.empty()) {\n        auto u = q.front(); q.pop();\n        order.push_back(u);\n        if (auto it = graph.find(u); it != graph.end()) {\n            for (const auto& v : it->second) {\n                if (visited.insert(v).second) q.push(v);\n            }\n        }\n    }\n    return order;\n}`;
        case 'go':
          return `func bfs(graph map[string][]string, start string) []string {\n    visited := map[string]bool{start: true}\n    queue := []string{start}\n    var order []string\n    for len(queue) > 0 {\n        u := queue[0]\n        queue = queue[1:]\n        order = append(order, u)\n        for _, v := range graph[u] {\n            if !visited[v] {\n                visited[v] = true\n                queue = append(queue, v)\n            }\n        }\n    }\n    return order\n}`;
      }
    }

    if (op.includes('dfs') || op.includes('depth')) {
      switch (lang) {
        case 'typescript':
          return `function dfs(graph: Record<string, string[]>, u: string, visited = new Set<string>()): void {\n  visited.add(u);\n  for (const v of graph[u] ?? []) {\n    if (!visited.has(v)) dfs(graph, v, visited);\n  }\n}`;
        case 'javascript':
          return `function dfs(graph, u, visited = new Set()) {\n  visited.add(u);\n  for (const v of graph[u] || []) {\n    if (!visited.has(v)) dfs(graph, v, visited);\n  }\n}`;
        case 'python':
          return `def dfs(graph: dict[str, list[str]], u: str, visited: set[str] = None) -> None:\n    if visited is None: visited = set()\n    visited.add(u)\n    for v in graph.get(u, []):\n        if v not in visited:\n            dfs(graph, v, visited)`;
        case 'java':
          return `public void dfs(Map<String, List<String>> graph, String u, Set<String> visited) {\n    visited.add(u);\n    for (String v : graph.getOrDefault(u, List.of())) {\n        if (!visited.contains(v)) dfs(graph, v, visited);\n    }\n}`;
        case 'cpp':
          return `void dfs(const std::map<std::string, std::vector<std::string>>& graph, const std::string& u, std::set<std::string>& visited) {\n    visited.insert(u);\n    if (auto it = graph.find(u); it != graph.end()) {\n        for (const auto& v : it->second) {\n            if (!visited.count(v)) dfs(graph, v, visited);\n        }\n    }\n}`;
        case 'go':
          return `func dfs(graph map[string][]string, u string, visited map[string]bool) {\n    visited[u] = true\n    for _, v := range graph[u] {\n        if !visited[v] { dfs(graph, v, visited) }\n    }\n}`;
      }
    }

    if (op.includes('vertex')) {
      switch (lang) {
        case 'typescript':
          return `function addVertex(graph: Record<string, string[]>, v: string): void {\n  if (!graph[v]) graph[v] = [];\n}`;
        case 'javascript':
          return `function addVertex(graph, v) {\n  if (!graph[v]) graph[v] = [];\n}`;
        case 'python':
          return `def add_vertex(graph: dict[str, list[str]], v: str) -> None:\n    if v not in graph: graph[v] = []`;
        case 'java':
          return `public void addVertex(Map<String, List<String>> graph, String v) {\n    graph.putIfAbsent(v, new ArrayList<>());\n}`;
        case 'cpp':
          return `void addVertex(std::map<std::string, std::vector<std::string>>& graph, const std::string& v) {\n    graph[v];\n}`;
        case 'go':
          return `func addVertex(graph map[string][]string, v string) {\n    if _, ok := graph[v]; !ok { graph[v] = []string{} }\n}`;
      }
    }

    if (op.includes('edge')) {
      switch (lang) {
        case 'typescript':
          return `function addEdge(graph: Record<string, string[]>, u: string, v: string): void {\n  if (!graph[u]) graph[u] = [];\n  if (!graph[v]) graph[v] = [];\n  graph[u].push(v);\n  graph[v].push(u);\n}`;
        case 'javascript':
          return `function addEdge(graph, u, v) {\n  if (!graph[u]) graph[u] = [];\n  if (!graph[v]) graph[v] = [];\n  graph[u].push(v);\n  graph[v].push(u);\n}`;
        case 'python':
          return `def add_edge(graph: dict[str, list[str]], u: str, v: str) -> None:\n    graph.setdefault(u, []).append(v)\n    graph.setdefault(v, []).append(u)`;
        case 'java':
          return `public void addEdge(Map<String, List<String>> graph, String u, String v) {\n    graph.computeIfAbsent(u, k -> new ArrayList<>()).add(v);\n    graph.computeIfAbsent(v, k -> new ArrayList<>()).add(u);\n}`;
        case 'cpp':
          return `void addEdge(std::map<std::string, std::vector<std::string>>& graph, const std::string& u, const std::string& v) {\n    graph[u].push_back(v);\n    graph[v].push_back(u);\n}`;
        case 'go':
          return `func addEdge(graph map[string][]string, u, v string) {\n    graph[u] = append(graph[u], v)\n    graph[v] = append(graph[v], u)\n}`;
      }
    }

    if (op.includes('dijkstra') || op.includes('shortest')) {
      switch (lang) {
        case 'typescript':
          return `function dijkstra(graph: Record<string, [string, number][]>, start: string): Record<string, number> {\n  const dist: Record<string, number> = { [start]: 0 };\n  const pq = new PriorityQueue(); // [node, cost]\n  pq.enqueue(start, 0);\n  while (!pq.isEmpty()) {\n    const [u, d] = pq.dequeue();\n    if (d > (dist[u] ?? Infinity)) continue;\n    for (const [v, w] of graph[u] ?? []) {\n      if (d + w < (dist[v] ?? Infinity)) {\n        dist[v] = d + w;\n        pq.enqueue(v, dist[v]);\n      }\n    }\n  }\n  return dist;\n}`;
        case 'javascript':
          return `function dijkstra(graph, start) {\n  const dist = { [start]: 0 };\n  const pq = new PriorityQueue();\n  pq.enqueue(start, 0);\n  while (!pq.isEmpty()) {\n    const [u, d] = pq.dequeue();\n    for (const [v, w] of graph[u] || []) {\n      if (d + w < (dist[v] ?? Infinity)) {\n        dist[v] = d + w;\n        pq.enqueue(v, dist[v]);\n      }\n    }\n  }\n  return dist;\n}`;
        case 'python':
          return `import heapq\n\ndef dijkstra(graph: dict[str, list[tuple[str, int]]], start: str) -> dict[str, int]:\n    dist = {start: 0}\n    pq = [(0, start)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if d > dist.get(u, float('inf')): continue\n        for v, w in graph.get(u, []):\n            if d + w < dist.get(v, float('inf')):\n                dist[v] = d + w\n                heapq.heappush(pq, (d + w, v))\n    return dist`;
        case 'java':
          return `public Map<String, Integer> dijkstra(Map<String, List<Edge>> graph, String start) {\n    Map<String, Integer> dist = new HashMap<>();\n    dist.put(start, 0);\n    PriorityQueue<Node> pq = new PriorityQueue<>(Comparator.comparingInt(n -> n.dist));\n    pq.offer(new Node(start, 0));\n    while (!pq.isEmpty()) {\n        Node curr = pq.poll();\n        for (Edge e : graph.getOrDefault(curr.id, List.of())) {\n            if (curr.dist + e.weight < dist.getOrDefault(e.to, Integer.MAX_VALUE)) {\n                dist.put(e.to, curr.dist + e.weight);\n                pq.offer(new Node(e.to, dist.get(e.to)));\n            }\n        }\n    }\n    return dist;\n}`;
        case 'cpp':
          return `std::map<std::string, int> dijkstra(const auto& graph, const std::string& start) {\n    std::map<std::string, int> dist{{start, 0}};\n    std::priority_queue<std::pair<int, std::string>, std::vector<std::pair<int, std::string>>, std::greater<>> pq;\n    pq.emplace(0, start);\n    while (!pq.empty()) {\n        auto [d, u] = pq.top(); pq.pop();\n        for (const auto& [v, w] : graph.at(u)) {\n            if (!dist.count(v) || d + w < dist[v]) {\n                dist[v] = d + w;\n                pq.emplace(d + w, v);\n            }\n        }\n    }\n    return dist;\n}`;
        case 'go':
          return `func dijkstra(graph map[string][]Edge, start string) map[string]int {\n    dist := map[string]int{start: 0}\n    pq := PriorityQueue{{start, 0}}\n    for len(pq) > 0 {\n        curr := pq.Pop()\n        for _, e := range graph[curr.Node] {\n            if d, ok := dist[e.To]; !ok || curr.Dist + e.Weight < d {\n                dist[e.To] = curr.Dist + e.Weight\n                pq.Push(Node{e.To, dist[e.To]})\n            }\n        }\n    }\n    return dist\n}`;
      }
    }
  }

  // Fallback default
  switch (lang) {
    case 'typescript':
      return `function execute<T>(structure: T, val: number): void {\n  // Execute ${operation}\n}`;
    case 'javascript':
      return `function execute(structure, val) {\n  // Execute ${operation}\n}`;
    case 'python':
      return `def execute(structure, val: int) -> None:\n    # Execute ${operation}\n    pass`;
    case 'java':
      return `public void execute(Object structure, int val) {\n    // Execute ${operation}\n}`;
    case 'cpp':
      return `void execute(auto& structure, int val) {\n    // Execute ${operation}\n}`;
    case 'go':
      return `func execute(structure any, val int) {\n    // Execute ${operation}\n}`;
  }
}
