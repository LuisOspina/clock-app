# Clock App

A React, TypeScript, and Vite clock application with Stopwatch, Alarms, Timers, and World Clock modules. The Alarms module uses AWS Cognito, API Gateway, Lambda, and DynamoDB. Functional requirements are loaded from the separate [`clock-notes`](https://github.com/LuisOspina/clock-notes) repository.

## What is included

- Stopwatch with start, stop, reset, and laps.
- Shared Alarms with a 10-alarm limit, schedules, time-zone handling, default audio, and a simple email/password sign-in route at `/sign-in/`.
- Public OpenAPI documentation at the app's APIs page.
- Cognito-protected alarm CRUD routes.
- Infrastructure as CloudFormation in [`infra/alarms.yml`](infra/alarms.yml).

## Local development

Prerequisites: Node.js 22+, pnpm, AWS CLI, and an AWS account if you want to run the Alarms backend.

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Set the values in `.env.local` to your own API Gateway and Cognito configuration. Do not commit local environment files.

## Production build

```powershell
pnpm build
```

## AWS setup

Deploy your own Alarms stack and configure the frontend using the instructions in [`docs/aws-setup.md`](docs/aws-setup.md). The stack creates its own DynamoDB table, Cognito user pool, API Gateway HTTP API, Lambda function, and test API client.

## Testing

Browser and API automation are intended to live in a separate project such as `clock-testing`. Keep test credentials and the machine-client secret in that project's ignored local environment file.

## Security and repository hygiene

- Never commit `.env.local`, `.env.test.local`, client secrets, passwords, access tokens, refresh tokens, or AWS credentials.
- Use `.env.example` and `.env.test.example` only as placeholder templates.
- Cognito browser client IDs, pool IDs, API URLs, and domains are configuration values, not secrets; use your own values for each deployment.
- The public OpenAPI document describes the API. Alarm CRUD endpoints require a valid Cognito JWT.
