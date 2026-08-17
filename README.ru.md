# <img src="./assets/a1-logo.svg" alt="A1" width="40"> Google Business Profile MCP

[English](./README.md) | **Русский**

[![npm](https://img.shields.io/npm/v/mcp-google-business)](https://www.npmjs.com/package/mcp-google-business)
[![CI](https://github.com/A1-x-Tech/mcp-google-business/actions/workflows/ci.yml/badge.svg)](https://github.com/A1-x-Tech/mcp-google-business/actions/workflows/ci.yml)
[![Glama](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-business/badges/score.svg)](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-business)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**A1 Google Business Profile MCP** позволяет AI-приложению работать с вашими локациями Google Business Profile на естественном языке. Проверяйте локации и показатели, отвечайте на отзывы, готовьте локальные публикации и осознанно обновляйте информацию о профиле.

Сервер подключается к актуальным API Google Business Profile и legacy API, в котором всё ещё находятся отзывы и публикации. Одного Google-аккаунта и OAuth-данных недостаточно: Google должен одобрить Basic API Access для проекта Cloud.

- **20 инструментов.** Локации и аккаунты, показатели, отзывы, локальные публикации, категории и атрибуты.
- **Реальный барьер одобрения.** Проекты начинают с 0 QPM; каждый вызов API будет ошибкой, пока Google не одобрит заявку Basic API Access.
- **Отдельная граница публикации.** Подготовленный ответ, пост или изменение локации меняет публичную информацию только после подтверждения операции записи в клиенте.
- **Четыре поверхности API.** Account Management, Business Information, Performance и legacy v4 работают через один OAuth scope `business.manage`.

Начните с запроса, который только читает данные:

> Покажи мои локации и самые новые отзывы без ответа.

[Подключить сервер](#быстрый-старт) · [Посмотреть сценарии](#что-можно-поручить) · [Открыть техническую документацию](#техническая-документация)

---

## Увидеть работу за минуту

> **Вы:** Покажи мои локации и самые новые отзывы без ответа.
>
> **Ассистент:** Показывает локации и свежие отзывы. Ничего не меняется.
>
> **Вы:** Подготовь ответ на последний отзыв с тремя звёздами для локации в центре. Извинись и предложи помочь.
>
> **Ассистент:** Показывает локацию, отзыв и предлагаемый ответ, затем запрашивает подтверждение перед публикацией.
>
> **Вы:** Подтверждаю.
>
> **Ассистент:** Публикует ответ. Другие отзывы, локации и посты не изменяются.

## Содержание

- [Быстрый старт](#быстрый-старт)
- [Что можно поручить](#что-можно-поручить)
- [Что может измениться](#что-может-измениться)
- [Как получить доступ](#как-получить-доступ)
- [Конфигурация](#конфигурация)
- [Данные, лимиты и работа в фоне](#данные-лимиты-и-работа-в-фоне)
- [Техническая документация](#техническая-документация)
- [Поддержка](#поддержка)

## Быстрый старт

Нужны Node.js 20+, подтверждённый Google Business Profile, OAuth-клиент Google Cloud и одобренная заявка Basic API Access.

1. [Получите одобренный доступ](#как-получить-доступ).
2. Добавьте сервер в AI-приложение.
3. Начните с запроса, который только читает данные.

<details open><summary><strong>Codex</strong></summary>

<br>

В **Settings → Plugins → MCP servers** выберите **Add server**, затем добавьте `npx -y mcp-google-business@latest` с `GOOGLE_BUSINESS_CLIENT_ID`, `GOOGLE_BUSINESS_CLIENT_SECRET` и `GOOGLE_BUSINESS_REFRESH_TOKEN`.

```bash
codex mcp add google-business \
  --env GOOGLE_BUSINESS_CLIENT_ID=your_client_id \
  --env GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret \
  --env GOOGLE_BUSINESS_REFRESH_TOKEN=your_refresh_token \
  -- npx -y mcp-google-business@latest
codex mcp list
```

[Документация Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)

</details>

<details><summary><strong>Claude Code</strong></summary>

<br>

```bash
claude mcp add \
  --env GOOGLE_BUSINESS_CLIENT_ID=your_client_id \
  --env GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret \
  --env GOOGLE_BUSINESS_REFRESH_TOKEN=your_refresh_token \
  --transport stdio --scope user google-business \
  -- npx -y mcp-google-business@latest
claude mcp list
```

[Документация Claude Code MCP](https://code.claude.com/docs/en/mcp)

</details>

<details><summary><strong>Claude Desktop</strong></summary>

<br>

Откройте **Settings → Developer → Edit Config** и добавьте:

```json
{"mcpServers":{"google-business":{"command":"npx","args":["-y","mcp-google-business@latest"],"env":{"GOOGLE_BUSINESS_CLIENT_ID":"your_client_id","GOOGLE_BUSINESS_CLIENT_SECRET":"your_client_secret","GOOGLE_BUSINESS_REFRESH_TOKEN":"your_refresh_token"}}}}
```

Если **Edit Config** недоступна, отредактируйте `~/Library/Application Support/Claude/claude_desktop_config.json` на macOS или `%APPDATA%\Claude\claude_desktop_config.json` на Windows. [Документация Claude Desktop MCP](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

</details>

<details><summary><strong>Cursor</strong></summary>

<br>

Добавьте `{"mcpServers":{"google-business":{"type":"stdio","command":"npx","args":["-y","mcp-google-business@latest"],"env":{"GOOGLE_BUSINESS_CLIENT_ID":"your_client_id","GOOGLE_BUSINESS_CLIENT_SECRET":"your_client_secret","GOOGLE_BUSINESS_REFRESH_TOKEN":"your_refresh_token"}}}}` в `~/.cursor/mcp.json` на macOS/Linux или `%USERPROFILE%\.cursor\mcp.json` на Windows. [Документация Cursor MCP](https://cursor.com/docs/mcp)

</details>

<details><summary><strong>VS Code</strong></summary>

<br>

Запустите **MCP: Open User Configuration** и добавьте:

```json
{"servers":{"google-business":{"type":"stdio","command":"npx","args":["-y","mcp-google-business@latest"],"env":{"GOOGLE_BUSINESS_CLIENT_ID":"${input:gbp_client_id}","GOOGLE_BUSINESS_CLIENT_SECRET":"${input:gbp_client_secret}","GOOGLE_BUSINESS_REFRESH_TOKEN":"${input:gbp_refresh_token}"}}},"inputs":[{"type":"promptString","id":"gbp_client_id","description":"Google OAuth client ID"},{"type":"promptString","id":"gbp_client_secret","description":"Google OAuth client secret","password":true},{"type":"promptString","id":"gbp_refresh_token","description":"Google OAuth refresh token","password":true}]}
```

Проверьте сервер командой **MCP: List Servers**. [Документация VS Code MCP](https://code.visualstudio.com/docs/agent-customization/mcp-servers)

</details>

## Что можно поручить

- Покажи локации, категории, атрибуты и текущую информацию профиля.
- Покажи звонки, запросы маршрута и search keyword impressions за выбранный период.
- Найди свежие отзывы, подготовь ответ и опубликуй его после подтверждения.
- Подготовь, обнови или удали локальную публикацию.
- Обнови выбранное поле локации или атрибут, сначала показав точное изменение.

## Что может измениться

| Операция | Что происходит | Граница подтверждения |
|---|---|---|
| Аккаунты, локации, категории, атрибуты, показатели, отзывы и посты | Читает существующие данные профиля | Ничего не меняет |
| Обновление локации или её атрибутов | Меняет публичные данные Business Profile | Меняет локацию |
| Ответ на отзыв | Публикует публичный ответ владельца | Меняет публичный контент |
| Создание или обновление локального поста | Публикует или меняет локальный контент | Меняет публичный контент |
| Удаление ответа или локального поста | Удаляет публичный контент | Разрушительно |
| Технический запрос API | Может вызвать endpoint записи или удаления | Потенциально разрушительно |

Как AI-приложение запрашивает подтверждение, определяет само приложение; сервер помечает инструменты так, чтобы оно отличило проверку от рабочего изменения.

## Как получить доступ

Google требует **и OAuth, и одобрение Basic API Access**.

1. Используйте подтверждённый и активный не менее 60 дней Business Profile; подавайте заявку от владельца или менеджера и укажите сайт бизнеса, который совпадает с заявкой.
2. Создайте проект Google Cloud, включите My Business Account Management API, Business Information API, Business Profile Performance API и Google My Business API (legacy v4).
3. Отправьте [форму GBP API](https://support.google.com/business/contact/api_default) как **Application for Basic API Access**. До одобрения квота 0 QPM; после одобрения — 300 QPM для каждого API.
4. Создайте OAuth-клиент, получите refresh token для `https://www.googleapis.com/auth/business.manage` и задайте три переменные `GOOGLE_BUSINESS_*`.

Храните client secret и refresh token как пароли. Access token — короткоживущая альтернатива для разового запуска.

## Конфигурация

| Переменная | Обязательна | Описание |
|---|---|---|
| `GOOGLE_BUSINESS_CLIENT_ID` | Да* | OAuth client ID. |
| `GOOGLE_BUSINESS_CLIENT_SECRET` | Да* | OAuth client secret. |
| `GOOGLE_BUSINESS_REFRESH_TOKEN` | Да* | OAuth refresh token с `business.manage`. |
| `GOOGLE_BUSINESS_ACCESS_TOKEN` | Да* | Короткоживущая альтернатива OAuth-тройке. |
| `GOOGLE_BUSINESS_TIMEOUT_MS` | Нет | Тайм-аут запроса; по умолчанию `60000` мс. |
| `GOOGLE_BUSINESS_MAX_RETRIES` | Нет | Повторы временных ошибок; по умолчанию `3`. |

\* Передайте OAuth-тройку или access token. Переопределения хостов API описаны в [справочнике инструментов](./docs/TOOLS.md).

## Данные, лимиты и работа в фоне

- **Google получает запросы профиля.** Анонимная телеметрия содержит данные установки и версий, а также имена инструментов, но не OAuth-секреты, данные профиля, аргументы или промпты. Чтобы отключить её, задайте `ASKADS_TELEMETRY=0`.
- **Реальные лимиты редактирования.** Одобренные проекты получают 300 QPM для каждого API; Google также ограничивает одну локацию Business Profile 10 изменениями в минуту. Показатели могут отставать на несколько дней, а ответы на отзывы работают только для подтверждённых локаций.
- **Постоянного наблюдения нет.** Сервер работает только при вызове. Если AI-приложение поддерживает задания по расписанию, оно может периодически проверять новые отзывы или показатели.

## Техническая документация

- [Все инструменты и параметры](./docs/TOOLS.md)
- [Документация по разработке](./docs/DEVELOPMENT.md)
- [Документация по публикации](./docs/PUBLISHING.md)
- [Документация Google Business Profile API](https://developers.google.com/my-business)

## Поддержка

Нашли ошибку или не хватает сценария? [Создайте issue](https://github.com/A1-x-Tech/mcp-google-business/issues) или напишите в [Telegram](https://t.me/a1_mcp).

<br>

<p align="center">
  <img src="https://github.com/ztemerbekov/a1-yandex-kit-skills/raw/main/assets/images/mona-hifive-yandex-kit-warm.gif" alt="Две Моны дают пять" width="256">
</p>

<p align="center">
  Вы дочитали до конца!
</p>
