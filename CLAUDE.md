# CalmWallet — CLAUDE.md

Приложение для снижения финансовой тревоги у молодёжи (22–28 лет).
Основной клиент — мобильный (`mobile/`); веб (`frontend/`) — временная заглушка.

## Структура

```
backend/
├── controllers/   # логика эндпоинтов
├── db/            # pg-пул и migrations.sql
├── middleware/    # JWT auth
├── routes/        # Express роутеры
├── services/      # gemini.service.js
└── index.js       # точка входа

mobile/                # основной клиент: Expo (React Native) + Reanimated 4
├── App.jsx            # шрифты, провайдеры, оболочка (табы + оверлей добавления)
└── src/
    ├── theme/         # дизайн-токены: цвет «тёплая бумага», шрифты, моушн, хэптика
    ├── api/client.js  # fetch-обёртка, access-токен в памяти, refresh в SecureStore
    ├── context/       # AuthContext
    ├── components/    # PressableScale, BreathingBackdrop, CoachReveal, TabBar…
    └── screens/       # Auth, Home, AddFlow (одноэкранный флоу траты), Insights

frontend/              # временная веб-заглушка
├── src/
│   ├── components/
│   │   ├── layout/    # Layout, BottomNav
│   │   └── ui/        # Button, Card, Input
│   ├── context/       # AuthContext (JWT, user state)
│   ├── pages/         # Auth, Home, AddTransaction, Transactions, Checkins
│   ├── services/      # api.js (fetch-обёртка)
│   ├── App.jsx        # роутер + Guard
│   └── main.jsx       # точка входа
├── index.html
└── vite.config.js     # proxy /api → localhost:3000
```

## Стек

### Бэкенд
- Node.js + Express
- PostgreSQL (драйвер: `pg`)
- Google Gemini API — пакет `@google/generative-ai`, модель из `GEMINI_MODEL` (дефолт `gemini-2.5-flash`; у `gemini-2.0-flash` нулевая free-tier квота — не использовать). В регионах с блокировкой Google API трафик идёт через `HTTPS_PROXY`
- JWT — пакет `jsonwebtoken`: access-токен 1 час + refresh-токен 30 дней (хранится в БД хэшем, ротация при каждом refresh)
- Пароли — bcrypt с cost factor 12, минимум 8 символов с буквой и цифрой
- Безопасность — helmet, cors (origin из `CORS_ORIGIN`), express-rate-limit на `/api/auth` (20 запросов / 15 мин)
- Логи — pino (`LOG_LEVEL`), env валидируется через zod при старте

### Мобильный клиент (основной)
- Expo SDK 54 (React Native 0.81, new arch), JS без TypeScript
- react-native-reanimated 4 — весь моушн; expo-haptics — тактильный отклик
- react-native-worklets строго 0.5.x (нативная часть вшита в Expo Go SDK 54); babel-плагин worklets подключает babel-preset-expo автоматически — вручную в babel.config.js не добавлять
- react-native-svg — иконки и график; expo-linear-gradient — hero-зона
- expo-secure-store — refresh-токен и user; access-токен только в памяти
- Шрифты: Instrument Serif (цифры/заголовки) + Hanken Grotesk (текст), через @expo-google-fonts
- Дизайн-система описана в `mobile/README.md`; токены — `mobile/src/theme/`

### Веб-фронтенд (временная заглушка)
- React 18 + React Router v6
- Vite + Tailwind CSS
- lucide-react (иконки)

## Запуск

### PostgreSQL
```bash
docker compose up -d   # поднимает Postgres 16 на localhost:5432
```

### Бэкенд
```bash
cd backend
cp .env.example .env   # заполнить переменные
npm install
npm run dev            # nodemon на порту 3000
# или
npm start
```

### Мобильный клиент
```bash
cd mobile
cp .env.example .env   # EXPO_PUBLIC_API_URL = LAN-IP машины с бэкендом (не localhost)
npm install
npx expo start         # QR для Expo Go, либо a / i для эмулятора
```

### Веб-фронтенд (заглушка)
```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm install
npm run dev            # Vite на порту 5173
```

> Vite проксирует `/api` → `http://localhost:3000`, поэтому бэкенд должен быть запущен.

## Миграции

```bash
psql $DATABASE_URL -f db/migrations.sql
```

## Переменные окружения

