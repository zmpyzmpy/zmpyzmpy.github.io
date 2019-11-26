---
layout: post
title: "Multiprocessing in Python"
date: 2019-11-26 16:32:02 +0800
tags: 
- Python
---

## Problem with multiprocessing

Pool needs to pickle (serialize) everything it sends to its worker-processes. Pickling actually only saves the name of a function and unpickling requires re-importing the function by name. For that to work, the function needs to be defined at the top-level, nested functions won't be importable by the child and already trying to pickle them raises an exception.

```python
import multiprocessing
class OtherClass:
    def run(sentence, graph):
        return False
class SomeClass:
    def __init__(self):
        self.sentences = [["Some string"]]
        self.graphs = ["string"]
    def some_method(self):
        def single(params):
            other = OtherClass
            sentences, graph = params
            return [other.run(sentence, graph) for sentence in sentences]
        return list(pool.map(single, zip(self.sentences, self.graphs)))

pool = multiprocessing.Pool(multiprocessing.cpu_count() - 1)
SomeClass().some_method()
```

The above code would result in the following error:

```bash
AttributeError: Can't pickle local object 'SomeClass.some_method.<locals>.single'
```

## Alternatives

### Pathos

To solve this problem, one alternative we can use is [multiprocess](https://github.com/uqfoundation/multiprocess) from [Pathos](https://github.com/uqfoundation/pathos). It is a multiprocessing implementation that uses [dill](https://github.com/uqfoundation/dill) on the backend which supports serializing and deserializing for almost all types.

```python
import pathos
class OtherClass:
    def run(sentence, graph):
        return False
class SomeClass:
    def __init__(self):
        self.sentences = [["Some string"]]
        self.graphs = ["string"]
    def some_method(self):
        def single(params):
            other = OtherClass
            sentences, graph = params
            return [other.run(sentence, graph) for sentence in sentences]
        return list(pool.map(single, zip(self.sentences, self.graphs)))

pool = pathos.multiprocessing.Pool(multiprocessing.cpu_count() - 1)
SomeClass().some_method()
```

Same code as prevous one, but no error this time.

### Ray

[Ray](https://github.com/ray-project/ray) is a fast and simple framework for building and running distributed applications. Ray leverages [Apache Arrow](https://arrow.apache.org/) for efficient data handling and provides **task** and **actor** abstractions for distributed computing. It can

> 1. Running the same code on more than one machine.
>
> 2. Building microservices and actors that have state and can communicate.
>
> 3. Gracefully handling [machine failures](https://ray.readthedocs.io/en/latest/fault-tolerance.html).
>
> 4. Efficiently handling [large objects and numerical data](https://ray-project.github.io/2017/10/15/fast-python-serialization-with-ray-and-arrow.html).
>
>    [more](https://towardsdatascience.com/modern-parallel-and-distributed-python-a-quick-tutorial-on-ray-99f8d70369b8)

### Joblib

[Joblib](https://github.com/joblib/joblib) joblib is a parallel processing library for python which was developed by many of the same people who work on scikit-learn, and is widely used inside scikit-learn to parallelize some of their algorithms. It is built on top of the multiprocessing and multithreading libraries in order to support both but has a significant portion of additional features. One of the biggest ones is the ability to use a pool of workers like a context manager which can be reused across many tasks to be parallelized.

### futures

As stated in the documentation, [`concurrent.futures.ProcessPoolExecutor`](https://docs.python.org/3/library/concurrent.futures.html#processpoolexecutor) is a wrapper around a `multiprocessing.Pool`. As such, the same limitations of `multiprocessing` apply (e.g. objects need to be pickleable).

## Benchmarks
### Benchmark on data pipeline

#### sample code

```python
'''
ray
'''
import numpy as np
import psutil
import ray
import scipy.signal

num_cpus = psutil.cpu_count(logical=False)
ray.init(num_cpus=num_cpus)

@ray.remote
def f(image, random_filter):
    # Do some image processing.
    return scipy.signal.convolve2d(image, random_filter)[::5, ::5]
filters = [np.random.normal(size=(4, 4)) for _ in range(num_cpus)]
# Time the code below.
for _ in range(10):
    image = np.zeros((3000, 3000))
    image_id = ray.put(image)
    ray.get([f.remote(image_id, filters[i]) for i in range(num_cpus)])
ray.shutdown()

'''
multiprocessing
'''
from multiprocessing import Pool
import numpy as np
import psutil
import scipy.signal

num_cpus = psutil.cpu_count(logical=False)

def f(args):
    image, random_filter = args
    # Do some image processing.
    return scipy.signal.convolve2d(image, random_filter)[::5, ::5]

pool = Pool(num_cpus)
filters = [np.random.normal(size=(4, 4)) for _ in range(num_cpus)]
# Time the code below.
for _ in range(10):
    image = np.zeros((3000, 3000))
    pool.map(f, zip(num_cpus * [image], filters))

'''
joblib
'''
from joblib import Parallel, delayed
import numpy as np
import psutil
import scipy.signal

num_cpus = psutil.cpu_count(logical=False)

def f(args):
    image, random_filter = args
    # Do some image processing.
    return scipy.signal.convolve2d(image, random_filter)[::5, ::5]

filters = [np.random.normal(size=(4, 4)) for _ in range(num_cpus)]
pool = Parallel(num_cpus)
for _ in range(10):
    image = np.zeros((3000, 3000))
    pool(delayed(f)((image, filters[i])) for i in range(num_cpus))

'''
pathos
'''
from pathos.multiprocessing import Pool
import numpy as np
import psutil
import scipy.signal

num_cpus = psutil.cpu_count(logical=False)

def f(args):
    image, random_filter = args
    # Do some image processing.
    return scipy.signal.convolve2d(image, random_filter)[::5, ::5]

pool = Pool(num_cpus)
filters = [np.random.normal(size=(4, 4)) for _ in range(num_cpus)]
# Time the code below.
for _ in range(10):
    image = np.zeros((3000, 3000))
    pool.map(f, zip(num_cpus * [image], filters))

'''
futures
'''
import concurrent.futures
import numpy as np
import psutil
import scipy.signal

num_cpus = psutil.cpu_count(logical=False)

def f(args):
    image, random_filter = args
    # Do some image processing.
    return scipy.signal.convolve2d(image, random_filter)[::5, ::5]

executor = concurrent.futures.ProcessPoolExecutor(max_workers=num_cpus)
filters = [np.random.normal(size=(4, 4)) for _ in range(num_cpus)]
# Time the code below.
for _ in range(10):
    image = np.zeros((3000, 3000))
    executor.map(f, zip(num_cpus * [image], filters))
executor.shutdown()

'''
serial
'''
import numpy as np
import psutil
import scipy.signal

num_cpus = psutil.cpu_count(logical=False)

def f(args):
    image, random_filter = args
    # Do some image processing.
    return scipy.signal.convolve2d(image, random_filter)[::5, ::5]

filters = [np.random.normal(size=(4, 4)) for _ in range(num_cpus)]
# Time the code below.
for _ in range(10):
    image = np.zeros((3000, 3000))
    for i in range(num_cpus):
        f((image, filters[i]))
```



![img](data:image/png;base64,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)