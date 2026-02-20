
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
  passed: boolean; // Keep for JS tests compat
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

// --- Pyodide Setup ---
declare global {
  interface Window {
    loadPyodide: (config?: any) => Promise<any>;
  }
}

let pyodide: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

const loadPyodide = async () => {
    if (pyodide) return pyodide;
    if (pyodideLoadingPromise) return pyodideLoadingPromise;

    pyodideLoadingPromise = new Promise((resolve, reject) => {
        // Set a global timeout for the entire loading process (20 seconds)
        const timeoutId = setTimeout(() => {
            reject(new Error("Pyodide loading timed out (20s). Check your connection or firewall."));
        }, 20000);

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
        script.type = 'text/javascript';
        script.async = true;
        script.crossOrigin = "anonymous"; // Better for CDN
        
        script.onload = async () => {
             // Poll for loadPyodide availability
             let checkCount = 0;
             const checkInterval = setInterval(async () => {
                 if (typeof window.loadPyodide === 'function') {
                     clearInterval(checkInterval);
                     clearTimeout(timeoutId);
                     try {
                         const p = await window.loadPyodide({
                            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
                         });
                         pyodide = p;
                         resolve(p);
                     } catch (e) {
                         reject(e);
                     }
                 } else {
                     checkCount++;
                     if (checkCount > 50) { // Wait up to 5 seconds (50 * 100ms)
                         clearInterval(checkInterval);
                         clearTimeout(timeoutId);
                         reject(new Error('Pyodide script loaded but loadPyodide is not defined after 5s polling.'));
                     }
                 }
             }, 100);
        };
        script.onerror = (e) => {
            clearTimeout(timeoutId);
            reject(new Error('Failed to load Pyodide script from CDN. Check content blockers.'));
        };
        document.body.appendChild(script);
    });

    return pyodideLoadingPromise;
};

export const executeCode = async (userCode: string, language: 'javascript' | 'python' | 'bash'): Promise<ExecutionResult> => {
  const logs: string[] = [];

  // --- Python Execution ---
  if (language === 'python') {
      try {
          const py = await loadPyodide();
          
          // Redirect stdout
          py.setStdout({
              batched: (msg: string) => {
                  logs.push(msg);
              }
          });
          
          await py.runPythonAsync(userCode);
          
          return {
              passed: true,
              logs: logs,
              results: [],
          };
      } catch (err: any) {
          return {
              passed: false,
              logs: logs,
              results: [],
              error: err.toString()
          };
      }
  }

  // --- Bash Execution (Simulated) ---
  if (language === 'bash') {
      // Simple simulation for demo purposes
      if (userCode.trim().startsWith("echo")) {
          const output = userCode.replace("echo", "").replace(/"/g, "").replace(/'/g, "").trim();
          return {
              passed: true,
              logs: [output],
              results: []
          };
      }
      return {
          passed: false,
          logs: ["Execution for Bash is currently simulated (try 'echo hello')"],
          results: [],
          error: "Full Bash support requires a backend system."
      };
  }

  // --- JavaScript Execution ---
  // (Existing Logic Wrapped in Async)
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
    const factory = new Function('ListNode', 'console', `
      ${userCode}
      // If user didn't define reverseList (e.g. just wrote console.log), that's fine for playground unless we enforce it.
      // For general playground, we might not want to enforce reverseList unless in "Challenge Mode".
      // But preserving existing logic for now.
      if (typeof reverseList !== 'function') {
        // Just return null if no function, main execution is done via main body
        return null; 
      }
      return reverseList;
    `);

    const userFunction = factory(ListNode, mockConsole);

    if (userFunction) {
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
    }

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
