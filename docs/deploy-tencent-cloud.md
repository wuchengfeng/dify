# Dify 腾讯云部署方案
## 更新代码
```bash
cd /data/dify
git pull
cd docker && docker compose up -d --build

```

## 服务器配置要求


| 配置项 | 最低要求                     | 推荐        |
| --- | ------------------------ | --------- |
| CPU | 2核                       | 4核        |
| 内存  | 4GB                      | 8GB+      |
| 磁盘  | 40GB                     | 100GB+    |
| 系统  | TencentOS / Ubuntu 22.04 | TencentOS |


---

## 1. 安装 Docker（TencentOS）

> TencentOS 不支持官方 `get.docker.com` 脚本，需手动安装。

```bash
# 添加 Docker YUM 源（使用 CentOS 源，兼容 TencentOS）
yum install -y yum-utils
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 安装 Docker
yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动并设置开机自启
systemctl enable docker && systemctl start docker

# 验证
docker --version
docker compose version
```

---

## 2. 拉取代码并配置

```bash
git clone https://github.com/wuchengfeng/dify.git
cd dify/docker

# 复制配置文件
cp .env.example .env
```

编辑 `.env`，修改以下关键项：

```bash
# 安全密钥（必须修改！）
SECRET_KEY=<用 openssl rand -base64 42 生成>

# 服务器域名或 IP
CONSOLE_API_URL=https://你的域名
APP_API_URL=https://你的域名
```

生成随机密钥：

```bash
openssl rand -base64 42
```

---

## 3. 启动服务

```bash
cd dify/docker
docker compose up -d

# 查看运行状态
docker compose ps
```

---

## 4. 腾讯云安全组配置

在腾讯云控制台 → 安全组 → 入站规则，开放以下端口：


| 端口  | 用途           |
| --- | ------------ |
| 80  | HTTP         |
| 443 | HTTPS（配置证书后） |


> 不建议直接暴露 `3000`（前端）和 `5001`（API），通过 Nginx 反代统一入口。

---

## 5. 配置 Nginx 反向代理

```bash
yum install -y nginx
systemctl enable nginx
```

创建 `/etc/nginx/conf.d/dify.conf`：

```nginx
server {
    listen 80;
    server_name 你的域名;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /v1/ {
        proxy_pass http://localhost:5001/v1/;
    }

    location /console/api/ {
        proxy_pass http://localhost:5001/console/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 文件上传大小限制
    client_max_body_size 100M;
}
```

```bash
nginx -t && systemctl reload nginx
```

---

## 6. 配置 HTTPS（推荐）

```bash
# 安装 certbot
yum install -y certbot python3-certbot-nginx

# 申请证书（需域名已解析到服务器）
certbot --nginx -d 你的域名
```

---

## 7. 数据备份

所有数据存储在 `dify/docker/volumes/` 目录下：

```
docker/volumes/
├── db/data/       # PostgreSQL 数据
├── redis/data/    # Redis 数据
└── weaviate/      # 向量数据库
```

定期备份建议：

```bash
# 停服备份（数据一致性最好）
docker compose stop
tar -czf dify-backup-$(date +%Y%m%d).tar.gz volumes/
docker compose start
```

---

## 首次访问

部署完成后，浏览器打开 `http://你的域名`，按引导创建管理员账号。