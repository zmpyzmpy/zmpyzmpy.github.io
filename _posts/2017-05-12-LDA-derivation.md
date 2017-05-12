---
layout: post
title:  "LDA derivation"
date: 2017-05-12 12:58:07 +0200 
tags:
- Machine Learning
- NLP
---
<style>
.center-image
{
    margin: 0 auto;
    display: block;
}
</style>

This derivation LDA was written by me several years ago when I was trying to understand the well known model "[Latent Dirichlet Allocation](http://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf)", which can be used to extract the topic of a given text corpora. That was the first time I had experience with Natural language processing ([NLP](https://en.wikipedia.org/wiki/Natural_language_processing)). It inspired me a lot on the research I did and some NLP projects I worked on after that.


Generative Process:
For each document w in a corpus D:

1. Choose N$$\sim$$Possion($$\xi$$).
2. Choose $$\theta\sim Dir(\alpha$$).
3. For each of the $$N$$ words $$w_{n}$$:
    1. Choose a topic $$z_{n}\sim$$Multinomial($$\xi$$)
    2. Choose a word $$w$$ from p($$w_{n}\vert z_{n},\beta$$), a mulitinomial probability conditioned on the topic $$A_{i}$$.

The Graphical Model can be visually shown as follows:

![Graphical Model]({{site.url}}/images/posts/lda1.png){: .center-image }

We can then obtain:

$$
p(\theta|\alpha)=\frac{\Gamma(\sum_{i=1}^{k}\alpha_{i})}{\prod_{i=1}^{k}\Gamma(\alpha_{i})}\theta_{1}^{\alpha_{1}-1}\ldots\theta_{k}^{\alpha_{k}-1}\\

p(z|\theta)=\prod_{i=1}^{k}\theta_{i}^{z^{i}} \\

p(w|z,\beta)=\prod_{i=1}^{k}\prod_{j=1}^{V}(\beta_{ij})^{z^{i}w^{j}} \\

p(w|\alpha,\beta)=\int p(\theta|\alpha) \bigg(\prod_{n=1}^{N}\sum_{z_{n}}p(z_{n}|\theta)p(w_{n}|z_{n},\beta)\bigg)d\theta\\

p(w,z)=\int p(\theta)\bigg(\prod_{n=1}^{N}p(z_{n}|\theta)p(w_{n}|z_{n})\bigg)d\theta

$$

Inference:

The key inferectial problem that we need to solve in order to use LDA is that of computing the posterior distribution of the hidden variables given a document:

$$
p(\theta,z|w,\alpha,\beta)=\frac{p(\theta,z,w|\alpha,\beta)}{p(w|\alpha,\beta)}
$$

Using the evidence:

$$
p(w|\alpha,\beta)=\int p(\theta|\alpha) \bigg(\prod_{n=1}^{N}\sum_{z_{n}}p(z_{n}|\theta)p(w_{n}|z_{n},\beta)\bigg)d\theta\\


==>\frac{\Gamma(\sum_{i}\alpha_{i})}{\prod_{i}\Gamma(\alpha_{i})} \int\bigg(\prod_{i=1}^{k}\theta_{i}^{\alpha_{i}-1}\bigg)
\bigg(\prod_{n=1}^{N}\sum_{i=1}^{k}\prod_{j=1}^{V}(\theta_{i}\beta_{ij})^{w_{n}^{j}}\bigg)d\theta
$$

Variational inference can be shown as follows:

![Variational inference]({{site.url}}/images/posts/lda2.png){: .center-image }

We then use 

$$
q(\theta,z|\gamma,\phi)=q(\theta|\gamma)\prod_{n=1}^{N}q(z_{n}|\phi_{n})
$$

as a surrogate for the posterior distribution $$p(\theta,z,w\vert\alpha,\beta)$$ and we can have

$$
  \begin{align}
    	\log p(w|\alpha,\beta) &= \log\int\sum_{z}p(\theta,z,w,|\alpha,\beta)d\theta \\
                           	  &= \log \int\sum_{z}\frac{p(\theta,z,w|\alpha,\beta)q(\theta,z)}{q(\theta,z)}d\theta
  \end{align}
$$

Then use Jensen's inequality we have

$$
  \begin{align}
    &\int\sum_{z}q(\theta,z)\log p(\theta,z,w|\alpha,\beta)d\theta-\int\sum_{z}\log q(\theta,z)d\theta \\
    &= E_{q}[\log p(\theta,z,w|\alpha,\beta)]-E_{q}[\log q(\theta,z)]\\
    &= E_{q}[\log p(\theta|\alpha)]+E_{q}[\log p(z|\theta)]+E_{q}[\log p(w|z,\beta)]-E_{q}[\log q(\theta)]-E_{q}[\log q(z)]
  \end{align}
$$

where

$$
  \begin{align}
	E_{q}[\log p(w|z,\beta)]&=E_{q}[\log(\prod_{i=1}^{k}\prod_{j=1}^{V}\beta_{ij}^{z_{ni}w^{j}_{n}})]\\
						&=\int\int \log\prod_{i=1}^{k}\prod_{j=1}^{V}\beta_{ij}^{w^{j}_{n}z_{ni}}q(\theta,z|\gamma,\phi)d\theta dz\\
						&=\int\int \log\prod_{i=1}^{k}\prod_{j=1}^{V}\beta_{ij}^{w^{j}_{n}z_{ni}}q(\theta|\gamma)\prod_{n=1}^{N}q(z_{n}|\phi_{n})d\theta dz\\
						&=\int \log\prod_{i=1}^{k}\prod_{j=1}^{V}\beta_{ij}^{w^{j}_{n}z_{ni}}\prod_{n=1}^{N}q(z_{n}|\phi_{n})dz\\
						&=\int \log\prod_{i=1}^{k}\prod_{j=1}^{V}\beta_{ij}^{w^{j}_{n}z_{ni}}dz\\
						&=\int \sum_{i=1}^{k}\sum_{j=1}^{V}w^{j}_{n}z_{ni}\log\beta_{ij}dz\\
						&=\sum_{n=1}^{N}\sum_{i=1}^{k}\sum_{j=1}^{V}w_{n}^{j}\phi_{ni}\log\beta_{ij}
  \end{align}
$$

where $$\int z_{ni}dz=\sum_{n=1}^{N}\phi_{ni}$$.
