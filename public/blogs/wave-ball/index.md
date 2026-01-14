学习 Shader，我想先学习那种变化多端的 **球**，最常见的 **噪波置换**，当然在这之前，学一个更有规律的破浪翻滚。

先添加一个在线 shader 更改的网站：[https://suni-demos.vercel.app/custom-icosahedron](https://suni-demos.vercel.app/custom-icosahedron) (加载需要下载一个 xhr 文件，需要稍等下）

![](/blogs/wave-ball/cee8a83348ec5b91.webp)

中间为 **二十面体**，而不是普通的球体，这样球形结构线条更均匀

网站使用了 `CustomShaderMaterial` ，可以自带阴影效果，也会带来一点特定的设置方式，比如 `position` 要改为使用 `csm_Position`，详细参考：[https://github.com/FarazzShaikh/THREE-CustomShaderMaterial](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial)

网站右下角为 **vertexShader** 输入框。

## 函数网站

[https://www.desmos.com/calculator](https://www.desmos.com/calculator)

这里是一个很好函数演示网站。

## 设想

要让小球发生从上到下的凹凸，就需要基于 y 轴变换 `vertex`，连续发生循环的值变换，使用函数 `mod`。

**mod(x, y)** 是创造周期性、重复性的函数
* **x** 为 x轴变量
* **y** 为 y轴的范围，比如设置 1

![](/blogs/wave-ball/a464dbbf62e10e0e.webp)

### 设置 mod 变化

vertex shader 代码

```glsl
uniform float uTime;

void main() {
  float pattern = mod(csm_Position.y * 6.0, 1.0);
  csm_Position.y += pattern;
}
```

这里带来的效果是让 y 值循环上下抖动，但是会变成锯齿状
* **6.0** 意思是让上下变换 6 次

![](/blogs/wave-ball/6026923fcb389157.webp)

### 法向

上下抖动不是我们想要的效果，需要改为**内外凹凸**，所以需要以法向为基本矢量，进行变化。

```glsl
uniform float uTime;

void main() {
  float pattern = mod(csm_Position.y * 6.0, 1.0);
  csm_Position += pattern * normal;
}
```

![](/blogs/wave-ball/5444b5d37c5bd9a2.webp)
