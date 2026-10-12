'use strict';

const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

assert.ok(process.argv[2], 'Pass the package directory to verify');
const packageRequire = createRequire(path.resolve(process.argv[2], 'package.json'));
const matcherRequire = createRequire(packageRequire.resolve('micromatch'));
const braces = matcherRequire('braces');
const micromatch = packageRequire('micromatch');
const manifest = packageRequire('./package.json');
const lock = packageRequire('./package-lock.json');

test('every locked brace consumer installs the inspected replacement', () => {
  const replacements = Object.entries(lock.packages).filter(([name]) => name.endsWith('/braces'));
  assert.ok(replacements.length > 0);
  for (const [name, entry] of replacements) {
    assert.equal(`npm:${entry.name}@${entry.version}`, manifest.overrides.braces);
    const installed = packageRequire(path.resolve(process.argv[2], name));
    assert.throws(() => installed.parse('{'.repeat(101) + 'x' + '}'.repeat(101)), /exceeds max depth/);
  }
  assert.equal(Object.keys(lock.packages).some(name => name.endsWith('/sprintf-js')), false);
});

test('ordinary brace expansion and glob matching remain compatible', () => {
  assert.deepEqual(braces.expand('src/{pages,components}/*.{js,tsx}'), [
    'src/pages/*.js', 'src/pages/*.tsx',
    'src/components/*.js', 'src/components/*.tsx',
  ]);
  assert.deepEqual(braces.expand('item{01..03}'), ['item01', 'item02', 'item03']);
  assert.deepEqual(micromatch(['src/a.js', 'src/b.tsx', 'src/c.css'], '**/*.{js,tsx}'), [
    'src/a.js', 'src/b.tsx',
  ]);
  assert.deepEqual(braces.expand('a{b,{c,d}}e'), ['abe', 'ace', 'ade']);
});

test('deep brace and parenthesis inputs are rejected before stack exhaustion', () => {
  for (const [open, close] of [['{', '}'], ['(', ')']]) {
    const input = open.repeat(3000) + 'a,b' + close.repeat(3000);
    for (const operation of [braces.parse, braces.compile, braces.expand]) {
      assert.throws(() => operation(input), {
        name: 'SyntaxError', message: /exceeds max depth/,
      });
    }
  }
});

test('direct AST traversal also enforces the recursion bound', () => {
  let ast = { type: 'text', value: 'x' };
  for (let i = 0; i < 1000; i++) ast = { type: 'brace', nodes: [ast] };
  ast = { type: 'root', nodes: [ast] };
  for (const operation of [braces.compile, braces.expand, braces.stringify]) {
    assert.throws(() => operation(ast), {
      name: 'RangeError', message: /exceeds max depth/,
    });
  }
});

test('invalid limits cannot disable the depth or input-length guards', () => {
  const input = '{'.repeat(101) + 'a,b' + '}'.repeat(101);
  assert.throws(() => braces.parse(input, { maxDepth: Infinity }), /exceeds max depth/);
  assert.throws(() => braces.parse(input, { maxDepth: NaN }), /exceeds max depth/);
  assert.throws(() => braces.parse('{a,b}', { maxDepth: -1 }), /non-negative/);
  assert.throws(() => braces.parse('{{a,b}}', { maxDepth: 1.5 }), /exceeds max depth/);
  assert.throws(() => braces.parse('x'.repeat(10001), { maxLength: NaN }), /non-negative/);
});

test('cyclic parent links terminate with a bounded error', () => {
  const node = { type: 'paren', nodes: [] };
  node.parent = node;
  assert.throws(() => braces.expand({ type: 'root', nodes: [node] }), /parent chain contains a cycle/);
});

test('stateful option getters cannot replace a checked limit', () => {
  let depthReads = 0;
  assert.throws(() => braces.parse('{{a,b}}', {
    get maxDepth() { return depthReads++ === 0 ? 1 : NaN; },
  }), /exceeds max depth/);
  assert.equal(depthReads, 1);
  let lengthReads = 0;
  assert.throws(() => braces.parse('abcd', {
    get maxLength() { return lengthReads++ === 0 ? 3 : NaN; },
  }), /exceeds max characters/);
  assert.equal(lengthReads, 1);
});

if (manifest.name === 'chronos-blocks') {
  test('the coverage configuration consumer still loads YAML and inherited options', async () => {
    const { loadNycConfig } = packageRequire('@istanbuljs/load-nyc-config');
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chronos-coverage-'));
    try {
      fs.writeFileSync(path.join(directory, 'base.yml'), 'all: true\nreporter:\n  - text\n');
      fs.writeFileSync(path.join(directory, '.nycrc.yml'), 'extends: ./base.yml\ninclude:\n  - src/**/*.js\n');
      const config = await loadNycConfig({ cwd: directory, nycrcPath: '.nycrc.yml' });
      assert.equal(config.all, true);
      assert.deepEqual(config.reporter, ['text']);
      assert.deepEqual(config.include, ['src/**/*.js']);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
}
