最开始我没想去写Promise,都是因为一道面试题，我开始怀疑自己对Promise有什么误解，或是根本不了解，这还是自己工作中用的挺多的一个东西，感到很惭愧，于是就想去认真了解一下，这道面试题放在下面：
```javascript
new Promise((resolve, reject) => {
    resolve(); 
}).then(() => {
    console.log("promise1 resolved");
    return Promise.resolve(2)
}).then((r) => {
    console.log('----',r)
},error => {
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
<details>
在最开始，我认为的运行结果：
```
promise1 resolved
promise2 resolved
---- 2
promise3 resolved
promise4 resolved
promise5 resolved   
```
也就是说，当时我认为return Promise.resolve(2)这句是直接替换掉了包裹它的then返回的promise，连上了后面的then，事实显然不是这样,在网上看了很多解析，最后还是不是很理解，我就决定自己按照promiseA+规范一个promise来看看到底是怎样的，虽然实现之后发现这跟promiseA+规范没有什么关系。。。

首先Promise应该接受一个函数，这个函数是立即执行的
```
function MyPromise(executor) {
  executor()
}
```
然后规范上说一个Promise的当前状态必须为以下三种状态中的一种：等待态（Pending）、执行态（Fulfilled）和拒绝态（Rejected）。promise当前状态为Pending时可以改变为Fulfilled或Rejected,当前状态为Fulfilled或Rejected时不能改变状态
```
function MyPromise(executor) {
    this.status = "pending"; //默认是pending
    this.value = null;
    this.reason = reason;
    this.resolve = function (value) {
        if (this.status == "pending") {
            this.value = value
            this.status = "fulfilled"
        }
    }
    this.reject = function (reason) {
        if (this.status == "pending") {
            this.reason = reason
            this.status = "fulfilled"
        }
    }
    try {
        executor(this.resolve, this.reject)
    } catch (error) {
        this.reject(error)
    }
}
```
