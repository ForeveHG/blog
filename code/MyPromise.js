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
                setTimeout(function () {
                    then.call(x, function (y) {
                        //如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
                        if (isCall) return
                        isCall = true
                        //如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
                        PromiseResolve(promise, y)
                    }, function (r) {
                        if (isCall) return
                        isCall = true
                        //如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
                        promise.reject(r)
                    })
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

function MyPromise(executor) {
    this.status = "pending"; //默认是pending
    this.value = null;
    this.reason = null;
    //新增
    this.onFulfilleds = []; //完成态的回调事件列表
    this.onRejecteds = [] //拒绝态的回调事件列表
    this.resolve = function (value) {
        if (this.status == "pending") {
            this.value = value
            this.status = "fulfilled"
            //规范：当 promise 成功执行时，所有 onFulfilled 需按照其注册顺序依次回调
            for (let fn of this.onFulfilleds) {
                fn()
            }
        }
    }
    this.reject = function (reason) {
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

MyPromise.prototype.then = function (onFulfilled, onRejected) {
    let self = this;
    //规范：如果 onFulfilled 不是函数，其必须被忽略，如果 onRejected 不是函数，其必须被忽略
    onFulfilled = typeof onFulfilled == "function" ? onFulfilled : function (x) {
        return x
    }
    onRejected = typeof onRejected == "function" ? onRejected : function (e) {
        return e
    }
    let promise = new MyPromise(function (resolve, reject) {
        //在promies执行结束前不能调用，当status为pending代表promise还没有执行完,将回调加入对应状态的回调列表
        if (self.status == "pending") {
            self.onFulfilleds.push(function () {
                //规范：onFulfilled 和 onRejected 只有在执行环境堆栈仅包含平台代码时才可被调用 
                setTimeout(function () {
                    try {
                        let x = onFulfilled(self.value);
                        PromiseResolve(promise, x)
                    } catch (e) {
                        reject(e)
                    }
                })
            })
            self.onRejecteds.push(function () {
                //规范：onFulfilled 和 onRejected 只有在执行环境堆栈仅包含平台代码时才可被调用，所以将回调函数加入事件循环队列 
                setTimeout(function () {
                    try {
                        let x = onRejected(self.reason)
                        PromiseResolve(promise, x)
                    } catch (e) {
                        reject(e)
                    }
                })
            })
        } else if (self.status == "fulfilled") {
            //status为fulfilled代表promise已经执行完，直接将回调函数加入事件循环队列
            setTimeout(function () {
                try {
                    let x = onFulfilled(self.value)
                    PromiseResolve(promise, x)
                } catch (e) {
                    reject(e)
                }
            })
        } else if (self.status == "rejected") {
            //status为rejected代表promise已经执行完(被拒绝)，直接将回调函数加入事件循环队列
            setTimeout(function () {
                try {
                    let x = onRejected(self.reason)
                    PromiseResolve(promise, x)
                } catch (e) {
                    reject(e)
                }
            })
        }
    })
    return promise;
}

new MyPromise((resolve, reject) => {
    resolve(2);
}).then(() => {
    console.log("promise1 resolved");
    return new MyPromise((resolve) => {
        resolve(2)
    })
}).then((r) => {
    console.log('----', r)
}, error => {
    console.log('error', error)
})
new MyPromise((resolve, reject) => {
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