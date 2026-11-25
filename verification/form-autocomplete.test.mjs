import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// WCAG 2.2 SC 1.3.5: fields that collect the visitor's own details declare their purpose.
test('contact form names its personal fields for autofill and assistive technology', async () => {
  const source = await readFile(new URL('../src/pages/Contact.tsx', import.meta.url), 'utf8');
  const input = source.match(/\(\["name", "email", "subject"\] as const\)\.map\([^]*?<input[^>]*\/>/);
  assert.ok(input, 'contact inputs are rendered from the name/email/subject list');
  assert.match(input[0], /autoComplete=\{field === "subject" \? "off" : field\}/, 'name -> "name", email -> "email", subject off');
});

test('sign-in and registration keep their autocomplete purposes', async () => {
  const source = await readFile(new URL('../src/components/auth/LoginModal.tsx', import.meta.url), 'utf8');
  for (const purpose of ['autoComplete="name"', 'autoComplete="username"', '"new-password"', '"current-password"']) {
    assert.ok(source.includes(purpose), `LoginModal declares ${purpose}`);
  }
});
