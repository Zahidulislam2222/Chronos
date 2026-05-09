"""
Prepare Chronos database backup for new GCP host.
Replaces all old URLs with new domain.
"""
import re
import sys

OLD_URLS = [
    "https://chronosbackend.healthcodeanalysis.com",
    "http://chronosbackend.healthcodeanalysis.com",
    "http://140.245.33.37:8090",   # old local/dev IP seen in DB
    "http://localhost:8888",
    "http://localhost:8090",
]
NEW_URL = "https://chronosbackend.healthcodeanalysis.com"

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
def fix_serialized(text):
    pattern = r's:(\d+):"([^"]*chronos[^"]*)"'
    def replacer(m):
        s = m.group(2)
        return f's:{len(s)}:"{s}"'
    return re.sub(pattern, replacer, text)

content = fix_serialized(content)

print(f"Writing {OUTPUT}...")
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Done. {total} replacements made.")
print(f"Output: {OUTPUT}")
