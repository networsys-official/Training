# Student Roster

A React student directory with create, read, update, and delete operations. The Express API persists records to a JSON file in a Docker volume.

## Run locally

Requirements: Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Open the Vite URL shown in the terminal. The API runs on port 3000 and Vite proxies `/api` requests to it. Run `npm run lint` and `npm run build` to check the app.

## Run with Docker

Requirements: Docker Engine and the Docker Compose plugin.

```sh
docker compose up -d --build
```

Open `http://localhost:8080`. Student records are kept in the named `student_data` volume across container rebuilds. To use another host port, set `APP_PORT`, for example `APP_PORT=9000 docker compose up -d --build`.

## Automatic server deployment

The GitHub Actions workflow at `.github/workflows/deploy.yml` runs lint and build on pushes to `main`, then uploads the app and runs Docker Compose on the server. It also supports manual runs from the Actions tab.

Prepare a Linux server with Docker Engine, the Docker Compose plugin, and an SSH account that can run Docker Compose. Add these repository settings:

| Setting | Type | Value |
| --- | --- | --- |
| `SERVER_HOST` | Secret | Server hostname or IP address |
| `SERVER_USER` | Secret | SSH deployment username |
| `SERVER_SSH_KEY` | Secret | Private SSH key for that account |
| `SERVER_KNOWN_HOSTS` | Secret | Pinned host-key line for the server, from a trusted source |
| `SERVER_APP_DIR` | Variable | Absolute deployment directory, such as `/srv/student-roster` |

Create the deployment directory and grant the SSH account write access before the first run. The server listens on port 8080 by default. To change it, create a server-side `.env` file with `APP_PORT=9000`; the deployment workflow preserves that file. This starter app does not include user authentication. Restrict it to a trusted network or put an authentication and TLS proxy in front of it before exposing student records publicly. The workflow preserves records in the Docker named volume when updating the app.

## API

- `GET /api/students`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
- `GET /api/health`
