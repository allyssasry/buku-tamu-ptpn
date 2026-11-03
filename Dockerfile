FROM php:8.2-cli-alpine

RUN apk add --no-cache \
    curl \
    git \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    ca-certificates \
    && update-ca-certificates

RUN docker-php-ext-install pdo pdo_mysql bcmath

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY backend/ .

RUN composer install --no-dev --optimize-autoloader --no-interaction

EXPOSE 8000

CMD php artisan storage:link && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}

