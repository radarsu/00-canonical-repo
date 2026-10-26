# The web image: the Vue SPA as static files behind nginx. One build serves any environment: the api origin is a
# `$API_URL` placeholder in assets/js/env.js (environment.deployment.ts) and in nginx.conf, substituted by entrypoint.sh
# at container start.
#
# dist is built OUTSIDE Docker (the `docker:release` turbo task depends on `build`). The context is this app directory,
# of which .dockerignore admits only dist, nginx.conf and entrypoint.sh.
FROM nginx:1.30.5-alpine3.24@sha256:bf3201ab56f23e5954646379c775d511fc466e9f11376d9725361064ad07ed35
# The build this image is, answered as X-Web-Build. docker-release.sh passes the content-addressed tag to a Dockerfile
# that declares this ARG.
ARG BUILD_ID=unreleased
ENV WEB_BUILD=$BUILD_ID
# Staged as a template, and not into /etc/nginx/templates/, whose automatic envsubst has no variable filter and would
# blank every $uri.
COPY nginx.conf /etc/nginx/default.conf.template
# --chmod because CMD execs it directly, whatever mode the checkout gave the file.
COPY --chmod=0755 entrypoint.sh /entrypoint.sh
COPY dist /usr/share/nginx/html
# A COPY carries the build tree's modes, and esbuild truncates env.js rather than recreating it, so a 0600 there would
# outlive every rebuild and answer 403. `a+rX` makes files readable and directories traversable, nothing executable.
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
# Naming the script rather than nginx also skips the base image's /docker-entrypoint.d/ init scripts.
CMD ["/entrypoint.sh"]
