# Advanced Python Programming

## Decorators

Decorators are higher-order functions that wrap another function to extend its behaviour without permanently modifying it.

```python
import functools
import time

def timer(func):
    """Measure execution time of a function."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper


def retry(max_attempts=3, exceptions=(Exception,)):
    """Retry a function on failure."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_attempts - 1:
                        raise
                    print(f"Attempt {attempt + 1} failed: {e}")
        return wrapper
    return decorator


@timer
@retry(max_attempts=3, exceptions=(ValueError,))
def risky_operation(x):
    if x < 0:
        raise ValueError("Negative input")
    return x ** 2
```

## Generators and Iterators

Generators produce values lazily, enabling efficient processing of large or infinite sequences.

```python
def fibonacci():
    """Infinite Fibonacci generator."""
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


def read_large_file(filepath):
    """Memory-efficient line-by-line file reading."""
    with open(filepath) as f:
        for line in f:
            yield line.strip()


# Generator expression
squares_gen = (x**2 for x in range(10**9))  # Uses O(1) memory

# send() and two-way communication
def accumulator():
    total = 0
    while True:
        value = yield total
        if value is None:
            break
        total += value

gen = accumulator()
next(gen)           # prime the generator
gen.send(10)        # 10
gen.send(20)        # 30


# Custom iterator protocol
class CountDown:
    def __init__(self, start):
        self.start = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.start <= 0:
            raise StopIteration
        self.start -= 1
        return self.start + 1
```

## Context Managers

Context managers handle setup and teardown logic reliably using the `with` statement.

```python
from contextlib import contextmanager, suppress

# Class-based context manager
class DatabaseConnection:
    def __enter__(self):
        self.conn = connect_to_db()
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.conn.close()
        return False  # don't suppress exceptions


# Generator-based context manager
@contextmanager
def timer_cm(label=""):
    import time
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label} {elapsed:.4f}s")


with timer_cm("Processing:"):
    data = [x**2 for x in range(10**6)]

# Suppress specific exceptions
with suppress(FileNotFoundError):
    os.remove("non_existent.tmp")
```

## Metaclasses

Metaclasses are the "class of a class". They control how classes are created.

```python
class SingletonMeta(type):
    """Ensure only one instance per class."""
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]


class Config(metaclass=SingletonMeta):
    def __init__(self):
        self.debug = False
        self.db_url = "sqlite:///app.db"


c1 = Config()
c2 = Config()
assert c1 is c2  # True – same instance


class ValidatedMeta(type):
    """Auto-add type validation to class attributes."""
    def __new__(mcs, name, bases, namespace):
        for attr, value in namespace.items():
            if isinstance(value, property):
                namespace[attr] = value
        return super().__new__(mcs, name, bases, namespace)
```

## Async/Await and asyncio

Python's asyncio enables concurrent I/O-bound tasks within a single thread.

```python
import asyncio
import httpx

async def fetch_url(client: httpx.AsyncClient, url: str) -> str:
    response = await client.get(url)
    return response.text


async def fetch_all(urls: list[str]) -> list[str]:
    async with httpx.AsyncClient() as client:
        tasks = [fetch_url(client, url) for url in urls]
        return await asyncio.gather(*tasks)


# Async context manager and async iterator
class AsyncDataSource:
    async def __aenter__(self):
        await asyncio.sleep(0)  # simulate connection
        return self

    async def __aexit__(self, *_):
        await asyncio.sleep(0)  # simulate cleanup

    async def __aiter__(self):
        for i in range(5):
            await asyncio.sleep(0.1)
            yield i


async def main():
    async with AsyncDataSource() as ds:
        async for item in ds:
            print(item)

asyncio.run(main())
```

## Type Hints and mypy

Type hints improve code clarity and enable static analysis.

```python
from typing import Optional, Union, TypeVar, Generic, Protocol

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def peek(self) -> Optional[T]:
        return self._items[-1] if self._items else None


# Protocol (structural subtyping – duck typing with type safety)
class Drawable(Protocol):
    def draw(self) -> None: ...


def render(item: Drawable) -> None:
    item.draw()
```

## Threading and Multiprocessing

```python
import threading
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# Threading – best for I/O-bound tasks (GIL limits CPU parallelism)
def download(url):
    # ...simulate download
    pass

with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(download, url) for url in urls]
    results = [f.result() for f in futures]


# Multiprocessing – bypasses GIL for CPU-bound tasks
def cpu_bound(n):
    return sum(i * i for i in range(n))

with ProcessPoolExecutor() as executor:
    results = list(executor.map(cpu_bound, [10**6] * 4))


# Thread-safe data sharing
lock = threading.Lock()
shared_counter = 0

def increment():
    global shared_counter
    with lock:
        shared_counter += 1
```

## Memory Management and Garbage Collection

```python
import gc
import sys
import weakref

# Reference counting
x = [1, 2, 3]
y = x               # ref count = 2
del x               # ref count = 1
# y still holds the list

# Weak references (don't prevent garbage collection)
class Cache:
    def __init__(self):
        self._store = weakref.WeakValueDictionary()

    def store(self, key, value):
        self._store[key] = value

    def get(self, key):
        return self._store.get(key)


# Memory profiling
print(sys.getsizeof([]))          # size of empty list in bytes
print(sys.getsizeof(list(range(1000))))

# Cyclic garbage collector
gc.collect()                       # force collection
gc.set_threshold(700, 10, 10)      # tune collection frequency
```

## C Extensions with ctypes

```python
import ctypes

# Load a shared library
lib = ctypes.CDLL("libc.so.6")   # Linux libc

# Call a C function
lib.printf.argtypes = [ctypes.c_char_p]
lib.printf(b"Hello from C!\n")

# Define C struct
class Point(ctypes.Structure):
    _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double)]

p = Point(1.5, 2.5)
print(p.x, p.y)
```

## Design Patterns in Python

```python
# Observer pattern
class EventEmitter:
    def __init__(self):
        self._listeners: dict[str, list] = {}

    def on(self, event: str, callback):
        self._listeners.setdefault(event, []).append(callback)

    def emit(self, event: str, *args, **kwargs):
        for cb in self._listeners.get(event, []):
            cb(*args, **kwargs)


# Strategy pattern
from abc import ABC, abstractmethod

class SortStrategy(ABC):
    @abstractmethod
    def sort(self, data: list) -> list: ...

class QuickSort(SortStrategy):
    def sort(self, data):
        return sorted(data)   # using built-in as proxy

class BubbleSort(SortStrategy):
    def sort(self, data):
        arr = data[:]
        n = len(arr)
        for i in range(n):
            for j in range(n - i - 1):
                if arr[j] > arr[j + 1]:
                    arr[j], arr[j + 1] = arr[j + 1], arr[j]
        return arr


# Factory pattern
class AnimalFactory:
    @staticmethod
    def create(animal_type: str):
        types = {"dog": Dog, "cat": Cat}
        cls = types.get(animal_type.lower())
        if not cls:
            raise ValueError(f"Unknown animal: {animal_type}")
        return cls()
```
