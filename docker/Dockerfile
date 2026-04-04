# ── Build stage ───────────────────────────────────────────────────────────────
FROM php:8.2-fpm AS build

ARG APP_ENV=production

ARG UID=1000
ARG GID=1000
RUN groupadd -g ${GID} appgroup \
    && useradd -m -u ${UID} -g ${GID} appuser

RUN apt-get update && apt-get install -y \
    git curl zip unzip libzip-dev libpng-dev libonig-dev libxml2-dev \
    nodejs npm libpq-dev \
    && docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd zip dom \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

# Só instala dependências se for prod
RUN if [ "$APP_ENV" != "local" ]; then \
        composer install --no-interaction --optimize-autoloader --no-dev && \
        npm install && \
        npm run build; \
    fi

# Stage 2: runtime
FROM php:8.2-fpm

ARG APP_ENV=production

ARG UID=1000
ARG GID=1000

WORKDIR /var/www

RUN apt-get update && apt-get install -y supervisor libpq-dev libpng-dev libjpeg-dev libfreetype6-dev libzip-dev libonig-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql gd zip mbstring exif \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=build /var/www /var/www

RUN groupadd -g ${GID} appgroup \
    && useradd -m -u ${UID} -g ${GID} appuser \
    && usermod -aG appgroup www-data \
    && chown -R appuser:appgroup /var/www \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

COPY ./docker/supervisord.conf /etc/supervisor/supervisord.conf
COPY ./docker/entrypoint.sh /usr/local/bin/start
RUN chmod +x /usr/local/bin/start

USER appuser

EXPOSE 9000

CMD ["/usr/local/bin/start"]