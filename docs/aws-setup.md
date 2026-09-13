# AWS setup

This guide creates an independent Alarms backend for a clone of Clock App. It does not reuse another deployment's AWS account, Cognito user pool, API URL, or client secret.

## Prerequisites

- An AWS account and an AWS CLI profile that can deploy CloudFormation, create Cognito resources, and use Amplify.
- Node.js 22+ and pnpm.
- A unique Cognito domain. The template derives one from the stack and account, but Cognito domains are globally unique.

## Deploy the backend

From the repository root, choose a stack name and AWS Region, then run:

```powershell
aws cloudformation deploy `
  --template-file infra/alarms.yml `
  --stack-name my-clock-alarms `
  --capabilities CAPABILITY_IAM `
  --region your-region `
  --profile your-profile
```

Read the generated outputs:

```powershell
aws cloudformation describe-stacks `
  --stack-name my-clock-alarms `
  --region your-region `
  --profile your-profile `
  --query "Stacks[0].Outputs" `
  --output table
```

The outputs include the API URL, Cognito user-pool ID, browser-client ID, Playwright-client ID, and Cognito domain. The Playwright client secret is intentionally not an output. Retrieve it only into an ignored local test environment file with `aws cognito-idp describe-user-pool-client`.

## Configure the frontend

Copy `.env.example` to `.env.local` for local development. Set the API URL, Cognito domain, browser-client ID, and Region using your stack outputs. Build-time variables beginning with `VITE_` are public configuration values, so never put a client secret, password, or token in them.

## Deploy the frontend

Create an AWS Amplify static-hosting app or use another static host. Set the same non-secret `VITE_` values in its build environment. Publish the Vite `dist` folder after `pnpm build`.

Add your final frontend URL to the Cognito browser-client callback and logout URLs, and to the API's `AllowedOrigins` CloudFormation parameter before deploying the stack. For local development, `http://localhost:5173` is already included by default.

## Authorization model

- `/openapi.json` is public so documentation can load.
- Alarm CRUD requires a Cognito JWT.
- Lambda allows only a browser user in the `clock-admin` group or the dedicated machine-to-machine Playwright client.
- Keep the Playwright client secret outside this repository.
