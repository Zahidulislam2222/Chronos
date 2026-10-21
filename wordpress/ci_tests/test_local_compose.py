"""Keep documented local database/admin endpoints on the developer's host."""

import re
import unittest
from ipaddress import ip_address
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class LocalComposeExposure(unittest.TestCase):
    def test_published_development_services_are_loopback_only(self):
        for filename in ("docker-compose.yml", "docker-compose.secure.yml"):
            with self.subTest(filename=filename):
                text = (ROOT / filename).read_text()
                sections = re.findall(r"(?m)^    ports:\n((?:      - .*\n)+)", text)
                self.assertEqual(len(sections), 3)
                for section in sections:
                    for line in section.splitlines():
                        mapping = line.strip().removeprefix("- ").strip("\"'")
                        parts = mapping.split(":")
                        self.assertEqual(len(parts), 3, "Published port requires a host address")
                        self.assertTrue(ip_address(parts[0]).is_loopback)


if __name__ == "__main__":
    unittest.main()
