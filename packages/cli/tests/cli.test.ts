import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const CLI_PATH = path.resolve(__dirname, '../dist/index.js');
const TEST_DIR = path.resolve(__dirname, 'temp_test_env');

function runCli(args: string) {
  return execSync(`node ${CLI_PATH} ${args}`, { cwd: TEST_DIR, encoding: 'utf-8' });
}

describe('Tabmark CLI', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should convert CSV to Markdown', () => {
    const csvContent = 'name,price\nProduct A,100\nProduct B,200';
    const csvPath = path.join(TEST_DIR, 'test.csv');
    fs.writeFileSync(csvPath, csvContent);

    runCli('test.csv');

    const mdPath = path.join(TEST_DIR, 'test.md');
    expect(fs.existsSync(mdPath)).toBe(true);

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    expect(mdContent).toContain('### name');
    expect(mdContent).toContain('Product A');
    expect(mdContent).toContain('### price');
    expect(mdContent).toContain('100');
  });

  it('should convert Markdown to CSV', () => {
    const mdContent = '# test\n## 0\n### name\nProduct A\n### price\n100';
    const mdPath = path.join(TEST_DIR, 'test.md');
    fs.writeFileSync(mdPath, mdContent);

    runCli('test.md');

    const csvPath = path.join(TEST_DIR, 'test.csv');
    expect(fs.existsSync(csvPath)).toBe(true);

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    expect(csvContent).toContain('name,price');
    expect(csvContent).toContain('Product A,100');
  });

  it('should handle custom output path', () => {
    const csvContent = 'name,price\nProduct A,100';
    const csvPath = path.join(TEST_DIR, 'test.csv');
    fs.writeFileSync(csvPath, csvContent);

    runCli('test.csv -o custom.md');

    const mdPath = path.join(TEST_DIR, 'custom.md');
    expect(fs.existsSync(mdPath)).toBe(true);
  });
});
