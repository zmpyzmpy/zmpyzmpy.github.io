---
layout: post
title:  "Perceptron"
date: 2019-05-23 17:02:24 +0800
tags: 
- Machine Learning
---

<script type="text/x-mathjax-config">
MathJax.Hub.Config({
  TeX: { equationNumbers: { autoNumber: "AMS" } }
});
</script>

## Perceptron basics

Suppose the input space (feature space) is $$\mathcal{X}\subseteq \textbf{R}^n$$, output space is $$\mathcal{Y}=\{+1,-1\}$$. Then the following function from input space to output space is called perceptron.

$$
\begin{equation}
	f(x) = \text{sign} (w \cdot x + b)
\end{equation}
$$

 Where $$w$$ and $$b$$ are the parameters of perceptron, $$w\in \textbf{R}^n$$ is weight vector, $$b\in \textbf{R}$$ is bias. 



## Learning method of perceptron

Given a dataset 

$$
\begin{equation}
	T = \{(x_1, y_1), (x_2, y_2), \cdots, (x_N, y_N)\}
\end{equation}
$$

\noindent where $$x_i \in \mathcal{X} = \textbf{R}^n$$, $$y_i \in \mathcal{Y} =\{-1, 1\}$$, $$i=1,2,\cdots,N$$, find parameters $$w, b$$ such that the loss function below is minimum

$$
\begin{equation}
	\min_{w, b}L(w, b) = - \sum_{x_i\in M}y_i(w\cdot x_i + b)\label{loss}
\end{equation}
$$

where $$M$$ is the set of misclassified instances. The learning procedure is driven by misclassification, more specifically, by using stochastic gradient decent. Firstly, choose a hyperplane $$w_0, b_0$$, then minimize the objective function \eqref{loss}​ by using gradient decent.

Suppose the misclassification set $$M$$ is stationary, the gradient of loss function $$L(w, b)$$ is then given by

$$
\begin{align*}
	\nabla_w L(w, b) &= - \sum_{x_i \in M} y_i x_i \notag \\
	\nabla_b L(w, b) &= - \sum_{x_i \in M} y_i \notag
\end{align*}
$$

Select a misclassified instance $$(x_i, y_i)$$ randomly, then update $$w$$ and $$b$$

$$
\begin{align}
	w & \gets w + \eta y_i x_i \\
	b & \gets b + \eta y_i
\end{align}
$$

where $$\eta(0<\eta\leq 1)$$ is the step size or learning rate. By doing so, we can expect the loss function $$L(w, b)$$ decreases continuously, until 0.