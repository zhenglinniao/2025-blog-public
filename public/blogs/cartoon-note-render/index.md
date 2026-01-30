
## 技巧

* 建立相机，然后 ctrl + alt + 0，可以让相机马上设置当前视角。
* 相机选中后，右键设置活动，进入相机视角。
	* 勾选右侧视图栏，锁定，可以改变当前相机视角

![](/blogs/cartoon-note-render/841f521fac76d195.webp)

* 设置镜头宽高需要在右侧 *输出* 面板设置分辨率 xy，就可以设置摄像头宽高了

![](/blogs/cartoon-note-render/ee832771bd48273f.webp)

* 设置渲染框，3d 视图下，ctrl b 可以设置渲染框， ctrl alt b 取消。v4.5 只能通过快捷键。
	* 渲染框只影响 *预览/渲染* 模式
	* camera view 下，渲染框是独立的

* 快捷键 0 是进入*摄像机视图*，ctrl + 0 是设置选择的摄像机为活动摄像机（多摄像机场景）
	* ctrl + alt + 0 是设置*当前视角*为活动摄像机视角

* 设置 cycles 渲染，改 **gpu 计算**前需要 *偏好设置* - *系统* - *渲染设备*，中选择好显卡
	* RTX NVIDIA 优先选用 OptiX
	* NVIDIA 新一代 GPU 渲染接口，基于 RTX 光线追踪加速器，OptiX 可以是 CUDA 的 2~3 倍甚至更多