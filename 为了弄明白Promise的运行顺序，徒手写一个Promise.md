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
  <summary>运行结果<summary>
  <pre>
  //promise1 resolved
  //promise2 resolved
  //promise3 resolved
  //promise4 resolved
  //----2
  //promise5 resolved
  </pre>
</details>
