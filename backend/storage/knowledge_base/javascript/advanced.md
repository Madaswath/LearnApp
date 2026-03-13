# Advanced JavaScript

## Prototype Chain and Inheritance

Every JavaScript object has an internal `[[Prototype]]` link forming a chain that is traversed during property lookups.

```javascript
// Object.create for prototypal inheritance
const animal = {
  speak() { return `${this.name} makes a noise.`; }
};

const dog = Object.create(animal);
dog.name = "Rex";
dog.bark = function() { return `${this.name} barks!`; };

dog.speak(); // Rex makes a noise. (found via prototype chain)

// ES6 Classes (syntactic sugar over prototype chain)
class Vehicle {
  #speed = 0;               // private field

  constructor(make, model) {
    this.make = make;
    this.model = model;
  }

  accelerate(amount) {
    this.#speed += amount;
  }

  get currentSpeed() { return this.#speed; }

  toString() { return `${this.make} ${this.model}`; }
}

class ElectricVehicle extends Vehicle {
  #batteryLevel = 100;

  constructor(make, model, range) {
    super(make, model);
    this.range = range;
  }

  charge() { this.#batteryLevel = 100; }
}
```

## Event Loop, Call Stack, and Microtasks

Understanding JavaScript's concurrency model is critical for writing correct async code.

```javascript
// Execution order: synchronous → microtasks → macrotasks

console.log("1 - sync");

setTimeout(() => console.log("4 - macrotask (setTimeout)"), 0);

Promise.resolve()
  .then(() => console.log("3 - microtask (Promise)"));

queueMicrotask(() => console.log("2 - microtask (queueMicrotask)"));

// Output: 1, 2, 3, 4
// Call stack → empty → process microtask queue → process macrotask queue

// requestAnimationFrame fires before paint, after microtasks
requestAnimationFrame(() => console.log("before next paint"));
```

## Design Patterns

```javascript
// Module pattern
const UserModule = (() => {
  let _users = [];                  // private

  return {
    add(user) { _users.push(user); },
    getAll() { return [..._users]; },
    count() { return _users.length; },
  };
})();

// Observer / Pub-Sub
class EventBus {
  #events = new Map();

  on(event, handler) {
    if (!this.#events.has(event)) this.#events.set(event, new Set());
    this.#events.get(event).add(handler);
    return () => this.off(event, handler);  // unsubscribe function
  }

  off(event, handler) {
    this.#events.get(event)?.delete(handler);
  }

  emit(event, ...args) {
    this.#events.get(event)?.forEach(h => h(...args));
  }
}

// Factory pattern
const createButton = ({ text, onClick, variant = "primary" }) => {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.className = `btn btn-${variant}`;
  btn.addEventListener("click", onClick);
  return btn;
};
```

## Performance Optimisation

```javascript
// Debounce – delay execution until after a quiet period
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Throttle – execute at most once per interval
function throttle(fn, interval) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

// Memoisation
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize((n) => {
  return Array.from({ length: n }, (_, i) => i).reduce((a, b) => a + b, 0);
});
```

## Web Workers

Web Workers run scripts in background threads, keeping the UI responsive.

```javascript
// main.js
const worker = new Worker("worker.js");

worker.postMessage({ task: "heavyComputation", data: largeArray });

worker.onmessage = (event) => {
  console.log("Result:", event.data.result);
};

worker.onerror = (error) => {
  console.error("Worker error:", error.message);
};

// worker.js
self.onmessage = (event) => {
  const { task, data } = event.data;
  if (task === "heavyComputation") {
    const result = data.reduce((sum, n) => sum + n, 0);
    self.postMessage({ result });
  }
};
```

## Service Workers and PWA

```javascript
// Register a service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(reg => console.log("SW registered:", reg.scope))
    .catch(err => console.error("SW registration failed:", err));
}

// sw.js – Cache-first strategy
const CACHE_NAME = "app-v1";
const ASSETS = ["/", "/index.html", "/app.js", "/styles.css"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached ?? fetch(event.request)
    )
  );
});
```

## WebSockets

```javascript
// Client-side WebSocket
const ws = new WebSocket("wss://example.com/chat");

ws.addEventListener("open", () => {
  ws.send(JSON.stringify({ type: "join", room: "general" }));
});

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  console.log(msg);
});

ws.addEventListener("close", (event) => {
  console.log("Disconnected:", event.code, event.reason);
});

// Reconnecting wrapper
function createReconnectingWebSocket(url, options = {}) {
  let ws;
  const reconnect = () => {
    ws = new WebSocket(url);
    ws.onclose = () => setTimeout(reconnect, options.delay ?? 1000);
  };
  reconnect();
  return { send: (data) => ws.send(data), close: () => ws.close() };
}
```

## Memory Leaks and Debugging

```javascript
// Common memory leak sources and fixes

// 1. Forgotten timers
const interval = setInterval(doWork, 1000);
// Always clear:
clearInterval(interval);

// 2. Detached DOM nodes (store reference, remove from DOM but reference kept)
// Use WeakRef or WeakMap for optional references
const cache = new WeakMap(); // keys are garbage-collected when object is GC'd

// 3. Closure capturing large objects
function createHeavy() {
  const bigData = new Array(10_000).fill("x");
  return function light() {
    // bigData captured even if not used – nullify to release
  };
}

// Chrome DevTools memory profiling
// 1. Open DevTools → Memory tab
// 2. Take heap snapshot
// 3. Perform operation
// 4. Take another heap snapshot
// 5. Compare – look for objects that should have been GC'd
```

## TypeScript Basics

```typescript
// Type annotations
let name: string = "Alice";
let age: number = 30;
let active: boolean = true;

// Interfaces
interface User {
  id: number;
  name: string;
  email?: string;        // optional
  readonly role: string; // immutable after creation
}

// Generics
function identity<T>(arg: T): T { return arg; }
const first = identity<string>("hello");

// Union and intersection types
type ID = string | number;
type AdminUser = User & { permissions: string[] };

// Type guards
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// Enums
enum Direction { Up = "UP", Down = "DOWN", Left = "LEFT", Right = "RIGHT" }
```

## Testing with Jest

```javascript
// sum.js
export const sum = (a, b) => a + b;
export const fetchUser = async (id) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
};

// sum.test.js
import { sum, fetchUser } from "./sum";

describe("sum", () => {
  test("adds two positive numbers", () => {
    expect(sum(1, 2)).toBe(3);
  });

  test("handles negative numbers", () => {
    expect(sum(-1, 1)).toBe(0);
  });
});

// Mocking fetch
global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve({ id: 1, name: "Alice" }),
});

test("fetches user data", async () => {
  const user = await fetchUser(1);
  expect(fetch).toHaveBeenCalledWith("/api/users/1");
  expect(user.name).toBe("Alice");
});
```
