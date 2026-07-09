# Coftech Endpoint

Coftech Endpoint is the backend API for the Coftech Bot platform, built with Node.js, Express, GraphQL, MySQL, RabbitMQ, and AWS integrations.

It provides REST and GraphQL endpoints for authentication, account management, bot management, WhatsApp/social messaging, payments, storage, prompts, integrations, webhooks, background jobs, and related services.

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- MySQL v8.0 or higher
- RabbitMQ
- AWS credentials for features that use S3, SQS, SNS, Lambda, EventBridge, or Lightsail
- Provider credentials for enabled integrations such as Discord, WhatsApp/social providers, payment providers, NocoDB, BotMaker, Yappy, or NMI

## Environment

Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

For local development, start with local service values where possible:

```env
ENVIRONMENT=development
PORT=3003
LOCAL_DB_HOSTNAME=localhost
LOCAL_DB_USERNAME=root
LOCAL_DB_PASSWORD=password
LOCAL_DB_DATABASE=endpoint
LOCAL_DB_PORT=3306
RABBITMQ_HOST=localhost:5672
RABBITMQ_VIRTUAL_HOST=/
```

Update the remaining variables in `.env` with your own local credentials, webhook URLs, provider tokens, and infrastructure values as needed.

## Running Locally

Install dependencies:

```bash
npm install
```

Run database migrations:

```bash
npm run migrate
```

Start the server:

```bash
npm start
```

For local development with nodemon:

```bash
npm run dev
```

Open:

```text
http://localhost:3003
```

Swagger is available in non-production environments at:

```text
http://localhost:3003/api-docs
```

GraphQL is available at:

```text
http://localhost:3003/graphql
```

## Scripts

```bash
npm start
npm run dev
npm run migrate
npm run lint
npm test
```

## License

This repository is provided under an all-rights-reserved license.

See `LICENSE` for details.

## Note

The official Coftech backend servers are currently down. Hosted URLs, webhook endpoints, queues, buckets, and callback values in example configuration files are placeholders until Coftech-managed infrastructure is restored.
