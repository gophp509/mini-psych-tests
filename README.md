# Mini Psych Tests

一个配置驱动的轻量心理测试网页集合。

## 当前测试

- 爱情吸引模式测试：`?test=love-attraction`

## GitHub Pages 链接

开启 GitHub Pages 后访问：

```text
https://gophp509.github.io/mini-psych-tests/?test=love-attraction
```

## 新增测试

1. 在 `configs/` 下新增一个 JSON 文件，例如 `boundary.json`。
2. 文件结构沿用 `configs/love-attraction.json`。
3. 访问 `?test=boundary` 即可打开新测试。

评分逻辑：统计用户选择最多的选项 key，并展示对应结果。第二名和第一名差距小于等于 `secondaryThreshold` 时，会显示副倾向。

Last deployment trigger: 2026-07-22