| Переменная     | Описание                                                |
|----------------|---------------------------------------------------------|
| GEMINI_API_KEY | Ключ Google AI Studio (опционален — без него `ai_response = null`) |
| GEMINI_MODEL   | Модель Gemini (по умолчанию `gemini-2.5-flash`)         |
| HTTPS_PROXY    | Прокси для Gemini API в регионах с блокировкой (опционален) |
| DATABASE_URL   | postgresql://user:pass@host:5432/db                     |
| JWT_SECRET     | Минимум 32 символа, для подписи access-токенов          |
| PORT           | Порт сервера (по умолчанию 3000)                        |
| CORS_ORIGIN    | Разрешённые origins через запятую (по умолчанию http://localhost:5173) |
| LOG_LEVEL      | Уровень pino-логов (по умолчанию info)                  |

## База данных

**users** — id, email (unique), password_hash, created_at

**transactions** — id, user_id, amount, category, emotional_state, triggered_by, note, ai_response, created_at, deleted_at (soft delete)
- `category`: `food` | `clothes` | `entertainment` | `subscriptions` | `other`
- `emotional_state`: `calm` | `stressed` | `sad` | `bored` | `happy` | `anxious`
- `triggered_by`: `work` | `social` | `boredom` | `habit` | `need` | `unknown`

**checkins** — id, user_id, mood_score (1–10), anxiety_score (1–10), note, created_at

**refresh_tokens** — id, user_id, token_hash (sha256, unique), expires_at, revoked_at, created_at

**weekly_insights** — id, user_id, week_start (date, понедельник недели), headline, insights (jsonb: `[{text, highlight}]`), question, created_at; UNIQUE (user_id, week_start) — повторная генерация перезаписывает

Категории/эмоции/триггеры и amount > 0 дополнительно защищены CHECK-констрейнтами.

## API

| Метод  | Путь                   | Auth | Описание                                        |
|--------|------------------------|------|-------------------------------------------------|
| POST   | /api/auth/register     | —    | Регистрация → access + refresh токены            |
| POST   | /api/auth/login        | —    | Логин → access + refresh токены                  |
| POST   | /api/auth/refresh      | —    | Обмен refresh-токена на новую пару (ротация)     |
| POST   | /api/auth/logout       | —    | Отзыв refresh-токена                             |
| POST   | /api/transactions      | JWT  | Создать трату + вызов Gemini                     |
| GET    | /api/transactions      | JWT  | Список трат, `?limit` (≤200, дефолт 100) `&offset` |
| DELETE | /api/transactions/:id  | JWT  | Soft delete траты                                |
| POST   | /api/checkins          | JWT  | Сохранить check-in                               |
| GET    | /api/checkins          | JWT  | Список check-ins, `?limit&offset`                |
| POST   | /api/insights/weekly   | JWT  | Сгенерировать недельный инсайт (422 `not_enough_data` если < 3 дней с данными, 502 `ai_unavailable` при сбое Gemini) |
| GET    | /api/insights/weekly   | JWT  | Последние 4 недельных инсайта                    |
| GET    | /health                | —    | Статус БД и Gemini для мониторинга               |

Auth header: `Authorization: Bearer <token>`

## Gemini

- Файл: `services/gemini.service.js`
- Функция `analyzeTransaction({ amount, category, emotional_state, triggered_by, note, history, checkin })`
- `history` — последние 5 трат пользователя, `checkin` — последний чек-ин за 7 дней (если есть), чтобы коуч видел паттерн
- Функция `generateWeeklyInsights({ transactions, checkins, aggregates })` — JSON-инсайты недели (responseMimeType `application/json`, безопасный парсинг с валидацией формы)
- System prompt: CBT/ACT коуч, тёплый тон, 2–4 предложения, без диагнозов, всегда на русском
- `thinkingConfig: { thinkingBudget: 0 }` обязателен — иначе 2.5-модели тратят лимит токенов на рассуждения и возвращают пустой текст
- Таймаут 15 с (20 с для weekly), один retry при 429/503
- Ошибка Gemini — не фатальна: транзакция сохраняется с `ai_response = null`; weekly возвращает 502

## Правила разработки

- Не добавлять фичи сверх задачи — это MVP
- Валидация входных данных только на границах (HTTP контроллеры)
- Не мокировать БД в тестах — только реальное подключение
- Не коммитить `.env` — только `.env.example`
- Комментарии только если поведение неочевидно
