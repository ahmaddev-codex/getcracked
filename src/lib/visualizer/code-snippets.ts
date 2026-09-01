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
  // 1. ARRAY
  if (dsType === 'array') {
    if (operation.includes('Push')) {
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
    if (operation.includes('Pop')) {
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
    if (operation.includes('Insert at Index')) {
      switch (lang) {
        case 'typescript':
          return `function insertAt<T>(arr: T[], index: number, val: T): void {\n  for (let i: number = arr.length; i > index; i--) {\n    arr[i] = arr[i - 1]; // Shift right\n  }\n  arr[index] = val;\n}`;
        case 'javascript':
          return `function insertAt(arr, index, val) {\n  for (let i = arr.length; i > index; i--) {\n    arr[i] = arr[i - 1]; // Shift right\n  }\n  arr[index] = val;\n}`;
        case 'python':
          return `def insert_at(arr: list, index: int, val: int) -> None:\n    arr.append(0) # Make room\n    for i in range(len(arr) - 1, index, -1):\n        arr[i] = arr[i - 1]\n    arr[index] = val`;
        case 'java':
          return `public void insertAt(int[] arr, int index, int val, int size) {\n    for (int i = size; i > index; i--) {\n        arr[i] = arr[i - 1]; // Shift right\n    }\n    arr[index] = val;\n}`;
        case 'cpp':
          return `void insertAt(std::vector<int>& arr, int index, int val) {\n    arr.push_back(0);\n    for (int i = arr.size() - 1; i > index; --i) {\n        arr[i] = arr[i - 1]; // Shift right\n    }\n    arr[index] = val;\n}`;
        case 'go':
          return `func insertAt(arr []int, index int, val int) []int {\n    arr = append(arr, 0)\n    for i := len(arr) - 1; i > index; i-- {\n        arr[i] = arr[i-1]\n    }\n    arr[index] = val\n    return arr\n}`;
      }
    }
    if (operation.includes('Delete at Index')) {
      switch (lang) {
        case 'typescript':
          return `function deleteAt<T>(arr: T[], index: number): T | undefined {\n  const removed: T = arr[index];\n  for (let i: number = index; i < arr.length - 1; i++) {\n    arr[i] = arr[i + 1]; // Shift left\n  }\n  arr.length--;\n  return removed;\n}`;
        case 'javascript':
          return `function deleteAt(arr, index) {\n  const removed = arr[index];\n  for (let i = index; i < arr.length - 1; i++) {\n    arr[i] = arr[i + 1]; // Shift left\n  }\n  arr.length--;\n  return removed;\n}`;
        case 'python':
          return `def delete_at(arr: list, index: int) -> int:\n    removed = arr[index]\n    for i in range(index, len(arr) - 1):\n        arr[i] = arr[i + 1]\n    arr.pop()\n    return removed`;
        case 'java':
          return `public int deleteAt(int[] arr, int index, int size) {\n    int removed = arr[index];\n    for (int i = index; i < size - 1; i++) {\n        arr[i] = arr[i + 1]; // Shift left\n    }\n    return removed;\n}`;
        case 'cpp':
          return `int deleteAt(std::vector<int>& arr, int index) {\n    int removed = arr[index];\n    for (int i = index; i < arr.size() - 1; ++i) {\n        arr[i] = arr[i + 1];\n    }\n    arr.pop_back();\n    return removed;\n}`;
        case 'go':
          return `func deleteAt(arr []int, index int) ([]int, int) {\n    removed := arr[index]\n    for i := index; i < len(arr)-1; i++ {\n        arr[i] = arr[i+1]\n    }\n    return arr[:len(arr)-1], removed\n}`;
      }
    }
    if (operation.toLowerCase().includes('reverse')) {
      switch (lang) {
        case 'typescript':
          return `function reverse<T>(arr: T[]): void {\n  let left: number = 0, right: number = arr.length - 1;\n  while (left < right) {\n    [arr[left], arr[right]] = [arr[right], arr[left]];\n    left++; right--;\n  }\n}`;
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
    if (operation.includes('Search')) {
      switch (lang) {
        case 'typescript':
          return `function search<T>(arr: T[], target: T): number {\n  for (let i: number = 0; i < arr.length; i++) {\n    if (arr[i] === target) return i;\n  }\n  return -1;\n}`;
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

  // 2. LINKED LIST
  if (dsType === 'linked-list') {
    if (operation.includes('Insert Head')) {
      switch (lang) {
        case 'typescript':
          return `interface ListNode<T> {\n  val: T;\n  next: ListNode<T> | null;\n}\n\nfunction insertHead<T>(head: ListNode<T> | null, val: T): ListNode<T> {\n  const node: ListNode<T> = { val, next: head };\n  return node;\n}`;
        case 'javascript':
          return `function insertHead(head, val) {\n  const node = new ListNode(val);\n  node.next = head;\n  return node;\n}`;
        case 'python':
          return `class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef insert_head(head: ListNode, val: int) -> ListNode:\n    return ListNode(val, head)`;
        case 'java':
          return `public ListNode insertHead(ListNode head, int val) {\n    ListNode node = new ListNode(val);\n    node.next = head;\n    return node;\n}`;
        case 'cpp':
          return `ListNode* insertHead(ListNode* head, int val) {\n    ListNode* node = new ListNode(val);\n    node->next = head;\n    return node;\n}`;
        case 'go':
          return `type ListNode struct {\n    Val  int\n    Next *ListNode\n}\n\nfunc insertHead(head *ListNode, val int) *ListNode {\n    return &ListNode{Val: val, Next: head}\n}`;
      }
    }
    if (operation.includes('Reverse')) {
      switch (lang) {
        case 'typescript':
          return `function reverseList<T>(head: ListNode<T> | null): ListNode<T> | null {\n  let prev: ListNode<T> | null = null;\n  let curr: ListNode<T> | null = head;\n  while (curr) {\n    const next: ListNode<T> | null = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}`;
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
  }

  // 3. BINARY SEARCH TREE
  if (dsType === 'binary-search-tree') {
    if (operation.includes('Insert')) {
      switch (lang) {
        case 'typescript':
          return `interface TreeNode<T> {\n  val: T;\n  left: TreeNode<T> | null;\n  right: TreeNode<T> | null;\n}\n\nfunction insert<T>(root: TreeNode<T> | null, val: T): TreeNode<T> {\n  if (!root) return { val, left: null, right: null };\n  if (val < root.val) root.left = insert(root.left, val);\n  else root.right = insert(root.right, val);\n  return root;\n}`;
        case 'javascript':
          return `function insert(root, val) {\n  if (!root) return new TreeNode(val);\n  if (val < root.val) root.left = insert(root.left, val);\n  else root.right = insert(root.right, val);\n  return root;\n}`;
        case 'python':
          return `def insert(root: TreeNode | None, val: int) -> TreeNode:\n    if not root:\n        return TreeNode(val)\n    if val < root.val:\n        root.left = insert(root.left, val)\n    else:\n        root.right = insert(root.right, val)\n    return root`;
        case 'java':
          return `public TreeNode insert(TreeNode root, int val) {\n    if (root == null) return new TreeNode(val);\n    if (val < root.val) root.left = insert(root.left, val);\n    else root.right = insert(root.right, val);\n    return root;\n}`;
        case 'cpp':
          return `TreeNode* insert(TreeNode* root, int val) {\n    if (!root) return new TreeNode(val);\n    if (val < root->val) root->left = insert(root->left, val);\n    else root->right = insert(root->right, val);\n    return root;\n}`;
        case 'go':
          return `func insert(root *TreeNode, val int) *TreeNode {\n    if root == nil { return &TreeNode{Val: val} }\n    if val < root.Val { root.Left = insert(root.Left, val) }\n    else { root.Right = insert(root.Right, val) }\n    return root\n}`;
      }
    }
    if (operation.includes('Search')) {
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
  }

  // Fallback default
  switch (lang) {
    case 'typescript':
      return `// TypeScript Implementation\nfunction execute<T>(structure: T, val: number): void {\n  // Type-safe operation on structure\n}`;
    case 'javascript':
      return `// JavaScript Implementation\nfunction execute(structure, val) {\n  // Standard operation\n}`;
    case 'python':
      return `# Python Implementation\ndef execute(structure, val):\n    # Pythonic operation\n    pass`;
    case 'java':
      return `// Java Implementation\npublic void execute(Object structure, int val) {\n    // Strongly typed operation\n}`;
    case 'cpp':
      return `// C++ Implementation\nvoid execute(auto& structure, int val) {\n    // STL operation\n}`;
    case 'go':
      return `// Go Implementation\nfunc execute(structure any, val int) {\n    // Go routine safe operation\n}`;
  }
}
