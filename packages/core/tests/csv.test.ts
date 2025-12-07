import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../src/parser';

describe('MarkdownParser - CSV Import/Export', () => {
  const parser = new MarkdownParser();

  describe('Basic CSV Operations', () => {
    it('should convert simple CSV to GridData', () => {
      const csv = 'Name,Age\nAlice,30\nBob,25';
      const gridData = parser.fromCSV(csv);

      expect(gridData.headers).toEqual(['Name', 'Age']);
      expect(gridData.rows).toEqual([
        ['Alice', '30'],
        ['Bob', '25'],
      ]);
    });

    it('should convert GridData to CSV', () => {
      const gridData = {
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25'],
        ],
      };

      const csv = parser.toCSV(gridData);
      expect(csv).toContain('Name,Age');
      expect(csv).toContain('Alice,30');
      expect(csv).toContain('Bob,25');
    });

    it('should handle round-trip conversion', () => {
      const originalCSV = 'Name,Age,City\nAlice,30,NYC\nBob,25,LA';
      const gridData = parser.fromCSV(originalCSV);
      const newCSV = parser.toCSV(gridData);
      const roundTripData = parser.fromCSV(newCSV);

      expect(roundTripData).toEqual(gridData);
    });

    it('should handle empty cells', () => {
      const csv = 'A,B,C\n1,,3\n,2,';
      const gridData = parser.fromCSV(csv);

      expect(gridData.rows[0]).toEqual(['1', '', '3']);
      expect(gridData.rows[1]).toEqual(['', '2', '']);
    });

    it('should handle empty CSV', () => {
      const csv = '';
      const gridData = parser.fromCSV(csv);

      expect(gridData.headers).toEqual([]);
      expect(gridData.rows).toEqual([]);
    });
  });

  describe('Duplicate Headers', () => {
    it('should preserve duplicate header names', () => {
      const csv = 'Name,Age,Name\nAlice,30,Alice2\nBob,25,Bob2';
      const gridData = parser.fromCSV(csv);

      expect(gridData.headers).toEqual(['Name', 'Age', 'Name']);
      expect(gridData.rows[0]).toEqual(['Alice', '30', 'Alice2']);
      expect(gridData.rows[1]).toEqual(['Bob', '25', 'Bob2']);
    });

    it('should handle round-trip with duplicate headers', () => {
      const gridData = {
        headers: ['ID', 'Name', 'ID', 'Name'],
        rows: [
          ['1', 'Alice', '2', 'Bob'],
          ['3', 'Charlie', '4', 'David'],
        ],
      };

      const csv = parser.toCSV(gridData);
      const roundTripData = parser.fromCSV(csv);

      expect(roundTripData.headers).toEqual(gridData.headers);
      expect(roundTripData.rows).toEqual(gridData.rows);
    });

    it('should handle multiple duplicate headers', () => {
      const csv = 'A,A,A,B,B\n1,2,3,4,5';
      const gridData = parser.fromCSV(csv);

      expect(gridData.headers).toEqual(['A', 'A', 'A', 'B', 'B']);
      expect(gridData.rows[0]).toEqual(['1', '2', '3', '4', '5']);
    });
  });

  describe('Newlines in Data', () => {
    it('should handle newlines in cell content', () => {
      const gridData = {
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', 'Line 1\nLine 2\nLine 3'],
          ['Bob', 'Single line'],
        ],
      };

      const csv = parser.toCSV(gridData);
      const roundTripData = parser.fromCSV(csv);

      expect(roundTripData.rows[0][1]).toBe('Line 1\nLine 2\nLine 3');
      expect(roundTripData.rows[1][1]).toBe('Single line');
    });

    it('should handle CSV with quoted fields containing newlines', () => {
      const csv = 'Name,Description\nAlice,"Line 1\nLine 2"\nBob,Simple';
      const gridData = parser.fromCSV(csv);

      expect(gridData.rows[0][1]).toBe('Line 1\nLine 2');
      expect(gridData.rows[1][1]).toBe('Simple');
    });

    it('should handle special characters with newlines', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['Text with\ncomma, quote", and newline']],
      };

      const csv = parser.toCSV(gridData);
      const roundTripData = parser.fromCSV(csv);

      expect(roundTripData.rows[0][0]).toBe('Text with\ncomma, quote", and newline');
    });
  });

  describe('HTML Security', () => {
    it('should preserve HTML content in CSV', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['<script>alert(1)</script>'], ['<img src=x onerror=alert(1)>']],
      };

      const csv = parser.toCSV(gridData);
      const roundTripData = parser.fromCSV(csv);

      expect(roundTripData.rows[0][0]).toBe('<script>alert(1)</script>');
      expect(roundTripData.rows[1][0]).toBe('<img src=x onerror=alert(1)>');
    });
  });

  describe('Markdown Structure Preservation', () => {
    it('should preserve Markdown through CSV → GridData → Markdown → GridData → CSV', () => {
      const originalGridData = {
        headers: ['Content'],
        rows: [['#### Heading\n- item1\n- item2'], ['**bold** and _italic_']],
      };

      // CSV → GridData
      const csv = parser.toCSV(originalGridData);
      const gridData1 = parser.fromCSV(csv);

      // GridData → Markdown
      const markdown = parser.fromGridData('test', gridData1);

      // Markdown → GridData
      const parsed = parser.parseHierarchical(markdown);
      const gridData2 = parser.toGridData(parsed);

      // GridData → CSV
      const finalCSV = parser.toCSV(gridData2);
      const finalGridData = parser.fromCSV(finalCSV);

      // Verify content preservation
      expect(finalGridData.rows[0][0]).toContain('#### Heading');
      expect(finalGridData.rows[0][0]).toContain('- item1');
      expect(finalGridData.rows[0][0]).toContain('- item2');
    });

    it('should handle headings in cells', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['#### H4\n##### H5\n###### H6']],
      };

      const csv = parser.toCSV(gridData);
      const markdown = parser.fromGridData('test', parser.fromCSV(csv));
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toContain('#### H4');
      expect(restored.rows[0][0]).toContain('##### H5');
      expect(restored.rows[0][0]).toContain('###### H6');
    });

    it('should handle lists in cells', () => {
      const gridData = {
        headers: ['Items'],
        rows: [['- apple\n- banana\n- cherry']],
      };

      const csv = parser.toCSV(gridData);
      const markdown = parser.fromGridData('test', parser.fromCSV(csv));
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toContain('- apple');
      expect(restored.rows[0][0]).toContain('- banana');
      expect(restored.rows[0][0]).toContain('- cherry');
    });
  });

  describe('Special Characters', () => {
    it('should handle commas in cells', () => {
      const gridData = {
        headers: ['Name'],
        rows: [['Last, First']],
      };

      const csv = parser.toCSV(gridData);
      const roundTripData = parser.fromCSV(csv);

      expect(roundTripData.rows[0][0]).toBe('Last, First');
    });

    it('should handle quotes in cells', () => {
      const gridData = {
        headers: ['Quote'],
        rows: [['He said "hello"']],
      };

      const csv = parser.toCSV(gridData);
      const roundTripData = parser.fromCSV(csv);

      expect(roundTripData.rows[0][0]).toBe('He said "hello"');
    });

    it('should handle Unicode characters', () => {
      const gridData = {
        headers: ['Text'],
        rows: [['日本語'], ['Émoji: 😀🎉']],
      };

      const csv = parser.toCSV(gridData);
      const roundTripData = parser.fromCSV(csv);

      expect(roundTripData.rows[0][0]).toBe('日本語');
      expect(roundTripData.rows[1][0]).toBe('Émoji: 😀🎉');
    });
  });
});
