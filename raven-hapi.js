"use strict";
const Boom = require("boom");
const hapi = require("hapi");
const Raven = require("raven");

function query(shouldError) {
  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldError) {
        reject(new Error("fake error"));
        return;
      }
      resolve({foo: 2});
    }, 10);
  });
}

function homeHandler(request, reply) {
  Raven.setContext({request});
  return reply(
    query(request.query.e)
      .then(record => {
        record.route = "/";
        return record;
      })
      .catch(error => {
        request.log(["error", "homeHandler"], error);
        Raven.captureMessage("PL testing: captureMessage 1");
        throw Boom.wrap(error);
      })
  );
}

async function setup({host = "0.0.0.0", port = 3000, logLevel = "debug"} = {}) {
  Raven.config(
    process.env.SENTRY_DSN,
    {sampleRate: 1}
  ).install();
  const server = new hapi.Server({
    debug: {
      log: ["info", "request", "request-error", "request-internal"],
      request: ["error", "received", "handler error"]
    }
  });
  server.connection({host, port});
  server.on("log", (event, tags) => {
    console.log("hapi1", event);
  });
  server.on("request", (request, event, tags) => {
    if (tags.received) {
      console.log("New request: " + request.path.url);
    }
  });
  server.on("request-error", (request, err) => {
    console.log(
      "Error response (500) sent for request: " +
        request.id +
        " because: " +
        err.message
    );
  });
  server.log("info", "raven-hapi server starting");
  server.route({
    path: "/",
    method: "GET",
    handler: Raven.wrap(homeHandler)
  });

  return server;
}

module.exports = {setup};
if (require.main === module) {
  setup()
    .then(server => server.start())
    .catch(error => console.error("setup/start error", error));
}
