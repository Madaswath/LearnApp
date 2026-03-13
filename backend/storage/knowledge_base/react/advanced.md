# Advanced React

## Custom Hooks

Custom hooks extract reusable stateful logic into functions that start with `use`.

```jsx
// useFetch – generic data fetching hook
import { useState, useEffect, useCallback } from "react";

function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { execute(); }, [execute]);
  return { data, error, loading, refetch: execute };
}

// useLocalStorage
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback((val) => {
    setValue(val);
    localStorage.setItem(key, JSON.stringify(val));
  }, [key]);

  return [value, set];
}

// useDebounce
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

## Performance Optimisation

```jsx
import { memo, lazy, Suspense, startTransition } from "react";

// React.memo – skip re-render if props are equal
const ExpensiveChart = memo(function Chart({ data, title }) {
  // Heavy rendering only when data/title changes
  return <canvas>/* chart */</canvas>;
});

// Lazy loading + code splitting
const HeavyModule = lazy(() => import("./HeavyModule"));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyModule />
    </Suspense>
  );
}

// startTransition – mark non-urgent updates
function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);  // urgent – update input immediately
    startTransition(() => {
      setResults(heavySearch(val));  // non-urgent – can be deferred
    });
  };

  return <input value={query} onChange={handleInput} />;
}
```

## State Management

### Redux Toolkit

```jsx
// store/coursesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchCourses = createAsyncThunk("courses/fetch", async (topic) => {
  const res = await fetch(`/api/courses?topic=${topic}`);
  return res.json();
});

const coursesSlice = createSlice({
  name: "courses",
  initialState: { items: [], status: "idle", error: null },
  reducers: {
    addCourse: (state, action) => { state.items.push(action.payload); },
    removeCourse: (state, action) => {
      state.items = state.items.filter(c => c.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => { state.status = "loading"; })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

// Component usage
function CourseList() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.courses);

  useEffect(() => { dispatch(fetchCourses("python")); }, [dispatch]);

  return status === "loading" ? <Spinner /> : (
    <ul>{items.map(c => <CourseCard key={c.id} course={c} />)}</ul>
  );
}
```

### Zustand (lightweight alternative)

```jsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuth: false,
      login: (user, token) => set({ user, token, isAuth: true }),
      logout: () => set({ user: null, token: null, isAuth: false }),
      isAdmin: () => get().user?.role === "admin",
    }),
    { name: "auth-storage" }  // persists to localStorage
  )
);
```

## Testing with React Testing Library

```jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import CourseList from "./CourseList";

const server = setupServer(
  rest.get("/api/courses", (req, res, ctx) =>
    res(ctx.json([{ id: 1, title: "Python Basics" }]))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("displays courses after loading", async () => {
  render(<CourseList />);

  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText("Python Basics")).toBeInTheDocument();
  });
});

test("filters courses by search input", async () => {
  render(<CourseList />);
  await waitFor(() => screen.getByText("Python Basics"));

  await userEvent.type(screen.getByRole("searchbox"), "Java");
  expect(screen.queryByText("Python Basics")).not.toBeInTheDocument();
});
```

## Server Components (Next.js App Router)

```jsx
// app/courses/page.tsx – Server Component (runs on server, no client JS)
import { db } from "@/lib/db";

export default async function CoursesPage() {
  const courses = await db.course.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main>
      <h1>Courses</h1>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </main>
  );
}

// "use client" – interactive client component
"use client";
import { useState } from "react";

export function EnrollButton({ courseId }) {
  const [enrolled, setEnrolled] = useState(false);

  return (
    <button onClick={async () => {
      await fetch(`/api/enroll`, {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      setEnrolled(true);
    }}>
      {enrolled ? "Enrolled!" : "Enroll Now"}
    </button>
  );
}
```

## Error Boundaries

```jsx
import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Error caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="error-card">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

## TypeScript with React

```tsx
import { FC, ReactNode, CSSProperties } from "react";

// Component props
interface CardProps {
  title: string;
  children: ReactNode;
  style?: CSSProperties;
  variant?: "default" | "outlined" | "elevated";
  onClick?: () => void;
}

const Card: FC<CardProps> = ({ title, children, variant = "default", onClick }) => (
  <div className={`card card--${variant}`} onClick={onClick}>
    <h3>{title}</h3>
    {children}
  </div>
);

// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => <li key={keyExtractor(item)}>{renderItem(item)}</li>)}
    </ul>
  );
}
```
