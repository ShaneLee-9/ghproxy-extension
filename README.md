# GitHub Accelerator - GitHub 下载加速器

<table style="border: none; width: 100%;">
<tr>
<td width="35%" align="center" valign="middle" style="border: none;">
<img src=".icons/icon.png" alt="icon" width="80" style="vertical-align: middle;">
<span style="font-size: 24px; color: #666; vertical-align: middle; margin: 0 10px;">Made by</span>
<a href="https://www.hubp.org" target="_blank">
<img src=".icons/hubp.png" alt="hubp" width="80" style="vertical-align: middle;">
</a>
</td>
<td width="65%" align="center" valign="middle" style="border: none;">
<img src=".icons/bg.png" alt="bg" width="100%" style="max-width: 600px; margin-bottom: 10px;">
<a href="https://www.hubp.org/projects/extension" target="_blank">
<img src=".icons/xc.png" alt="xc" width="100%" style="max-width: 600px;">
</a>
</td>
</tr>
</table>

[![GitHub](https://img.shields.io/github/license/hubporg/ghproxy-extension)](LICENSE)

GitHub 下载路由 · 固定代理地址 · 支持 IDM 等下载工具

## 📖 项目简介

GitHub Accelerator 是一款 GitHub 下载链接扩展。你可以设置固定代理地址；访问受支持的 GitHub 下载链接时，扩展会直接跳转到对应代理地址。

## ✨ 主要功能

- 🔧 **固定代理**：在弹窗设置一个持久化的 HTTP/HTTPS 代理地址
- 🎯 **加速链接**：为 Release、Archive、Raw、Code Download 和 Gist 资源生成代理链接，兼容 IDM 等下载工具[用户须知](#%EF%B8%8F-%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)
- 🛡️ **页面级拦截**：捕获下载链接点击并直接跳转到代理地址，保留页面脚本触发链接的处理能力
- 🐵 **油猴脚本**：不装扩展也能用，Tampermonkey / Violentmonkey 版本见下文
- 🖱️ **右键菜单**：复制代理链接或在新标签页打开
- ↪️ **自动跳转**：配置代理地址后，支持的下载链接直接转换为代理链接

## 📦 安装方式

### 扩展商店安装（推荐）

- **Microsoft Edge 扩展商店**: [GitHub Accelerator](https://microsoftedge.microsoft.com/addons/detail/pingkpgackfhaonibagjlibmobkhgdml)
- **Firefox Add-ons 商店**: [GitHub Accelerator](https://addons.mozilla.org/addon/github-accelerator/)
- **Chrome Web Store**: [GitHub Accelerator](https://chromewebstore.google.com/detail/github-accelerator-github/bcbnfbcmbcoogjihnoediilgpfohkdef)

### 手动安装

#### Chrome/Edge 浏览器

1. 从 [Releases](https://github.com/hubporg/ghproxy-extension/releases) 下载 `.crx` 文件
2. 打开浏览器扩展管理页面：
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. 开启右上角的"开发者模式"
4. 将 `.crx` 文件直接拖拽到扩展管理页面即可安装

#### Firefox 浏览器

1. 从 [Releases](https://github.com/hubporg/ghproxy-extension/releases) 下载 `.xpi` 文件
2. 浏览器会询问你是否安装，点击同意。

## 🐵 油猴脚本版本

不想安装扩展时，也可以用 Tampermonkey / Violentmonkey 运行独立脚本。油猴脚本有自己的界面和代理逻辑；本次固定代理改造只覆盖浏览器扩展，油猴脚本仍保留原有节点管理功能：

- **脚本文件**：[userscript/github-accelerator.user.js](userscript/github-accelerator.user.js)（v0.4.0）
- **安装**：油猴管理面板 → 新建脚本 → 粘贴整份内容保存；首次运行先弹出隐私说明，同意后才启用；安装时允许 `@connect *`（节点测速会请求所有节点域名）
- **首次隐私确认**：与扩展打开隐私页的行为一致，未同意前不拦截、不测速；可在脚本菜单「隐私设置」里重新开启
- **注入式拦截**：点击下载链接时在页面内注入独立面板（节点选择、原始/加速链接、复制、倒计时、始终加速、返回），不需要扩展的独立拦截页
- **页面级 hook**：捕获阶段 `click` 拦截 + `unsafeWindow.HTMLAnchorElement.prototype.click` hook（`@sandbox raw`），`a.click()` 这类脚本触发下载也会先进入拦截流程（对齐扩展 `main-hooks.js` 的抗 IDM 逻辑）
- **节点测速**：使用脚本自己的 `nodes.json` 源、并发测速和 2 小时缓存；拉取云端 icon 做 SHA-256 校验，内容不一致的节点直接排除
- **匿名统计**：与扩展 `stats.js` 同一接口与 payload（`jumps/installs/browser/version/source/timestamp`），批量 5 次或每 5 分钟提交，受隐私同意控制；后端按 `source` 区分扩展与油猴来源
- **浮标 + 面板**：右下角浮标点开 popup 风格面板，含节点测速、自定义节点、地理位置、缓存剩余、公告、始终加速
- **官网联动**：在 hubp.org 页面按 `{ __ghAccelSite: true }` 协议广播本地节点测速与计数，官网 2 小时内可直接复用
- **配置隔离**：所有 DOM id / class / 全局变量都带 `ghx9f3a` 前缀，缓存、关闭的公告等只存在油猴本地存储
- **差异**：没有右键菜单；公告关闭记忆与扩展各自独立；Violentmonkey 不支持 `@sandbox` 时 `a.click()` hook 会退化为普通 click 拦截
- **规则同步**：链接规则与 `src/shared/link-patterns.js` 必须一致，改规则后跑 `node userscript/sync-check.mjs` 校验
- **自动更新**：脚本带 `@updateURL` / `@downloadURL`（CDN `hubp.tbedu.top/userscript/`），从更新页安装后由 Tampermonkey / Violentmonkey 自动检查版本；「关于」页还提供「检测更新」按钮，主动比对远端 `@version`，CDN 不可用时回退 GitHub raw
- **日志**：默认只输出一条 `[ghx9f3a] v0.4.0 loaded @ ...` 启动日志；脚本菜单「🐛 调试日志」开启后，F12 Console 会输出节点测速、拦截、位置、公告、统计上报、桥接等详细日志（统一前缀 `[ghx9f3a]`）
- **隐私**：只请求节点接口、测速图片、官网公告、加速链接与匿名统计；不收集浏览历史、不读取页面内容

## 🎯 使用指南

### 基本使用

1. 打开扩展弹窗，填写并保存代理地址
2. 访问 GitHub 下载链接（Releases、Archive、Raw 等）
3. 扩展会直接将链接跳转到代理地址

### Popup 页面功能

- 输入并保存一个 HTTP/HTTPS 代理地址
- 查看当前保存的地址；代理地址保存在本地浏览器
- 支持代理服务路径，例如 `https://proxy.example.com/github`

### 右键菜单功能

在 GitHub 链接上右键点击，可选择：

- 🚀 复制 GitHub 加速链接
- ⚡ 打开 GitHub 加速链接（新标签页）

## 🔍 支持的下载场景

- ✅ GitHub Releases 下载
- ✅ GitHub Archive 下载（ZIP/TAR.GZ）
- ✅ GitHub Raw 文件下载
- ✅ Code Download 下载
- ✅ Gist 文件下载

## 🛠️ 技术原理

1. **统一配置**：代理地址以 `proxyUrl` 保存到 `storage.local`
2. **URL 转换**：统一转换入口保留代理服务路径，并处理 GitHub 下载、Raw、Archive 和 codeload 地址
3. **页面级拦截**：MAIN world 内容脚本在 `document_start` 注入，捕获阶段 hook `click` 事件与 `HTMLAnchorElement.prototype.click`，再配合 `webNavigation` API 兜底导航类下载
4. **直接重定向**：扩展把识别到的原始下载 URL 转换为代理 URL 并更新当前标签页

## 🔮 TODO

### 计划中的功能

- [x] **油猴脚本版本**（v0.4.0，见 [userscript/](userscript/github-accelerator.user.js)）
- 页面级拦截并兼容 IDM；油猴版本独立维护节点测速和设置
  - 无需安装扩展，跨浏览器支持
- [x] 下载统计功能

## ⚠️ 注意事项

1. **公益服务，请勿滥用**：本服务为公益性质，请合理使用
2. **隐私保护**：扩展不会收集任何用户隐私数据
3. **兼容性**：需要 Chrome 111+ / Edge 111+（`world: "MAIN"` 要求）或 Firefox 140+（`data_collection_permissions` 要求）及基于其内核的浏览器
4. **网络环境**：建议配合代理工具使用效果更佳
5. **IDM 用户须知**：扩展会将受支持的 GitHub 下载链接直接重定向到配置的代理地址。请在你的 IDM 环境中确认代理下载请求能正常接管。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- 感谢所有提供公益代理节点的组织和个人
- Powered By [hubp.org](https://www.hubp.org)

## 📧 联系方式

- 项目地址：https://github.com/hubporg/ghproxy-extension
- 问题反馈：https://github.com/hubporg/ghproxy-extension/issues

---

**注意**：本扩展仅用于学习和研究目的，请勿用于商业用途。
