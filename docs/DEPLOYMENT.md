# CueMath 部署指南

本文档说明如何将 CueMath 前端 H5 应用部署到自有服务器（Nginx + HTTPS）。

## 前置条件

- **Node.js** ≥ 20（推荐 v22 LTS）
- **pnpm**（推荐）或 npm
- **服务器**：Linux（Ubuntu/Debian 推荐）+ SSH 访问
- **Nginx** ≥ 1.18
- **域名**：已解析到服务器 IP
- **Let's Encrypt**（免费 HTTPS 证书）

---

## 1. 本地构建

```bash
# 安装依赖（首次）
pnpm install

# 构建生产版本（dist/ 目录）
pnpm build

# 本地预览（可选，验证构建产物）
pnpm preview
```

构建产物在 `dist/` 目录，包含：
- `index.html`（入口，相对路径引用资源）
- `assets/`（JS/CSS，文件名含 hash，可长期缓存）

---

## 2. 打包并上传

```bash
# 打包
zip -r cuemath-dist.zip dist/ -x "*.DS_Store"

# 上传到服务器
scp cuemath-dist.zip user@yourserver:/tmp/
```

---

## 3. 服务器部署

```bash
# SSH 登录
ssh user@yourserver

# 创建目录
sudo mkdir -p /var/www/cuemath

# 解压
sudo unzip -o /tmp/cuemath-dist.zip -d /var/www/cuemath
# 结果：/var/www/cuemath/dist/index.html

# 设置权限
sudo chown -R www-data:www-data /var/www/cuemath/dist
```

---

## 4. Nginx 配置

复制 `nginx/cuemath.conf` 到 `/etc/nginx/conf.d/` 并修改 `server_name`：

```bash
sudo cp /var/www/cuemath/nginx/cuemath.conf /etc/nginx/conf.d/cuemath.conf
# 或手动编辑
sudo nano /etc/nginx/conf.d/cuemath.conf
```

**关键配置**（部署在 `/cue/` 子路径）：

```nginx
server {
    listen 80;
    server_name maxuebing.cn;

    # /cue 子路径重定向到 /cue/（相对路径资源需要尾斜杠）
    location = /cue {
        return 301 /cue/;
    }

    location /cue/ {
        alias /var/www/cuemath/dist/;
        index index.html;
        try_files $uri $uri/ /cue/index.html;

        # 静态资源长期缓存（Vite 产出文件名含 hash）
        location /cue/assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # index.html 不缓存（确保更新即时生效）
        location = /cue/index.html {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
}
```

**检查并重启 Nginx**：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

访问 `http://maxuebing.cn/cue/`（注意尾斜杠）验证。

---

## 5. 申请 HTTPS（Let's Encrypt）

```bash
# 安装 certbot（首次）
sudo apt update && sudo apt install -y certbot python3-certbot-nginx

# 申请证书并自动配置 Nginx
sudo certbot --nginx -d maxuebing.cn

# 验证自动续期
sudo certbot renew --dry-run
```

访问 `https://maxuebing.cn/cue/` 验证。

---

## 6. 更新部署

```bash
# 本地构建 + 打包
pnpm build && zip -r cuemath-dist.zip dist/ -x "*.DS_Store"

# 上传 + 替换
scp cuemath-dist.zip user@yourserver:/tmp/
ssh user@yourserver "sudo rm -rf /var/www/cuemath/dist && sudo unzip -o /tmp/cuemath-dist.zip -d /var/www/cuemath"
```

无需重启 Nginx（静态文件即时生效，但客户端可能缓存旧 `index.html`，见 4 节 no-cache 配置）。

---

## 7. 常见问题

| 问题 | 原因 | 解决 |
|---|---|---|
| 资源 404（/assets/...） | 缺尾斜杠，相对路径解析错 | 访问 `/cue/`（带尾 /）或配 `location = /cue` 重定向 |
| 页面空白 | `dist/` 目录权限不对 | `sudo chown -R www-data:www-data /var/www/cuemath/dist` |
| HTTPS 证书申请失败 | 域名未解析到服务器 | 检查 DNS A 记录 |
| 音效不播放 | 移动端 AudioContext 需用户手势解锁 | 首次点击后自动解锁 |
| localStorage 数据丢失 | 隐私模式 / 清浏览器缓存 | 正常，数据纯本地 |

---

## 8. 配置文件

- `vite.config.ts`：`base: './'`（相对路径，支持任意子路径部署）
- `nginx/cuemath.conf`：Nginx 配置示例（本项目内）
- `.gitignore`：已排除 `node_modules/`、`dist/`、`*.tsbuildinfo`、`cuemath-dist.zip`
