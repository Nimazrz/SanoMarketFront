FROM node:18

WORKDIR /app

# نصب وابستگی‌ها
COPY package*.json ./
RUN npm install

# کپی باقی فایل‌ها
COPY . .

# Build tailwind once
RUN npx tailwindcss -i ./src/input.css -o ./public/styles/app.css

# نصب serve برای نمایش public/
RUN npm install -g serve

EXPOSE 3000

# اجرای سرور ساده
CMD ["serve", "-s", "public", "-l", "3000"]