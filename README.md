# coursework
# Programming Languages Assignment
## Overview
This repository contains solutions for a **Programming Languages assignment** implemented using **Python and Jupyter Notebook**.

The assignment demonstrates implementation of mathematical algorithms, numerical approximation techniques, and number property checks using Python functions and control structures.

---

## Repository Structure
PL_assignment.ipynb # Jupyter notebook containing the assignment solutions
README.md # Documentation for the repository

---

## Problem 1 — Euclid’s Algorithm

This problem implements **Euclid’s Algorithm** to compute the **Greatest Common Divisor (GCD)** of two integers.

### Features
- Handles both positive and negative integers
- Uses an efficient iterative algorithm
- Demonstrates classical number theory concepts

Example:
gcd(48, 18) → 6
gcd(-48, 18) → 6

---

## Problem 2 — Approximating Euler’s Number (e)

This section explores different numerical methods to approximate the mathematical constant **Euler’s number (e ≈ 2.718281828)**.

### Limit Approximation

Uses the limit definition:

e ≈ (1 + 1/n)^n

Function:
euler_limit(n)

---

### Series Approximation

Uses the Taylor series expansion:

e = Σ (1/k!)

Function:
euler_approx(epsilon)

---

### Error Analysis

Two functions display the error relative to the true value of **e**.
print_euler_sum_error(n)
print_euler_limit_error(n)

These functions print:
- Approximate value
- Difference from the true value of e

---

## Problem 3 — Integer Power Properties

This section implements functions that determine whether a number is a power of another number.

### Check if a number is a power of 2
is_power_of_2(n)

Example:
is_power_of_2(16) → True
is_power_of_2(18) → False

---

### Generalized Power Check
is_power(b, n)

Determines whether:
n = b^k

Example:
is_power(3, 27) → True
is_power(2, 18) → False

---

## Technologies Used

- Python 3
- Jupyter Notebook
- Python `math` library

---

## How to Run

1. Clone the repository
   git clone https://github.com/your-username/repository-name.git

2. Open the notebook
   PL_assignment.ipynb


3. Run all cells using **Jupyter Notebook or Google Colab**.

---

## Author

**Varun Sharma**  
BS in Data Science & Artificial Intelligence  
Indian Institute of Management Sambalpur
