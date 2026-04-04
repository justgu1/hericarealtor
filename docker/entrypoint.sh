if [ "$APP_ENV" = "local" ]; then
    echo "=== DEV ENV: Preparando Laravel ==="
    
    # PHP dependencies
    if [ ! -d "vendor" ]; then
        composer install --no-interaction --optimize-autoloader
    fi

    # Node / frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    # Laravel setup
    php artisan migrate --force
    php artisan optimize:clear
    php artisan cache:clear
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan event:cache
    php artisan storage:link
else
    echo "=== PROD ENV: Otimizando Laravel ==="
    php artisan storage:link --quiet || true
    php artisan optimize
fi

echo "=== STARTING APPLICATION ==="
/usr/bin/supervisord -c /etc/supervisor/supervisord.conf