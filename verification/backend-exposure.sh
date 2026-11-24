#!/usr/bin/env bash
# Account-exposure and health checks against a real WordPress backend (criteria B1-B3).
#
#   CHRONOS_KNOWN_LOGIN=<an existing login> bash verification/backend-exposure.sh <base-url>
#
# Optional signed-in checks: CHRONOS_EDITOR_AUTH / CHRONOS_CUSTOMER_AUTH as
# "login:application-password" for a disposable editor and customer (test sites only).
# Every check is read-only except failed sign-in and lost-password attempts for
# accounts that do not exist. No values are printed.
B="${1:?Pass the backend base URL}"; K="${CHRONOS_KNOWN_LOGIN:?Set CHRONOS_KNOWN_LOGIN}"; pass=0; fail=0
skip() { echo "SKIP $1"; }
# A fresh random value each run, so failed sign-ins never use a real or reused password.
WRONG=$(od -An -N12 -tx1 /dev/urandom | tr -d ' \n')
login_error() { curl -s -m 60 --data-urlencode "log=$1" --data-urlencode "pwd=$WRONG" -d 'wp-submit=Log+In' "$B/wp-login.php" | grep -o 'id="login_error"[^<]*<[^<]*<[^<]*' | sed 's/<[^>]*>//g' | head -c 200; }
rest_as() { curl -s -m 60 --user "$1:$WRONG" "$B/wp-json/wp/v2/posts"; }
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "PASS $1"; else fail=$((fail+1)); echo "FAIL $1 (got '$2', want '$3')"; fi; }
gql() { curl -s -m 60 -H 'content-type: application/json' -d "$1" "$B/graphql"; }
code() { curl -s -m 60 -o /dev/null -w '%{http_code}' "$@"; }

check "REST users list refused"        "$(code "$B/wp-json/wp/v2/users")" 401
check "REST user by id refused"        "$(code "$B/wp-json/wp/v2/users/1")" 401
check "REST users me needs sign-in"    "$(code "$B/wp-json/wp/v2/users/me")" 401
check "REST posts still public"        "$(code "$B/wp-json/wp/v2/posts")" 200
check "?author=1 is 404, no redirect"  "$(code "$B/?author=1")" 404
check "author archive is 404"          "$(code "$B/author/$K/")" 404
check "users sitemap absent"           "$(curl -s -m 60 "$B/wp-sitemap.xml" | grep -c 'sitemap-users')" 0
H=$(curl -s -m 60 -i "$B/wp-json/chronos/v1/health")
check "health 200"                     "$(printf '%s' "$H" | head -1 | grep -o ' 200 ' | tr -d ' ')" 200
check "health no-store"                "$(printf '%s' "$H" | grep -ic '^cache-control: no-store')" 1
check "health body"                    "$(printf '%s' "$H" | tail -1)" '{"status":"ok","checks":{"database":true,"commerce":true,"graphql":true}}'
BK=$(curl -s -m 60 "$B/wp-json/chronos/v1/health/backup")
check "backup probe answers off or ok" "$(printf '%s' "$BK" | grep -cE '^\{"status":"(off|ok)"\}$')" 1
check "REST mixed-case users refused"  "$(code "$B/wp-json/WP/V2/USERS")" 401
check "REST ?rest_route mixed case"    "$(code "$B/?rest_route=/wp/v2/Users/1")" 401
check "REST trailing slash refused"    "$(code "$B/wp-json/wp/v2/users/")" 401
check "REST usersettings-like ok"      "$(code "$B/wp-json/wp/v2/types")" 200
if [ -n "${CHRONOS_EDITOR_AUTH:-}" ]; then
  check "editor keeps author picker"   "$(code -u "$CHRONOS_EDITOR_AUTH" "$B/wp-json/wp/v2/users?who=authors")" 200
else skip "editor keeps author picker (CHRONOS_EDITOR_AUTH unset)"; fi
if [ -n "${CHRONOS_CUSTOMER_AUTH:-}" ]; then
  check "customer cannot list users"   "$(code -u "$CHRONOS_CUSTOMER_AUTH" "$B/wp-json/wp/v2/users")" 403
  check "customer keeps users/me"      "$(code -u "$CHRONOS_CUSTOMER_AUTH" "$B/wp-json/wp/v2/users/me")" 200
