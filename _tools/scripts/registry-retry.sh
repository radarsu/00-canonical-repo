#!/usr/bin/env bash
# Retries only output-confirmed registry transients: rate limits, lost blob uploads, connect/header timeouts. A real
# auth or manifest refusal, a missing tag and a build error fail immediately. Classifies the OUTPUT, not the exit
# status, since unrelated failures also exit 1. Callers must `set -o pipefail` so a failed push reaches the loop.

# Attempts and the base gap in seconds; the gap grows per attempt because a rate limit is a rolling window.
REGISTRY_RETRY_ATTEMPTS="${REGISTRY_RETRY_ATTEMPTS:-4}"
REGISTRY_RETRY_DELAY="${REGISTRY_RETRY_DELAY:-60}"

registry_retry_transient() {
    grep -Eqi \
        -e 'exceeded a secondary rate limit' \
        -e 'toomanyrequests' \
        -e '(status|code)[: ]+429' \
        -e '429 too many requests' \
        -e 'blob upload (unknown|invalid)' \
        -e 'blob_upload_(unknown|invalid)' \
        -e 'unexpected status: 50[0-9]' \
        -e '(502 bad gateway|503 service unavailable|504 gateway time)' \
        -e 'connection reset by peer' \
        -e 'unexpected eof' \
        -e '(tls handshake|i/o) timeout' \
        -e 'timeout awaiting response headers' \
        -e 'client\.timeout exceeded' \
        -e 'dial tcp.*(connection refused|connection timed out|no route to host)' \
        -e 'failed to fetch oauth token' \
        -- "$1"
}

# Runs a command, streaming its output as it goes while keeping a copy to judge a failure by.
registry_retry() {
    local attempt=1 status delay log
    log="$(mktemp)"
    while :; do
        status=0
        "$@" 2>&1 | tee "$log" || status=$?
        if [ "$status" -eq 0 ]; then
            rm -f "$log"
            return 0
        fi
        if [ "$attempt" -ge "$REGISTRY_RETRY_ATTEMPTS" ] || ! registry_retry_transient "$log"; then
            rm -f "$log"
            return "$status"
        fi
        delay=$((REGISTRY_RETRY_DELAY * attempt))
        echo "==> the registry dropped this call (attempt $attempt/$REGISTRY_RETRY_ATTEMPTS), waiting ${delay}s and trying again" >&2
        sleep "$delay"
        attempt=$((attempt + 1))
    done
}
