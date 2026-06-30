# 小鸡下蛋 H5 横屏小游戏

这是一个面向低龄儿童和亲子互动场景的 H5 横屏小游戏（landscape mobile web game）。玩家点击 10 只小动物，小动物播放叫声和英文名称后下蛋；再点击 10 颗蛋，蛋破壳并随机孵化新动物。完成后自动进入下一轮。

## 本地运行

直接打开 `index.html` 即可运行。为了更接近手机浏览器环境，也可以启动一个静态服务：

```bash
cd chicken-egg-game
python3 -m http.server 4173
```

然后在浏览器打开：

```text
http://localhost:4173
```

## 项目结构

```text
chicken-egg-game/
  index.html
  css/
    style.css
  js/
    main.js
  assets/
    images/
      animals/
      eggs/
      background/
    audio/
      voice/
      animals/
      words/
      effects/
```

当前版本使用 CSS、emoji、WebAudio 合成音效和浏览器语音合成（SpeechSynthesis）保证完整逻辑可运行。后续可以替换为真实图片和真实音频。

## 替换图片资源

把动物图片放入：

```text
assets/images/animals/
```

建议命名：

```text
chicken.png
duck.png
goose.png
bird.png
cat.png
dog.png
sheep.png
cow.png
pig.png
rabbit.png
```

如果要从 emoji 改成图片，可以在 `js/main.js` 的 `createAnimalNode` 和孵化动物节点里改为 `<img>`。

## 替换音频资源

建议路径：

```text
assets/audio/voice/start.mp3
assets/audio/animals/chicken.mp3
assets/audio/words/chicken.mp3
assets/audio/effects/egg_crack.mp3
```

当前版本没有强依赖音频文件，而是用 WebAudio 生成动物叫声和系统音效。接入真实音频时，可以在 `js/main.js` 新增 `Audio` 播放队列，保持“动物叫声 → 英文名称 → 下蛋动画”的顺序。

## 部署到 GitHub Pages

1. 将 `chicken-egg-game` 目录推送到 GitHub 仓库。
2. 进入仓库 `Settings` → `Pages`。
3. Source 选择 `Deploy from a branch`。
4. 选择包含该目录的分支和目录。
5. 保存后等待 GitHub Pages 生成访问链接。

## 部署到 Vercel

1. 登录 Vercel。
2. 导入 GitHub 仓库。
3. Framework Preset 选择 `Other`。
4. Build Command 留空。
5. Output Directory 指向 `chicken-egg-game`，或将该目录作为项目根目录导入。

## 兼容说明

- 支持手机浏览器触摸点击（pointer events）。
- 竖屏时显示“请旋转手机横屏体验”。
- 点击“开始游戏”后才初始化音频，兼容移动端自动播放限制。
- 不依赖第三方库，可直接部署到静态服务器。
