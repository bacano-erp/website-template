#!/usr/bin/env node
/**
 * The Bacano gateway, as far as a test build is concerned.
 *
 * Answers the operations a static build makes, from fixtures recorded against
 * the real gateway and then stripped of anything belonging to a real store.
 * Recorded rather than handwritten so the shapes cannot drift into a fiction
 * the tests happily pass against.
 *
 * Runs as its own process: the build spawns workers that connect back to this
 * port, and keeping it out of the orchestrating process keeps that plain.
 */
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";

const PORT = Number(process.env.MOCK_API_PORT ?? 4191);

/**
 * Which catalogue to answer with. The empty one is not an edge case: it is what
 * every store looks like on the day it is provisioned, and the state that has
 * broken this template before.
 */
const FIXTURES = process.env.MOCK_API_FIXTURES ?? "tests/fixtures/api.json";
const fixtures = JSON.parse(readFileSync(resolve(FIXTURES), "utf8"));

const server = createServer(async (req, res) => {
  // Names the catalogue this process is serving. The harness runs two phases on
  // one port, and checks this before building: reachable is not the same as
  // "the server I just started", and a stale one answering would build the
  // wrong catalogue without failing anything.
  res.setHeader("x-mock-fixtures", FIXTURES);

  let body = "";
  for await (const chunk of req) body += chunk;

  let operation = null;
  try {
    operation = /(?:query|mutation)\s+(\w+)/.exec(
      JSON.parse(body).query ?? "",
    )?.[1];
  } catch {
    // Not a GraphQL request. Handled as a miss below.
  }

  const fixture = operation ? fixtures[operation] : null;

  if (!fixture) {
    // Loud on purpose: a build that starts asking for something new should
    // fail the run rather than quietly render an empty store.
    console.error(`[mock-api] no fixture for: ${operation ?? req.url}`);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(
      JSON.stringify({ errors: [{ message: `no fixture: ${operation}` }] }),
    );
    return;
  }

  if (process.env.MOCK_API_DEBUG) console.error(`[mock-api] ${operation}`);
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(fixture));
});

// Losing the port means a previous phase's server is still up, and building
// against it would use the wrong catalogue. Fail rather than let that happen.
server.on("error", (error) => {
  console.error(`[mock-api] cannot listen on ${PORT}: ${error.code}`);
  process.exit(1);
});

server.listen(PORT, () => console.error(`[mock-api] serving ${FIXTURES}`));
