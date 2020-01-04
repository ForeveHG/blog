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

规范上说onFulfilled在 promise 执行结束后必须被调用，第一个参数为 promise 的终值， onRejected在promise 被拒绝执行后必须调用，第一个参数为 promise 的据因，在promies执行结束前都不能调用，且只能调用一次，promise的resolve或reject被调用是表示promise执行结束了，所以这里要用到观察者模式, 每个promise对象作为主体，在promise.then负责注册事件回调，当promise得状态发生改变时，调用对应状态的回调事件列表。

``` javascript
function MyPromise(executor) {
    this.status = "pending"; //默认是pending
    this.value = null;
    this.reason = reason;
    //新增
    this.onFulfilleds = [];
    this.onRejecteds = []
    this.resolve = function(value) {
        if (this.status == "pending") {
            this.value = value
            this.status = "fulfilled"
            //新增
            for (let fn of this.onFulfilleds) {
                fn()
            }
        }
    }
    this.reject = function(reason) {
        if (this.status == "pending") {
            this.reason = reason
            this.status = "rejected"
            //新增
            for (let fn of this.onRejecteds) {
                fn()
            }
        }
    }
    try { //发生异常后立刻更改Promsie状态为rejected
        executor(this.resolve, this.reject)
    } catch (error) {
        this.reject(error)
    }
}

//规范：then方法接受两个参数promise.then(onFulfilled, onRejected)
MyPromise.prototype.then = function(onFulfilled, onRejected) {
    let self = this;
    //规范：如果 onFulfilled 不是函数，其必须被忽略，如果 onRejected 不是函数，其必须被忽略
    onFulfilled = typeof onFulfilled == "function" ? onFulfilled : function(x) {
        return x
    }
    onRejected = typeof onRejected == "function" ? onRejected : function(e) {
        return e
    }
    //规范：then 方法必须返回一个 promise 对象
    return new MyPromise(function(resolve, reject) {
        //在promies执行结束前不能调用，当status为pending代表promise还没有执行完,将回调加入对应状态的回调列表
        if (this.status == "pending") {
            this.onFulfilleds.push(functioin() {
                //规范：onFulfilled 和 onRejected 只有在执行环境堆栈仅包含平台代码时才可被调用 
                setTimeout(function() {
                    try {
                        onFulfilled(self.value)
                    } catch (e) {
                        reject(e)
                    }
                })
            })
            this.onRejecteds.push(functioin() {
                //规范：onFulfilled 和 onRejected 只有在执行环境堆栈仅包含平台代码时才可被调用 
                setTimeout(function() {
                    try {
                        onRejected(self.value)
                    } catch (e) {
                        reject(e)
                    }
                })
            })
        } else if (this.status == "fulfilled") {
            setTimeout(function() {
                try {
                    onFulfilled(self.value)
                } catch (e) {
                    reject(e)
                }
            })
        } else if (this.status == "rejected") {
            setTimeout(function() {
                try {
                    onRejected(self.value)
                } catch (e) {
                    reject(e)
                }
            })
        }
    })
}
```

