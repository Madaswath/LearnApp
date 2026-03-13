# React Fundamentals

## What is React?

React is a declarative, component-based JavaScript library for building user interfaces, created by Meta (Facebook) and open-sourced in 2013. React introduces the concept of a **virtual DOM** – a lightweight in-memory representation of the real DOM. When state changes, React diffs the virtual DOM against the previous one and makes only the minimal necessary updates to the real DOM.

## Key Concepts

- **Components**: The building blocks of a React app. Can be functions or classes (functions preferred since React 16.8).
- **Props**: Immutable data passed from parent to child components.
- **State**: Mutable data local to a component that triggers re-renders on change.
- **Reconciliation**: The diffing algorithm React uses to update the DOM efficiently.
- **Unidirectional data flow**: Data flows from parent to child via props.

## JSX Syntax

JSX is syntactic sugar for `React.createElement()`. Babel transpiles it to regular JavaScript.

```jsx
// JSX
const element = <h1 className="title">Hello, {name}!</h1>;

// Transpiles to:
const element = React.createElement("h1", { className: "title" }, `Hello, ${name}!`);

// Multi-line JSX (must have a single root element or fragment)
const card = (
  <div className="card">
    <h2>{title}</h2>
    <p>{description}</p>
  </div>
);

// Fragment to avoid extra DOM nodes
const list = (
  <>
    <li>Item 1</li>
    <li>Item 2</li>
  </>
);
```

## Props and State

```jsx
// Props – received as first argument, treated as immutable
function UserCard({ name, email, avatar, onEdit }) {
  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
      <button onClick={onEdit}>Edit Profile</button>
    </div>
  );
}

// Default props (via default parameter values)
function Button({ label = "Click me", variant = "primary", onClick }) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}
```

## Hooks

Hooks let functional components use state, side effects, and other React features.

### useState

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// Object state
function Form() {
  const [form, setForm] = useState({ name: "", email: "" });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form>
      <input name="name" value={form.name} onChange={handleChange} />
      <input name="email" value={form.email} onChange={handleChange} />
    </form>
  );
}
```

### useEffect

```jsx
import { useState, useEffect } from "react";

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };  // cleanup
  }, [userId]);  // re-run when userId changes

  if (loading) return <Spinner />;
  return <div>{user?.name}</div>;
}
```

### useContext

```jsx
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext("light");

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const toggle = () => setTheme(t => t === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

function Header() {
  const { theme, toggle } = useContext(ThemeContext);
  return (
    <header data-theme={theme}>
      <button onClick={toggle}>Toggle theme</button>
    </header>
  );
}
```

### useRef, useMemo, useCallback

```jsx
import { useRef, useMemo, useCallback } from "react";

function SearchList({ items }) {
  const inputRef = useRef(null);           // DOM reference

  const [query, setQuery] = useState("");

  // useMemo – expensive derived data
  const filtered = useMemo(
    () => items.filter(item => item.name.toLowerCase().includes(query)),
    [items, query]
  );

  // useCallback – stable function reference (prevent child re-renders)
  const handleSelect = useCallback((id) => {
    console.log("Selected:", id);
  }, []);  // no dependencies, always the same function

  return (
    <>
      <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} />
      {filtered.map(item => (
        <Item key={item.id} {...item} onSelect={handleSelect} />
      ))}
    </>
  );
}
```

## Event Handling

```jsx
function LoginForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    // submit logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit">Log In</button>
    </form>
  );
}
```

## Conditional Rendering and Lists

```jsx
// Conditional rendering
function Alert({ type, message }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`}>
      {type === "error" && <ErrorIcon />}
      {message}
    </div>
  );
}

// Lists with keys
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id} className={todo.done ? "done" : ""}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

## React Router

```jsx
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  // ...
}
```

## Context API (Global State)

```jsx
// store/authContext.jsx
import { createContext, useContext, useReducer } from "react";

const AuthContext = createContext(null);

const reducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":  return { ...state, user: action.payload, isAuth: true };
    case "LOGOUT": return { user: null, isAuth: false };
    default:       return state;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { user: null, isAuth: false });
  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```
