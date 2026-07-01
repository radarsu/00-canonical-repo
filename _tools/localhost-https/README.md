# @app_/localhost-https

Committed development TLS material so the API and the Angular dev-server both serve `https://localhost`
(cookies + Google FedCM need it). Consumed by path, not import:

- API: `API_HTTPS_KEY` / `API_HTTPS_CERT` in `.env` point at `./node_modules/@app_/localhost-https/*`.
- Web: `angular.json` `serve.options.sslCert` / `sslKey` point at the same files.

`localhost-com-ca.crt` is the local CA — trust it once in your OS/browser keychain to drop the warning.
These are throwaway dev certs; never reuse them in production (TLS is terminated by the proxy there).
