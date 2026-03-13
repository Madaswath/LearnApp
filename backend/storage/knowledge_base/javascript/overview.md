# JavaScript Fundamentals

## What is JavaScript?

JavaScript (JS) is a lightweight, interpreted, just-in-time compiled scripting language with first-class functions. Originally created by Brendan Eich at Netscape in 1995, it is now one of the most widely used programming languages in the world. JavaScript runs natively in all modern browsers and, via Node.js, on the server side.

## Variables – var, let, const and Hoisting

```javascript
// var – function-scoped, hoisted to top of function (old style)
console.log(x); // undefined (hoisted, not ReferenceError)
var x = 5;

// let – block-scoped, NOT hoisted to usable state
// console.log(y); // ReferenceError: cannot access before initialisation
let y = 10;

// const – block-scoped, must be initialised, reference cannot be reassigned
const PI = 3.14159;
// PI = 3; // TypeError

// Temporal Dead Zone (TDZ) – let/const exist from block start but cannot be used before declaration
```

## Data Types and Coercion

JavaScript has 8 data types: `undefined`, `null`, `boolean`, `number`, `bigint`, `string`, `symbol`, and `object`.

```javascript
typeof undefined   // "undefined"
typeof null        // "object" (historical bug)
typeof true        // "boolean"
typeof 42          // "number"
typeof "hello"     // "string"
typeof Symbol()    // "symbol"
typeof {}          // "object"
typeof function(){} // "function"

// Type coercion
"5" + 3            // "53"  (string concatenation)
"5" - 3            // 2     (numeric subtraction)
"5" == 5           // true  (loose equality with coercion)
"5" === 5          // false (strict equality, no coercion)
Boolean("")        // false
Boolean("0")       // true (non-empty string)
Boolean(0)         // false
```

## Functions, Arrow Functions, and Closures

```javascript
// Function declaration (hoisted)
function add(a, b) {
  return a + b;
}

// Function expression (not hoisted)
const multiply = function(a, b) {
  return a * b;
};

// Arrow function (concise syntax, no own `this`)
const square = x => x * x;
const greet = (name, greeting = "Hello") => `${greeting}, ${name}!`;

// Closure – inner function retains access to outer scope
function makeCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}

const counter = makeCounter(10);
counter.increment(); // 11
counter.increment(); // 12
counter.value();     // 12
```

## Arrays and Objects

```javascript
// Arrays
const fruits = ["apple", "banana", "cherry"];
fruits.push("date");           // add to end
fruits.unshift("avocado");     // add to start
fruits.pop();                  // remove from end
const sliced = fruits.slice(1, 3);
const found = fruits.find(f => f.startsWith("b"));
const filtered = fruits.filter(f => f.length > 5);
const lengths = fruits.map(f => f.length);
const total = [1,2,3,4].reduce((acc, n) => acc + n, 0);

// Objects
const person = {
  name: "Alice",
  age: 30,
  greet() { return `Hi, I'm ${this.name}`; }
};

// Destructuring
const { name, age } = person;

// Spread
const updated = { ...person, age: 31, city: "London" };

// Optional chaining
const city = person?.address?.city ?? "Unknown";
```

## DOM Manipulation

```javascript
// Select elements
const header = document.getElementById("header");
const buttons = document.querySelectorAll(".btn");
const firstPara = document.querySelector("p");

// Modify content
header.textContent = "New Title";
header.innerHTML = "<strong>Bold Title</strong>";

// Modify styles and classes
header.style.color = "blue";
header.classList.add("active");
header.classList.toggle("hidden");

// Create and insert elements
const div = document.createElement("div");
div.textContent = "New element";
div.className = "card";
document.body.appendChild(div);

// Remove elements
div.remove();
```

## Events and Event Listeners

```javascript
const button = document.querySelector("#myButton");

// addEventListener (preferred – can add multiple listeners)
button.addEventListener("click", (event) => {
  event.preventDefault();       // prevent default browser action
  event.stopPropagation();      // stop bubbling
  console.log("Clicked!", event.target);
});

// Event delegation – handle events on a parent for dynamic children
document.querySelector("#list").addEventListener("click", (e) => {
  if (e.target.matches("li")) {
    console.log("List item clicked:", e.target.textContent);
  }
});

// Custom events
const customEvent = new CustomEvent("userLoggedIn", { detail: { userId: 42 } });
document.dispatchEvent(customEvent);
document.addEventListener("userLoggedIn", (e) => console.log(e.detail));
```

## Promises and Async/Await

```javascript
// Promise
const fetchData = (url) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url) resolve({ data: "sample" });
      else reject(new Error("URL required"));
    }, 100);
  });

// Promise chaining
fetchData("/api/users")
  .then(response => response.data)
  .then(data => console.log(data))
  .catch(err => console.error(err))
  .finally(() => console.log("Done"));

// Async/Await (syntactic sugar over Promises)
async function loadUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to load user:", error);
    throw error;
  }
}

// Parallel execution
const [users, posts] = await Promise.all([
  fetch("/api/users").then(r => r.json()),
  fetch("/api/posts").then(r => r.json()),
]);
```

## Fetch API

```javascript
// GET request
const getUser = async (id) => {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
};

// POST request with JSON body
const createUser = async (userData) => {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
};

// With AbortController for cancellation
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);  // timeout after 5s

const res = await fetch("/api/slow-endpoint", { signal: controller.signal });
```

## ES6+ Features

```javascript
// Destructuring with defaults and rename
const { name: userName = "Guest", role = "user" } = userObj;

// Array destructuring with rest
const [first, second, ...rest] = [1, 2, 3, 4, 5];

// Spread operator
const merged = [...arr1, ...arr2];
const clone = { ...original };

// Template literals with tagged templates
const sql = String.raw`SELECT * FROM users WHERE id = ${id}`;

// Modules (ES Modules)
// math.js
export const add = (a, b) => a + b;
export default class Calculator { /* ... */ }

// app.js
import Calculator, { add } from "./math.js";

// Optional chaining and nullish coalescing
const value = obj?.deeply?.nested?.property ?? "default";
```

## Error Handling

```javascript
class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function riskyOperation() {
  try {
    // ... operation that may fail
    JSON.parse("invalid json");
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AppError("Invalid JSON", "PARSE_ERROR", 400);
    }
    throw error;
  } finally {
    console.log("Cleanup always runs");
  }
}

// Global error handlers
window.addEventListener("error", (event) => {
  console.error("Uncaught error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
```
