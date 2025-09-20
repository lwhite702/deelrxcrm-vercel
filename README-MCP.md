# MCP Playwright Server

This repo includes a simple Model Context Protocol (MCP) server that exposes Playwright-driven browser automation over SSE.

## Install

- Install dependencies: `npm install`
- Install browsers (Ubuntu devcontainers included): `npx playwright install --with-deps`

## Run

- Start the server: `npm run mcp:playwright`
- Default listen address: `http://localhost:3334`

## Client configuration

Most MCP clients accept a JSON config. Add this entry:

{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:3334/sse"
    }
  }
}

If your client supports streamable HTTP, you can use `http://localhost:3334/mcp` instead of `/sse`.

### Hosted MCP: Context7

If you use the hosted Context7 MCP server, include it like this (replace `YOUR_API_KEY` or load from env):

{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}

Quickstart:
- Copy `.env.example` to `.env` and set `CONTEXT7_API_KEY`.
- Use `mcp.config.sample.json` as a template and keep secrets out of VCS.

## Notes

- The server is powered by the `mcp-playwright` package (forked Playwright MCP server) and runs independently of the app.
- You can change the port by editing the npm script in `package.json`:
  `"mcp:playwright": "mcp-server-playwright --port 3334"`.

---

## Hosted MCP: GitHub (Copilot MCP)

You can connect to the GitHub-hosted MCP endpoint with a PAT. Use either prompt-injected input or environment variables.

Prompt-injected example (many MCP clients support this):

{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${input:github_mcp_pat}"
      }
    }
  },
  "inputs": [
    {
      "type": "promptString",
      "id": "github_mcp_pat",
      "description": "GitHub Personal Access Token",
      "password": true
    }
  ]
}

Env-based example (prefer for non-interactive contexts):

{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${env:GITHUB_MCP_PAT}"
      }
    }
  }
}

Scopes: At minimum, grant read scopes you need (e.g., `repo:read`). Avoid over-scoping. Store tokens in your secret manager when possible.

---

## Local MCP: Codacy

You can run Codacy’s MCP via `npx` without installing it globally. Configure it as a command-based server and pass your account token via env.

Example config:

{
  "mcp": {
    "inputs": [],
    "servers": {
      "codacy": {
        "command": "npx",
        "args": ["-y", "@codacy/codacy-mcp"],
        "env": {
          "CODACY_ACCOUNT_TOKEN": "${env:CODACY_ACCOUNT_TOKEN}"
        }
      }
    }
  }
}

Setup:
- Add `CODACY_ACCOUNT_TOKEN` to your environment (see `.env.example`).
- Some clients require specifying a working directory; if needed, add `cwd`.
