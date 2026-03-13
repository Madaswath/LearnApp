# Python Programming Overview

## What is Python?

Python is a high-level, interpreted, general-purpose programming language created by Guido van Rossum and first released in 1991. It emphasises code readability with its clean, English-like syntax and uses significant whitespace (indentation) to delimit blocks. Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.

## Key Features

- **Readable syntax**: Code reads almost like English, reducing the learning curve.
- **Dynamically typed**: No need to declare variable types; Python infers them at runtime.
- **Interpreted**: Code runs line-by-line, making debugging and interactive exploration easy.
- **Cross-platform**: Runs on Windows, macOS, Linux, and more without modification.
- **Large standard library**: Ships with batteries included – file I/O, networking, math, and more.
- **Vibrant ecosystem**: Over 400,000 packages on PyPI covering data science, web, automation, etc.
- **Garbage-collected memory management**: Automatic memory management via reference counting and a cyclic garbage collector.

## Variables and Data Types

Python has several built-in primitive and collection types:

```python
# Integer
age = 30

# Float
temperature = 36.6

# String
name = "Alice"
greeting = 'Hello, World!'
multiline = """This spans
multiple lines"""

# Boolean
is_active = True
is_deleted = False

# NoneType
result = None
```

### Collections

```python
# List – ordered, mutable, allows duplicates
fruits = ["apple", "banana", "cherry"]
fruits.append("date")
fruits[0]   # "apple"

# Tuple – ordered, immutable
coordinates = (10.5, 20.3)
x, y = coordinates   # unpacking

# Dictionary – key-value pairs, ordered (Python 3.7+)
person = {"name": "Bob", "age": 25, "city": "London"}
person["email"] = "bob@example.com"

# Set – unordered, unique elements
unique_numbers = {1, 2, 3, 2, 1}  # {1, 2, 3}
```

## Control Flow

### Conditionals

```python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"

print(f"Grade: {grade}")  # Grade: B
```

### Loops

```python
# for loop over a sequence
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)

# range-based loop
for i in range(5):          # 0, 1, 2, 3, 4
    print(i)

for i in range(1, 10, 2):   # 1, 3, 5, 7, 9
    print(i)

# while loop
count = 0
while count < 5:
    print(count)
    count += 1

# Loop control
for n in range(10):
    if n == 3:
        continue   # skip 3
    if n == 7:
        break      # stop at 7
    print(n)
```

## Functions

Functions are defined with `def` and can accept any number of positional, keyword, and variadic arguments.

```python
def greet(name, greeting="Hello"):
    """Return a greeting string."""
    return f"{greeting}, {name}!"

print(greet("Alice"))           # Hello, Alice!
print(greet("Bob", "Hi"))       # Hi, Bob!


def total(*args):
    """Sum any number of positional arguments."""
    return sum(args)

print(total(1, 2, 3, 4))        # 10


def describe(**kwargs):
    """Print all keyword arguments."""
    for key, value in kwargs.items():
        print(f"{key}: {value}")

describe(name="Carol", age=28)  # name: Carol / age: 28
```

## Classes and Object-Oriented Programming

```python
class Animal:
    species = "Unknown"  # class attribute

    def __init__(self, name: str, sound: str):
        self.name = name    # instance attribute
        self.sound = sound

    def speak(self) -> str:
        return f"{self.name} says {self.sound}"

    def __repr__(self):
        return f"Animal(name={self.name!r})"


class Dog(Animal):
    """Dog inherits from Animal."""

    def __init__(self, name: str):
        super().__init__(name, "Woof")

    def fetch(self, item: str) -> str:
        return f"{self.name} fetches the {item}!"


fido = Dog("Fido")
print(fido.speak())       # Fido says Woof
print(fido.fetch("ball")) # Fido fetches the ball!
```

## Modules and Packages

```python
# Importing standard library modules
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Third-party packages (installed via pip)
# import numpy as np
# import pandas as pd

# Relative import within a package
# from .utils import helper_function

# __init__.py marks a directory as a package
```

## Error Handling

```python
def divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        print("Cannot divide by zero!")
        return None
    except TypeError as e:
        print(f"Type error: {e}")
        return None
    else:
        print("Division successful")
        return result
    finally:
        print("Executed regardless of outcome")

divide(10, 2)   # 5.0
divide(10, 0)   # Cannot divide by zero!
```

## File I/O

```python
# Writing a file
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("Hello, file!\n")
    f.writelines(["Line 2\n", "Line 3\n"])

# Reading a file
with open("output.txt", "r", encoding="utf-8") as f:
    content = f.read()           # entire file as string

with open("output.txt") as f:
    for line in f:               # iterate line by line (memory-efficient)
        print(line.strip())

# JSON
import json
data = {"key": "value", "numbers": [1, 2, 3]}
with open("data.json", "w") as f:
    json.dump(data, f, indent=2)
```

## List Comprehensions

```python
# Basic comprehension
squares = [x**2 for x in range(10)]

# With condition
even_squares = [x**2 for x in range(10) if x % 2 == 0]

# Nested
matrix = [[i * j for j in range(1, 4)] for i in range(1, 4)]

# Dict comprehension
word_lengths = {word: len(word) for word in ["hello", "world", "python"]}

# Set comprehension
unique_lengths = {len(word) for word in ["hello", "world", "hi"]}

# Generator expression (lazy, memory-efficient)
total = sum(x**2 for x in range(1_000_000))
```

## Lambda Functions

```python
# Lambda syntax: lambda arguments: expression
square = lambda x: x ** 2
add = lambda x, y: x + y

# Common use with sorted, map, filter
names = ["Charlie", "Alice", "Bob"]
sorted_names = sorted(names, key=lambda n: n.lower())

numbers = [1, 2, 3, 4, 5, 6]
evens = list(filter(lambda x: x % 2 == 0, numbers))
doubled = list(map(lambda x: x * 2, numbers))
```
