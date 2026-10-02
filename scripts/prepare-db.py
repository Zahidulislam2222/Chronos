"""
Prepare Chronos database backup for new GCP host.
Replaces all old URLs with new domain.

Configuration (environment):
  CHRONOS_OLD_URLS  comma-separated URLs found in the dump, e.g.
                    "https://old-backend.example,http://localhost:8888"
  CHRONOS_NEW_URL   backend URL to write, e.g. "https://new-backend.example"
"""
import os
import re
import sys

OLD_URLS = [u.strip() for u in os.environ.get("CHRONOS_OLD_URLS", "").split(",") if u.strip()]
NEW_URL = os.environ.get("CHRONOS_NEW_URL", "").strip()
if not OLD_URLS or not NEW_URL:
    sys.exit("Set CHRONOS_OLD_URLS and CHRONOS_NEW_URL (see the docstring).")

INPUT  = "wordpress/database-backup.sql"
OUTPUT = "wordpress/database-backup-gcp.sql"

print(f"Reading {INPUT}...")
with open(INPUT, "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

total = 0
for old in OLD_URLS:
    count = content.count(old)
    if count:
        print(f"  Replacing {count}x  {old}  ->  {NEW_URL}")
        content = content.replace(old, NEW_URL)
        total += count

# Also fix serialized PHP strings — WordPress stores URLs in serialized data
# e.g. s:35:"http://old-url.com"; must become s:XX:"http://new-url.com";
# mysqldump escapes the quotes (s:35:\"...\";), and PHP lengths are UTF-8
# byte counts of the unescaped value. Only strings holding NEW_URL change.
MYSQL_ESCAPES = {"0": "\x00", "n": "\n", "r": "\r", "Z": "\x1a", "t": "\t"}


def unescape_mysql(value):
    return re.sub(r"\\(.)", lambda m: MYSQL_ESCAPES.get(m.group(1), m.group(1)), value)


def fix_serialized(text):
    def escaped(m):
        s = m.group(2)
        if NEW_URL not in s:
            return m.group(0)
        return f's:{len(unescape_mysql(s).encode("utf-8"))}:\\"{s}\\";'

    def plain(m):
        s = m.group(2)
        if NEW_URL not in s:
            return m.group(0)
        return f's:{len(s.encode("utf-8"))}:"{s}";'

    text = re.sub(r'(?<![\\\w])s:(\d+):\\"((?:[^\\]|\\.)*?)\\";', escaped, text)
    return re.sub(r'(?<![\\\w])s:(\d+):"([^"\\]*)";', plain, text)

content = fix_serialized(content)

print(f"Writing {OUTPUT}...")
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Done. {total} replacements made.")
print(f"Output: {OUTPUT}")
