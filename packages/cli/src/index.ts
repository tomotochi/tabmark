#!/usr/bin/env node

import { Command } from 'commander';
import { MarkdownParser } from 'tabmark-core';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

// Read version from package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('tabmark')
  .description('Convert between Markdown and CSV')
  .version(packageJson.version)
  .argument('<input>', 'Input file path')
  .option('-o, --output <output>', 'Output file path')
  .action((inputPath: string, options: { output?: string }) => {
    try {
      const inputExt = path.extname(inputPath).toLowerCase();

      if (!fs.existsSync(inputPath)) {
        console.error(`Error: Input file '${inputPath}' not found.`);
        process.exit(1);
      }

      const content = fs.readFileSync(inputPath, 'utf-8');
      const parser = new MarkdownParser();

      if (inputExt === '.csv') {
        // CSV -> Markdown
        const parsedCsv = Papa.parse(content, { header: false, skipEmptyLines: true });
        if (parsedCsv.errors.length > 0) {
          console.error('Error parsing CSV:', parsedCsv.errors);
          process.exit(1);
        }

        const rows = parsedCsv.data as string[][];
        if (rows.length === 0) {
          console.error('Error: CSV is empty');
          process.exit(1);
        }

        const headers = rows[0];
        const dataRows = rows.slice(1);

        const gridData = {
          headers,
          rows: dataRows,
        };

        // Use filename as sheet name (without extension)
        const sheetName = path.basename(inputPath, inputExt);
        const markdown = parser.fromGridData(sheetName, gridData);

        const outputPath = options.output || inputPath.replace(/\.csv$/i, '.md');
        fs.writeFileSync(outputPath, markdown);
        console.log(`Converted '${inputPath}' to '${outputPath}'`);
      } else if (inputExt === '.md' || inputExt === '.markdown') {
        // Markdown -> CSV
        const parsed = parser.parseHierarchical(content);
        const gridData = parser.toGridData(parsed);

        const csvData = [gridData.headers, ...gridData.rows];
        const csv = Papa.unparse(csvData);

        const outputPath = options.output || inputPath.replace(/\.(md|markdown)$/i, '.csv');
        fs.writeFileSync(outputPath, csv);
        console.log(`Converted '${inputPath}' to '${outputPath}'`);
      } else {
        console.error('Error: Unsupported file extension. Please use .csv or .md');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();
