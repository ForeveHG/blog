最开始我没想去写Promise, 都是因为一道面试题，我开始怀疑自己对Promise有什么误解，或是根本不了解，这还是自己工作中用的挺多的一个东西，感到很惭愧，于是就想去认真了解一下，这道面试题放在下面：

``` javascript
new Promise((resolve, reject) => {
    resolve();
}).then(() => {
    console.log("promise1 resolved");
    return Promise.resolve(2)
}).then((r) => {
    console.log('----', r)
}, error => {
    console.log('error', error)
})
new Promise((resolve, reject) => {
    resolve();
}).then(() => {
    console.log("promise2 resolved");
}).then(() => {
    console.log("promise3 resolved")
}).then(() => {
    console.log("promise4 resolved")
}).then(() => {
    console.log("promise5 resolved")
})
```

<details>
<summary>运行结果</summary>
<pre>
promise1 resolved
promise2 resolved
promise3 resolved
promise4 resolved
---- 2
promise5 resolved
</pre>
</details>

<details>
<summary>在最开始，我认为的运行结果</summary>
<pre>
promise1 resolved
promise2 resolved
---- 2
promise3 resolved
promise4 resolved
promise5 resolved   
</pre>
</details>

也就是说，当时我认为return Promise.resolve(2)这句是直接替换掉了包裹它的then返回的promise，连上了后面的then，事实显然不是这样, 在网上看了很多解析，最后还是不是很理解，我就决定自己按照promiseA+规范一个promise来看看到底是怎样的，虽然实现之后发现这跟promiseA+规范没有什么关系。。。

1. Promise应该接受一个函数，这个函数是立即执行的

``` javascript
function MyPromise(executor) {
    executor()
}
```

2. 一个Promise的当前状态必须为以下三种状态中的一种：等待态（Pending）、执行态（Fulfilled）和拒绝态（Rejected）。promise当前状态为Pending时可以改变为Fulfilled或Rejected,当前状态为Fulfilled或Rejected时不能改变状态

``` javascript
function MyPromise(executor) {
    this.status = "pending"; //默认是pending
    this.value = null;
    this.reason = reason;
    this.resolve = function(value) {
        if (this.status == "pending") {
            this.value = value
            this.status = "fulfilled"
        }
    }
    this.reject = function(reason) {
        if (this.status == "pending") {
            this.reason = reason
            this.status = "rejected"
        }
    }
    try { //发生异常后立刻更改Promsie状态为rejected
        executor(this.resolve, this.reject)
    } catch (error) {
        this.reject(error)
    }
}
```

3. 一个Promise必须提供一个then方法以访问其当前值、终值和据因

``` javascript
//规范：then方法接受两个参数promise.then(onFulfilled, onRejected)
MyPromise.prototype.then = function(onFulfilled, onRejected) {
    //规范：如果 onFulfilled 不是函数，其必须被忽略，如果 onRejected 不是函数，其必须被忽略
    onFulfilled = typeof onFulfilled == "function" ? onFulfilled : function(x) {
        return x
    }
    onRejected = typeof onRejected == "function" ? onRejected : function(e) {
        return e
    }
    //规范：then 方法必须返回一个 promise 对象
    return new MyPromise(function() {})
}
```

4. onFulfilled和onRejected的特性

规范上说onFulfilled在 promise 执行结束后必须被调用，第一个参数为 promise 的终值， onRejected在promise 被拒绝执行后必须调用，第一个参数为 promise 的据因，在promies执行结束前都不能调用，且只能调用一次，promise的resolve或reject被调用是表示promise执行结束了，所以这里要用到观察者模式, 每个promise对象作为主体，在promise.then负责注册事件回调，当promise的状态发生改变时，调用对应状态的回调事件列表。

``` javascript
function MyPromise(executor) {
    this.status = "pending"; //默认是pending
    this.value = null;
    this.reason = null;
    //新增
    this.onFulfilleds = []; //完成态的回调事件列表
    this.onRejecteds = [] //拒绝态的回调事件列表
    this.resolve = function(value) {
        if (this.status == "pending") {
            this.value = value
            this.status = "fulfilled"
            //规范：当 promise 成功执行时，所有 onFulfilled 需按照其注册顺序依次回调
            for (let fn of this.onFulfilleds) {
                fn()
            }
        }
    }
    this.reject = function(reason) {
        if (this.status == "pending") {
            this.reason = reason
            this.status = "rejected"
            //当 promise 被拒绝执行时，所有的 onRejected 需按照其注册顺序依次回调
            for (let fn of this.onRejecteds) {
                fn()
            }
        }
    }
    try { //发生异常后立刻更改Promsie状态为rejected
        executor(this.resolve.bind(this), this.reject.bind(this))
    } catch (error) {
        this.reject(error)
    }
}

MyPromise.prototype.then = function(onFulfilled, onRejected) {
    let self = this;
    //规范：如果 onFulfilled 不是函数，其必须被忽略，如果 onRejected 不是函数，其必须被忽略
    onFulfilled = typeof onFulfilled == "function" ? onFulfilled : function(x) {
        return x
    }
    onRejected = typeof onRejected == "function" ? onRejected : function(e) {
        return e
    }
    let promise = new MyPromise(function(resolve, reject) {
        //在promies执行结束前不能调用，当status为pending代表promise还没有执行完,将回调加入对应状态的回调列表
        if (self.status == "pending") {
            self.onFulfilleds.push(function() {
                //规范：onFulfilled 和 onRejected 只有在执行环境堆栈仅包含平台代码时才可被调用 
                setTimeout(function() {
                    try {
                        let x = onFulfilled(self.value);
                        resolve(x)
                        // PromiseResolve(promise, x) //promise的解决过程
                    } catch (e) {
                        reject(e)
                    }
                })
            })
            self.onRejecteds.push(function() {
                //规范：onFulfilled 和 onRejected 只有在执行环境堆栈仅包含平台代码时才可被调用，所以将回调函数加入事件循环队列 
                setTimeout(function() {
                    try {
                        let x = onRejected(self.reason)
                        resolve(x)
                        // PromiseResolve(promise, x)
                    } catch (e) {
                        reject(e)
                    }
                })
            })
        } else if (self.status == "fulfilled") {
            //status为fulfilled代表promise已经执行完，直接将回调函数加入事件循环队列
            setTimeout(function() {
                try {
                    let x = onFulfilled(self.value)
                    resolve(x)
                    // PromiseResolve(promise, x)
                } catch (e) {
                    reject(e)
                }
            })
        } else if (self.status == "rejected") {
            //status为rejected代表promise已经执行完(被拒绝)，直接将回调函数加入事件循环队列
            setTimeout(function() {
                try {
                    let x = onRejected(self.reason)
                    resolve(x)
                    // PromiseResolve(promise, x)
                } catch (e) {
                    reject(e)
                }
            })
        }
    })
    return promise;
}
```

