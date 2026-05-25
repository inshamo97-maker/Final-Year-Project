function eitherAuth(...middlewares) {
  return async function eitherAuthMiddleware(req, res, next) {
    let lastStatus = 401;
    let lastPayload = { error: "Unauthorized" };

    for (const mw of middlewares) {
      const attempt = await new Promise((resolve) => {
        const shadowRes = {
          headersSent: false,
          statusCode: 200,
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(payload) {
            this.headersSent = true;
            resolve({ ok: false, status: this.statusCode, payload });
            return this;
          },
          send(payload) {
            this.headersSent = true;
            resolve({ ok: false, status: this.statusCode, payload });
            return this;
          },
          end(payload) {
            this.headersSent = true;
            resolve({ ok: false, status: this.statusCode, payload });
            return this;
          },
          setHeader() {},
          getHeader() { return undefined; },
        };

        Promise.resolve(
          mw(req, shadowRes, (err) => {
            if (err) resolve({ ok: false, status: 401, payload: { error: err.message || "Unauthorized" } });
            else resolve({ ok: true });
          })
        ).catch((err) => {
          resolve({ ok: false, status: err.status || 401, payload: { error: err.message || "Unauthorized" } });
        });
      });

      if (attempt.ok) return next();
      lastStatus = attempt.status || lastStatus;
      lastPayload = attempt.payload || lastPayload;
    }

    return res.status(lastStatus).json(lastPayload);
  };
}

module.exports = { eitherAuth };

