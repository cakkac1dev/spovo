#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────
#  SPOVO — установка на Ubuntu VPS (root). Запускать ИЗ папки проекта,
#  которую ты залил в /opt/spovo. Пример:
#     scp -r SITE_KALL root@IP:/opt/spovo      (с локального ПК)
#     ssh root@IP
#     bash /opt/spovo/deploy/setup.sh
# ───────────────────────────────────────────────────────────────────
set -e

APP_DIR="/opt/spovo"
DOMAIN="spovo.xyz"   # ← поменяй, если домен другой
PORT="8765"

echo "==> 1/6  Пакеты системы"
apt-get update -y
apt-get install -y python3 python3-venv python3-pip ffmpeg nginx curl
# certbot для HTTPS (необязательно, но желательно)
apt-get install -y certbot python3-certbot-nginx || true

echo "==> 2/6  Python-окружение (venv) + зависимости"
cd "$APP_DIR"
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install --upgrade flask yt-dlp requests ytmusicapi \
  || ./venv/bin/pip install --upgrade -i https://pypi.tuna.tsinghua.edu.cn/simple flask yt-dlp requests ytmusicapi

echo "==> 3/6  systemd-сервис (автозапуск 24/7)"
cat > /etc/systemd/system/spovo.service <<EOF
[Unit]
Description=SPOVO music service
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
Environment=LANE_HOST=127.0.0.1
Environment=LANE_PORT=$PORT
Environment=LANE_NO_BROWSER=1
ExecStart=$APP_DIR/venv/bin/python $APP_DIR/server.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable spovo
systemctl restart spovo
sleep 2
systemctl --no-pager --full status spovo | head -n 12 || true

echo "==> 4/6  nginx (домен -> 127.0.0.1:$PORT, со стримингом)"
cat > /etc/nginx/sites-available/spovo <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;          # важно для стриминга аудио
        proxy_request_buffering off;
        proxy_read_timeout 3600s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/spovo /etc/nginx/sites-enabled/spovo
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "==> 5/6  HTTPS (Let's Encrypt) для $DOMAIN"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect \
  && echo "   HTTPS OK" \
  || echo "   [!] HTTPS не настроился (проверь, что домен указывает на этот сервер). Сайт пока на http://"

echo "==> 6/6  Готово"
echo "-------------------------------------------------------------"
echo "  Открой:  https://$DOMAIN    (или http:// если HTTPS не встал)"
echo "  Логи:    journalctl -u spovo -f"
echo "  Рестарт: systemctl restart spovo"
echo "  Куки (для стабильного YouTube): положи cookies.txt в $APP_DIR"
echo "           затем: systemctl restart spovo"
echo "-------------------------------------------------------------"
