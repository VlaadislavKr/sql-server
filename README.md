# sql MCP Server

MCP for making queries to MySQL, PostgreSQL and SQLite databases.

This is a TypeScript-based MCP server that provides tools for interacting with SQL databases.

## Features

### Tools
- `execute_sql_query` - Execute SQL queries on a specified database.
  - Parameters:
    - `dbType`: Type of the database (mysql, postgresql or sqlite).
    - `connectionString`: Connection string for the database (file path for sqlite).
    - `query`: SQL query to execute.
- `insert_data` - Insert data into a specified table.
  - Parameters:
    - `dbType`: Type of the database (mysql, postgresql or sqlite).
    - `connectionString`: Connection string for the database (file path for sqlite).
    - `tableName`: Name of the table to insert into.
    - `data`: JSON object representing the data to insert (key-value pairs).

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use this MCP server with your editor, you will generally need to configure it to recognize the server. The core principle involves providing the editor with the command to run the compiled server, typically located at `build/index.js`.

### Configuration Examples:

**Claude Desktop:**

-   **MacOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
-   **Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sql": {
      "command": "/path/to/sql/build/index.js"
    }
  }
}
```

**Other MCP-compatible editors:**

The exact configuration method may vary, but here are some common locations for configuration files:

-   **Roo Code:** `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\mcp_settings.json`
-   **Cursor:** `%HOMEPATH%\.cursor` (look for a relevant configuration file within this directory, e.g., `mcp_settings.json` or similar)

Consult your editor's official documentation for detailed instructions on adding custom MCP servers.

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
