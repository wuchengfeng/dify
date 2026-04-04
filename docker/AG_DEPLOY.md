# AG 星舰平台部署说明

## 推荐线上摆放方式

- 代码目录：`/data/dify`
- 启动目录：`/data/dify/docker`
- 访问地址：建议使用单独二级域名，例如 `https://ag.example.com`

## 为什么建议单独地址

`dify` 自己带完整的页面和接口体系，单独地址最稳，不容易和主站页面互相影响。

## 关键配置

在 `docker/.env` 中至少确认以下几项：

```ini
CONSOLE_API_URL=https://ag.example.com
CONSOLE_WEB_URL=https://ag.example.com
APP_API_URL=https://ag.example.com
APP_WEB_URL=https://ag.example.com

# 指向主站后端，用于 AG 读取登录通行证和个人空间
AG_API_BASE=https://www.example.com/api
```

如果主站和 AG 用的是同一个域名体系，也可以按实际地址填写。

## 第一次部署

```bash
cd /data
git clone <your-dify-repo-url> dify
cd /data/dify/docker
cp .env.example .env
chmod +x deploy-ag.sh
./deploy-ag.sh
```

## 后续发布

```bash
cd /data/dify/docker
./deploy-ag.sh
```

## 常用排查命令

发布完成后，`/data/dify` 最外层会恢复成 CTO 熟悉的老用法，可以直接输入 `docker compose ...`。

推荐直接用：

```bash
cd /data/dify
docker compose ps
docker compose logs --tail=80 web
docker compose logs --tail=80 api
docker compose restart web
```

如果你想在原来的 `docker` 子目录里操作，也可以：

```bash
cd /data/dify/docker
docker compose -p dify -f docker-compose.yaml logs --tail=80 web
```

## 主站后端需要同步配置

`marsedu` 服务器环境里需要补：

```ini
AG_STARSHIP_WEB_URL=https://ag.example.com
```

这样主站个人中心点“进入 AG”时，才会跳到正确的星舰平台地址。

## GitHub Actions

如果希望推送到 `main` 后自动发布，可在仓库 Secrets 中配置：

- `HOST`
- `USERNAME`
- `KEY`

然后使用仓库里的 `deploy-ag.yml` 工作流。
