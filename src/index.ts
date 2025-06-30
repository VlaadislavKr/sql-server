#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Client as PGClient } from 'pg';
import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';

const server = new McpServer({
  name: "sql-server",
  version: "0.1.0"
});

// Helper function to get SQLite database instance
function getSqliteDb(connectionString: string): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(connectionString, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

// Tool for executing SQL queries
server.tool(
  "execute_sql_query",
  {
    dbType: z.enum(["mysql", "postgresql", "sqlite"]).describe("Type of the database (mysql, postgresql or sqlite)"),
    connectionString: z.string().describe("Connection string for the database (file path for sqlite)"),
    query: z.string().describe("SQL query to execute"),
  },
  async ({ dbType, connectionString, query }: { dbType: "mysql" | "postgresql" | "sqlite", connectionString: string, query: string }) => {
    try {
      let result;
      if (dbType === "postgresql") {
        const client = new PGClient({ connectionString });
        await client.connect();
        result = await client.query(query);
        await client.end();
        return {
          content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
        };
      } else if (dbType === "mysql") {
        const connection = await mysql.createConnection(connectionString);
        [result] = await connection.execute(query);
        await connection.end();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } else if (dbType === "sqlite") {
        const db = await getSqliteDb(connectionString);
        return new Promise((resolve, reject) => {
          db.all(query, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
              });
            }
            db.close();
          });
        });
      } else {
        return {
          content: [{ type: "text", text: "Unsupported database type." }],
          isError: true,
        };
      }
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Database error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool for inserting data into a table
server.tool(
  "insert_data",
  {
    dbType: z.enum(["mysql", "postgresql", "sqlite"]).describe("Type of the database (mysql, postgresql or sqlite)"),
    connectionString: z.string().describe("Connection string for the database (file path for sqlite)"),
    tableName: z.string().describe("Name of the table to insert into"),
    data: z.record(z.any()).describe("JSON object representing the data to insert (key-value pairs)"),
  },
  async ({ dbType, connectionString, tableName, data }: { dbType: "mysql" | "postgresql" | "sqlite", connectionString: string, tableName: string, data: Record<string, any> }) => {
    try {
      const columns = Object.keys(data).join(", ");
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", "); // For PostgreSQL
      const mysqlPlaceholders = values.map(() => "?").join(", "); // For MySQL
      const sqlitePlaceholders = values.map(() => "?").join(", "); // For SQLite

      let query: string;
      let result;

      if (dbType === "postgresql") {
        query = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`;
        const client = new PGClient({ connectionString });
        await client.connect();
        result = await client.query(query, values);
        await client.end();
        return {
          content: [{ type: "text", text: `Inserted ID: ${result.rows[0].id}` }],
        };
      } else if (dbType === "mysql") {
        query = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${mysqlPlaceholders})`;
        const connection = await mysql.createConnection(connectionString);
        [result] = await connection.execute(query, values);
        await connection.end();
        return {
          content: [{ type: "text", text: `Inserted ID: ${(result as any).insertId}` }],
        };
      } else if (dbType === "sqlite") {
        const db = await getSqliteDb(connectionString);
        query = `INSERT INTO ${tableName} (${columns}) VALUES (${sqlitePlaceholders})`;
        return new Promise((resolve, reject) => {
          db.run(query, values, function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                content: [{ type: "text", text: `Inserted ID: ${this.lastID}` }],
              });
            }
            db.close();
          });
        });
      } else {
        return {
          content: [{ type: "text", text: "Unsupported database type." }],
          isError: true,
        };
      }
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Database error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('SQL MCP server running on stdio');