5.  Promise解决过程：[[Resolve]](promise2, x)

在上面的代码中我们在执行了onFulfilled回调后直接决议了then返回的promise对象，但规范中还做了其他处理，当得到回调函数的返回值后，还经历了一个Promis的解决过程，我们来实现以下这个解决过程PromiseResolve

``` javascript
let x = onFulfilled(self.value);
// resolve(x)
//这里不会直接决议，还有一个解决过程，我们叫他PromiseResolve(promise,x),这里的参数promise指的是then中new出来的那个promise
```

``` javascript
function PromiseResolve(promise, x) {
    //如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 promise
    if (promise == x) return promise.reject(new TypeError())
    //x为promise，对象或者函数
    if (x !== null && (typeof x == "object" || typeof x == "function")) {
        let isCall = false; //标记resolvePromise或rejectPromise是否被调用
        try {
            let then = x.then;
            //如果 then 是函数，将 x 作为函数的作用域 this 调用之。传递两个回调函数作为参数，第一个参数叫做 resolvePromise ，第二个参数叫做 rejectPromise:
            if (typeof then == "function") {
                then.call(x, function(y) {
                    //如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
                    if (isCall) return
                    isCall = true
                    //如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
                    PromiseResolve(promise, y)
                }, function(r) {
                    if (isCall) return
                    isCall = true
                    //如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
                    promise.reject(r)
                })
            } else { //如果 then 不是函数，以 x 为参数执行 promise
                promise.resolve(x)
            }
        } catch (e) {
            // then 方法抛出了异常 e,如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
            if (isCall) return
            isCall = true
            //取x.then抛出异常或者then方法抛出异常以 e 为据因拒绝 promise
            promise.reject(e)
        }
    } else { //如果 x 不为对象或者函数，以 x 为参数执行 promise
        promise.resolve(x)
    }
}
```

按照以上代码，运行结果为

``` javascript
promise1 resolved
promise2 resolved
promise3 resolved
-- --2
promise4 resolved
promise5 resolved
```

这个结果与浏览器中的结果仍然不同，似乎是少了一轮，也就是在PromiseResolve解决过程中，x.then函数不是直接执行了，而是被加入了事件队列

``` javascript
function PromiseResolve(promise, x) {
    //如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 promise
    if (promise == x) return promise.reject(new TypeError())
    //x为promise，对象或者函数
    if (x !== null && (typeof x == "object" || typeof x == "function")) {
        let isCall = false; //标记resolvePromise或rejectPromise是否被调用
        try {
            let then = x.then;
            //如果 then 是函数，将 x 作为函数的作用域 this 调用之。传递两个回调函数作为参数，第一个参数叫做 resolvePromise ，第二个参数叫做 rejectPromise:
            if (typeof then == "function") {
                setTimeout(function() { //++
                    then.call(x, function(y) {
                        //如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
                        if (isCall) return
                        isCall = true
                        //如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
                        PromiseResolve(promise, y)
                    }, function(r) {
                        if (isCall) return
                        isCall = true
                        //如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
                        promise.reject(r)
                    })
                }) //++

            } else { //如果 then 不是函数，以 x 为参数执行 promise
                promise.resolve(x)
            }
        } catch (e) {
            // then 方法抛出了异常 e,如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
            if (isCall) return
            isCall = true
            //取x.then抛出异常或者then方法抛出异常以 e 为据因拒绝 promise
            promise.reject(e)
        }
    } else { //如果 x 不为对象或者函数，以 x 为参数执行 promise
        promise.resolve(x)
    }
}
```
这样运行结果就跟浏览器一致了,但关于最后这点纯属个人看法，具体浏览器或node如何实现咱也不知道，反正这一顿操作下来，对promise的理解加深了不少，如果哪里说得不对，欢迎指正~

[这里是完整代码](../code/MyPromise.js)