else skip "customer checks (CHRONOS_CUSTOMER_AUTH unset)"; fi
L1=$(login_error "$K")
L2=$(login_error 'nobody-here-xyz')
L3=$(login_error 'nobody@example.invalid')
check "login error same: user vs none" "$L1" "$L2"
check "login error same: email"        "$L1" "$L3"
check "login error is the uniform one" "$(printf '%s' "$L1" | grep -c 'username or password is incorrect')" 1
U=$(gql '{"query":"{ users { nodes { name slug databaseId } } }"}')
check "gql no debug/analyzer extension" "$(printf '%s' "$U" | grep -c '"debug"\|queryAnalyzer')" 0
check "gql user slug hidden"           "$(printf '%s' "$U" | grep -c "\"slug\":\"$K\"")" 0
check "gql user databaseId hidden"     "$(printf '%s' "$U" | grep -c '"databaseId":1')" 0
P=$(gql '{"query":"{ posts(first:5) { nodes { title author { node { name avatar { url } } } } } }"}')
check "gql post byline name kept"      "$(printf '%s' "$P" | grep -c '"name":"[^"]')" 1
check "gql avatar hidden"              "$(printf '%s' "$P" | grep -c 'gravatar')" 0
I=$(gql '{"query":"{ __schema { queryType { name } } }"}')
S1=$(gql "{\"query\":\"{ user(id:\\\"$K\\\", idType:SLUG) { name } }\"}")
check "gql user by SLUG is null"       "$(printf '%s' "$S1" | grep -c '"user":null')" 1
S2=$(gql '{"query":"{ user(id:\"nobody-xyz\", idType:SLUG) { name } }"}')
check "gql SLUG lookup no oracle"      "$S1" "$S2"
A1=$(gql "{\"query\":\"{ posts(where:{authorName:\\\"$K\\\"}) { nodes { title } } }\"}")
A2=$(gql '{"query":"{ posts(where:{authorName:\"nobody-xyz\"}) { nodes { title } } }"}')
check "gql authorName no oracle"       "$A1" "$A2"
check "gql authorName no error"        "$(printf '%s' "$A1" | grep -c '"errors"')" 0
check "gql introspection refused"      "$(printf '%s' "$I" | grep -c '"queryType":{"name"')" 0
D=$(gql '{"query":"{ posts { nodes { categories { nodes { posts { nodes { categories { nodes { posts { nodes { categories { nodes { posts { nodes { title } } } } } } } } } } } } } } }"}')
check "gql depth limit enforced"       "$(printf '%s' "$D" | grep -ci 'depth')" 1
R1=$(rest_as "$K")
R2=$(rest_as 'nobody-xyz')
R3=$(rest_as 'nobody@example.invalid')
check "REST app-password no oracle"    "$R1" "$R2"
check "REST app-password email same"   "$R1" "$R3"
check "REST app-password uniform"      "$(printf '%s' "$R1" | grep -c '"code":"invalid_credentials"')" 1
LP=$(curl -s -m 60 -o /dev/null -w '%{http_code} %{redirect_url}' -d 'user_login=nobody-xyz&redirect_to=&wp-submit=Get+New+Password' "$B/wp-login.php?action=lostpassword")
check "lost password unknown = sent"   "$LP" "302 $B/wp-login.php?checkemail=confirm"
LE=$(curl -s -m 60 -o /dev/null -w '%{http_code} %{redirect_url}' -d 'user_login=nobody@example.invalid&redirect_to=&wp-submit=Get+New+Password' "$B/wp-login.php?action=lostpassword")
check "lost password unknown email"    "$LE" "302 $B/wp-login.php?checkemail=confirm"
LB=$(curl -s -m 60 -d 'user_login=&redirect_to=&wp-submit=Get+New+Password' "$B/wp-login.php?action=lostpassword" | grep -c 'login_error')
check "lost password empty keeps error" "$LB" 1
CA=$(gql '{"query":"{ posts(first:10) { nodes { comments(first:20) { nodes { author { node { name avatar { url } } } } } } } }"}')
check "gql guest comment avatar hidden" "$(printf '%s' "$CA" | grep -c 'gravatar')" 0
check "gql comments query no error"    "$(printf '%s' "$CA" | grep -c '"errors"')" 0
echo "RESULT pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
