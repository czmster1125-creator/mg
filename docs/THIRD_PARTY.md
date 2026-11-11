# 开源成果与美术来源

| 项目 | GitHub 来源 | 用途 | 许可证 |
| --- | --- | --- | --- |
| Three.js | https://github.com/mrdoob/three.js | WebGL 渲染、几何体、灯光、阴影、OrbitControls | MIT |
| Lucide | https://github.com/lucide-icons/lucide | UI 线性图标 | ISC |
| Vite | https://github.com/vitejs/vite | 开发服务器与生产构建 | MIT |
| Playwright | https://github.com/microsoft/playwright | Chromium 端到端验证 | Apache-2.0 |

依赖从官方 npm 注册表安装，由 package-lock.json 固定版本与完整性校验。各依赖完整许可证保留在 node_modules 对应包中。运行 `npm ci` 会恢复它们。

`public/art/tidebloom-island.png` 是本次通过可用图像生成工具生成的海岛主视觉，已用于海域与入口卡片。用户提及 image2，但当前接口没有提供名为 image2 的可选模型；不声称使用了该特定模型。

3D 岛屿、船只、鱼类 SVG 与 UI 排版为本次编写的程序化原创资产。没有复制其他游戏的模型、纹理或代码；文档中的截图仅用于理解需求，未分发到游戏内。

当前工具中没有 Claude 调用接口，也没有可调用的 Claude 游戏开发技能。此 Demo 使用本会话的代码与图像工具实现，没有调用 Claude。没有安装或执行未经审查的第三方 SKILL.md。

竖屏 0.2 改版参考了用户提供的新录屏的布局和动作反馈；视频文件与抽帧未纳入发布源码。纵向海岸、小艇、角色与 3D 鱼获模型均为本项目程序化资产。

0.3 基地改版参考用户所附小镇截图的建筑层次、道路绿化和产出提示组织。新增建筑、居民、装饰宠物、喷泉和树木均为程序化原创几何资产，未提取或复制参考游戏的素材。

0.5 的鱼缸游动鱼宠、NPC 海岛及攻击目标使用本项目已有程序化模型扩展；事件卡片、宝藏藏点与引导界面为本次编写，未复制外部游戏素材。

0.7 的夜航 NPC 岛、金币搬运界面、居民、步道和攻击碎片由项目原有程序化资产扩展。没有新增外部游戏素材、商业 SDK 或未经审查的技能包。
