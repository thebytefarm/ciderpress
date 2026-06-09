---
title: Math (KaTeX)
description: Render LaTeX math expressions inline and in blocks.
---

# Math (KaTeX)

ciderpress bundles `rspress-plugin-katex` for LaTeX math rendering. No configuration required.

## Inline math

Wrap expressions with single dollar signs:

**Code**

```md
The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ and applies when $a \neq 0$.
```

**Output**

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ and applies when $a \neq 0$.

## Block math

Wrap expressions with double dollar signs:

**Code**

```md
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

**Output**

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

## More examples

### Summation

**Code**

```md
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
```

**Output**

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

### Matrix

**Code**

```md
$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$
```

**Output**

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$

### Mixed inline

**Code**

```md
Given $f(x) = x^2 + 2x + 1$, the derivative is $f'(x) = 2x + 2$ and the integral is $F(x) = \frac{x^3}{3} + x^2 + x + C$.
```

**Output**

Given $f(x) = x^2 + 2x + 1$, the derivative is $f'(x) = 2x + 2$ and the integral is $F(x) = \frac{x^3}{3} + x^2 + x + C$.

## References

- [KaTeX supported functions](https://katex.org/docs/supported)
