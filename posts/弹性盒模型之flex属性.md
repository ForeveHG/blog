flex属性用来设置弹性盒子项的拉伸，收缩和自身主大小，flex的属性值有多种形式，可以为一个值，两个值，或三个值

一个值
> initial | auto | none | flex-grow | flex-basis

两个值
> flex-grow | (flex-shrink | flex-basis)

三个值
> flex-grow flex-shrink flex-basis

其中，flex为单数值，initial，auto，none时其实是特定三个值的简写
> flex:1 -> flex: 1 1 0;

> flex:initial -> flex:0 1 auto

> flex:auto -> flex: 1 1 auto

> flex:none -> flex: 0 0 auto

flex-grow属性值是数值，默认值0，它定义弹性盒子项如何拉伸,当弹性项的flex-basis值相加小于盒子宽度时，弹性项的拉伸生效
单个弹性项宽度的计算方式为：
> 该项basis值 + 该项grow值 * ((总宽度 - basis值总和) / 可拉伸项数量)

flex-shrink属性值是数值，默认值1，它定义弹性盒子项如何收缩，当弹性项的flex-basis值相加大于盒子宽度时，弹性项的收缩生效，
单个弹性项宽度的计算方式为：
>flex-basis值 - (basis总和 - 总宽度) * 该项basis值 / (第一项shrink值 * 第一项宽度 + 第二项shrink值 * 第二项宽度....第n项..)

flex-basis属性值是一个带宽度单位的数值或是auto,content,initial，默认值auto
- auto: 表示元素的basis值是自身的width值，在元素的宽度计算中，当弹性盒子有空间拉伸并且flex-grow不等0时，元素宽度等于自身width值加上拉伸值
- initial: 元素的basis值是自身的width值，在元素的宽度计算中，元素的宽度保持自身width值，并且flex-grow不算入计算内，也就是说，当flex-basis为initial时，flex-grow不管等于几都可以直接看成0
- content：不知道是测试的浏览器不支持还是怎样，在整个测试过程中congtent的表现跟initial的表现一致

下面有几个例子，这些例子公用下面这一段html和css代码
```html
<div id="content">
  <div class="box1" style="background-color:red;"></div>
  <div class="box2" style="background-color:lightblue;"></div>
  <div class="box3" style="background-color:yellow;"></div>
  <div class="box4" style="background-color:green;"></div>
</div>
```
```css
#content {
  width: 200px;
  height: 100px;
  border:1px solid green;
  display: flex;
}

#content div {
  width: 30px;
}
```
第一个例子，当4个div的flex设置为下面四个值时，计算各自的宽度
```css
#content .box1 {
  flex: 1 auto;
}

#content .box2 {
  flex: 2 initial;
}

#content .box3 {
  flex: 1 0 80px;
}

#content .box4 {
  flex: 0 1 40px;
}
```
首先看所有元素flex-basis的和是否超出盒子的总宽度200px

auto和initial就是元素的width,也就是30px,所以

flex-basis的和 = 30px + 30px + 80px + 40px = 180px, 180 < 200可拉伸，不收缩

flex-grow的和 = 2，因为box2的flex-basis值为initial,所以就把它的flex-grow算成是0

box1的宽度 = 30 + 1 * ((200 - 180) / 2) = 40

box2的宽度 = 30

box3的宽度 = 80 + 1 * ((200 - 180) / 2) = 90

box3的宽度 = 40

第二个例子，计算各自的宽度
```css
#content .box1 {
  flex: 1 auto;
}

#content .box2 {
  flex: 2 initial;
}

#content .box3 {
  flex: 1 0 120px;
}

#content .box4 {
  flex: 0 1 120px;
}
```
首先看所有元素flex-basis的和是否超出盒子的总宽度200px

auto和initial就是元素的width,也就是30px,所以

flex-basis的和 = 30px + 30px + 120px + 120px = 300px, 300 > 200不可拉伸，会收缩,

flex-shrink省略时取默认值1，超出的宽度值为100

box1的宽度 = 30 - 100 * 30 / (1 * 30 + 1 * 30 + 0 * 120 + 1 * 120) = 13.33

box2的宽度 = 同上 = 13.33

box3的宽度 = 不收缩 = 120

box3的宽度 = 120 - 100 * 120 / (1 * 30 + 1 * 30 + 0 * 120 + 1 * 120) = 53.33