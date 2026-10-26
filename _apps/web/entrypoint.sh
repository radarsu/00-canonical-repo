#!/bin/sh
# Container start for the web image: render the files that carry deploy-time values, then hand off to nginx. One build
# artifact serves any environment; nothing here is baked when the image is built.
#
# Every envsubst names its variables. The minified bundle and nginx.conf are full of `$…` that must survive ($uri, and
# whatever the minifier emitted), which an unrestricted envsubst would blank.
set -eu

: "${API_URL:?API_URL is required: the browser-facing origin of the api, e.g. https://api.example.com}"
# nginx drops an add_header whose value is empty, so X-Web-Build always answers something a deploy can compare.
export WEB_BUILD="${WEB_BUILD:-unreleased}"

envsubst '$API_URL $WEB_BUILD' < /etc/nginx/default.conf.template > /etc/nginx/conf.d/default.conf

HTML=/usr/share/nginx/html
# Staged through /tmp and written back with cat, so each target keeps the image's mode: a fresh file that nginx's
# unprivileged worker cannot read answers 403, and the app never gets its config.
envsubst '$API_URL' < "$HTML/assets/js/env.js" > /tmp/env.js
cat /tmp/env.js > "$HTML/assets/js/env.js"

# The same config inlined into index.html in place of the tag that loads it: that tag is a render-blocking request served
# no-store, a round trip before the page can parse another line. Read through ENVIRON, not `awk -v`, which would
# interpret backslashes in the minified script. env.js stays served for anything that still asks for it.
ENV_JS="$(cat /tmp/env.js)" awk '
    index($0, "<script src=\"/assets/js/env.js\"></script>") { print "        <script>" ENVIRON["ENV_JS"] "</script>"; next }
    { print }
' "$HTML/index.html" > /tmp/index.html
cat /tmp/index.html > "$HTML/index.html"

exec nginx -g 'daemon off;'
