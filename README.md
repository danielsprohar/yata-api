# Yet Another To-Do App (YATA)

Yet another to-do app created with JavaScript, specifically [NestJS](https://nestjs.com/).

## Getting Started

Create a `.env` file at the root of the project. The file should contain:

```Properties
DATABASE_URL="postgresql://postgres:<your_password>@localhost:5434/yata?schema=public"

JWT_SECRET=<secret>
JWT_TOKEN_AUDIENCE=localhost:4200
JWT_TOKEN_ISSUER=localhost:3000
JWT_ACCESS_TOKEN_TTL=<ttl_in_seconds>
JWT_REFRESH_TOKEN_TTL=<ttl_in_seconds>

PORT=3000

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<password>
REDIS_USER=default

# These are required if you plan to use Auth0
ISSUER_BASE_URL=<add_your_auth0_domain_here>
AUDIENCE=<add_your_auth0_api_url_here>
CLIENT_ORIGIN_URL=http://localhost:4200

# Required for Google login
GOOGLE_CLIENT_ID=<client_id>
GOOGLE_CLIENT_SECRET=<client_secret>

```

### Using Docker

If Docker is your preference, then ensure that Docker is running on your machine.
Open a terminal at the root of the project and run the following to create the Postgres database:

```
docker compose up redis db --detach
```

### Without Docker

Install the following:

- [Node.js](https://nodejs.org/en/)
- [Docker](https://www.docker.com/)
- [Redis](https://redis.io/docs/getting-started/installation/)

Create and seed the database.

```
npm run db:init
```

## Run the Application

Once the installation process is complete you can start the server:

```shell
npm run start
```

Navigate to http://localhost:3000/swagger to see the Swagger document.
