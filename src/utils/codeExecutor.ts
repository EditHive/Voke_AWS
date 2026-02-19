
// Definition for singly-linked list.
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
  }
}

// Helper: Convert Array to Linked List
function arrayToList(arr: number[]): ListNode | null {
  if (arr.length === 0) return null;
  let head = new ListNode(arr[0]);
  let current = head;
  for (let i = 1; i < arr.length; i++) {
    current.next = new ListNode(arr[i]);
    current = current.next;
  }
  return head;
}

// Helper: Convert Linked List to Array
function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  let current = head;
  while (current !== null && result.length < 1000) { // Safety break
    result.push(current.val);
    current = current.next;
  }
  return result;
}

export type ExecutionResult = {
  passed: boolean;
  logs: string[];
  results: {
    caseId: number;
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }[];
  error?: string;
};

export const executeCode = (userCode: string, language: 'javascript' | 'python' | 'bash'): ExecutionResult => {
  if (language !== 'javascript') {
    return {
      passed: false,
      logs: ["Execution for Python/Bash is currently simulated."],
      results: [],
      error: "Only JavaScript execution is supported in this browser environment currently."
    };
  }

  const logs: string[] = [];
  const originalConsoleLog = console.log;
  
  // Capture console.log
  const mockConsole = {
    log: (...args: any[]) => {
      logs.push(args.map(a => 
        typeof a === 'object' ? JSON.stringify(a) : String(a)
      ).join(' '));
    },
    error: (...args: any[]) => {
      logs.push("Error: " + args.map(a => String(a)).join(' '));
    }
  };

  // Test Cases
  const testCases = [
    { input: [1, 2, 3, 4, 5], expected: [5, 4, 3, 2, 1] },
    { input: [1, 2], expected: [2, 1] },
    { input: [], expected: [] }
  ];

  const results: ExecutionResult['results'] = [];
  let allPassed = true;

  try {
    // 1. Prepare the user's function
    // We wrap it to ensure it returns the function or executes it
    // The user code is expected to be: "function reverseList(head) { ... }"
    
    // We construct a Function that takes logging/classes and returns the user's reverseList
    // We append "; return reverseList;" to ensure we get the handle
    
    const factory = new Function('ListNode', 'console', `
      ${userCode}
      if (typeof reverseList !== 'function') {
        throw new Error("Function 'reverseList' not found. Please do not change the function name.");
      }
      return reverseList;
    `);

    const userFunction = factory(ListNode, mockConsole);

    // 2. Run Test Cases
    testCases.forEach((tc, index) => {
      // Create fresh input per test case to avoid mutation issues
      const inputList = arrayToList(tc.input);
      
      try {
        const outputList = userFunction(inputList);
        const outputArray = listToArray(outputList);
        
        const passed = JSON.stringify(outputArray) === JSON.stringify(tc.expected);
        if (!passed) allPassed = false;

        results.push({
          caseId: index + 1,
          input: JSON.stringify(tc.input),
          expected: JSON.stringify(tc.expected),
          actual: JSON.stringify(outputArray),
          passed
        });
      } catch (err: any) {
        allPassed = false;
        logs.push(`Error in Test Case ${index + 1}: ${err.message}`);
        results.push({
          caseId: index + 1,
          input: JSON.stringify(tc.input),
          expected: JSON.stringify(tc.expected),
          actual: "Error: " + err.message,
          passed: false
        });
      }
    });

  } catch (err: any) {
    return {
      passed: false,
      logs: [...logs, `Runtime Error: ${err.message}`],
      results: [],
      error: err.message
    };
  }

  return {
    passed: allPassed,
    logs,
    results
  };
};
