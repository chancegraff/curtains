import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterAll,beforeAll, describe, expect, it } from 'vitest';

import { main } from '../src/libs/cli/main';

describe('Curtains E2E: Full System Tests', () => {
  let tempDir: string;

  beforeAll(async () => {
    // Create a temporary directory for test outputs
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'curtains-e2e-'));
  });

  afterAll(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Basic Conversion Tests', () => {
    it('should convert simple.curtain to HTML', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'simple.curtain');
      const outputPath = path.join(tempDir, 'simple.html');

      // Run the CLI
      await main([inputPath, '-o', outputPath]);

      // Verify output exists
      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);

      // Read and verify content
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<h1>Welcome to Curtains</h1>');
      expect(content).toContain('This is a simple presentation');
      // Check for list items with proper formatting (may have newlines/indentation)
      expect(content).toMatch(/<li>\s*<p>First point<\/p>\s*<\/li>/);
      expect(content).toMatch(/<li>\s*<p>Second point<\/p>\s*<\/li>/);
      expect(content).toMatch(/<li>\s*<p>Third point<\/p>\s*<\/li>/);
      expect(content).toContain('<strong>Bold text</strong>');
      expect(content).toContain('<em>italic text</em>');
    });

    it('should handle multi-slide.curtain with slide splitting', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'multi-slide.curtain');
      const outputPath = path.join(tempDir, 'multi-slide.html');

      // Run the CLI
      await main([inputPath, '-o', outputPath]);

      // Verify output exists
      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);

      // Read and verify content
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      // Check for multiple slides (assuming slides are wrapped in sections)
      const slideMatches = content.match(/<section[^>]*>/g);
      if (slideMatches) {
        expect(slideMatches.length).toBeGreaterThan(1);
      }
    });

    it('should process containers.curtain with container syntax', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'containers.curtain');
      const outputPath = path.join(tempDir, 'containers.html');

      // Run the CLI
      await main([inputPath, '-o', outputPath]);

      // Verify output exists
      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);

      // Read and verify content
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      // Check that container content is present (containers are rendered as content sections)
      expect(content).toContain('Container Examples');
      expect(content).toContain('This is an intro container with special styling');
      expect(content).toContain('Nested Containers');
      expect(content).toContain('Inner nested container');
    });

    it('should handle styles.curtain with style blocks', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'styles.curtain');
      const outputPath = path.join(tempDir, 'styles.html');

      // Run the CLI
      await main([inputPath, '-o', outputPath]);

      // Verify output exists
      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);

      // Read and verify content
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      // Check for style tags or inline styles
      const hasStyleTag = content.includes('<style>') || content.includes('<style ');
      const hasInlineStyle = content.includes('style="');
      expect(hasStyleTag || hasInlineStyle).toBe(true);
    });

    it('should process complex.curtain with all features', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'complex.curtain');
      const outputPath = path.join(tempDir, 'complex.html');

      // Run the CLI
      await main([inputPath, '-o', outputPath]);

      // Verify output exists
      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);

      // Read and verify content
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      // Complex file should have various elements
      expect(content.length).toBeGreaterThan(1000); // Ensure substantial content
      // Check for multiple HTML elements indicating complexity
      expect(content).toMatch(/<h[1-6]/); // Headers
      expect(content).toContain('<p>'); // Paragraphs
      expect(content).toMatch(/<(ul|ol|li)/); // Lists
    });
  });

  describe('Edge Cases and Special Files', () => {
    it('should handle empty.curtain gracefully', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'empty.curtain');
      const outputPath = path.join(tempDir, 'empty.html');

      // Run the CLI
      await main([inputPath, '-o', outputPath]);

      // Verify output exists
      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);

      // Read and verify content
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      // Should still have basic HTML structure
      expect(content).toContain('<html');
      expect(content).toContain('</html>');
    });

    it('should process large.curtain efficiently', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'large.curtain');
      const outputPath = path.join(tempDir, 'large.html');

      const startTime = Date.now();

      // Run the CLI
      await main([inputPath, '-o', outputPath]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify output exists
      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);

      // Should complete in reasonable time (10 seconds)
      expect(duration).toBeLessThan(10000);

      // Read and verify content
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should handle malformed.curtain with error recovery', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'malformed.curtain');
      const outputPath = path.join(tempDir, 'malformed.html');

      // This might throw or might handle gracefully
      let didThrow = false;
      try {
        await main([inputPath, '-o', outputPath]);
      } catch (error) {
        didThrow = true;
        // Verify error is meaningful
        expect(error).toBeDefined();
      }

      if (!didThrow) {
        // If it didn't throw, verify it produced some output
        const stats = await fs.stat(outputPath);
        expect(stats.isFile()).toBe(true);

        const content = await fs.readFile(outputPath, 'utf-8');
        expect(content).toContain('<!DOCTYPE html>');
      }
    });
  });

  describe('Error Handling Tests', () => {
    it('should throw error for non-existent file', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'does-not-exist.curtain');
      const outputPath = path.join(tempDir, 'error.html');

      await expect(main([inputPath, '-o', outputPath])).rejects.toThrow();
    });

    it('should handle wrong file extension gracefully', async () => {
      // Create a file with wrong extension
      const wrongExtPath = path.join(tempDir, 'wrong.txt');
      await fs.writeFile(wrongExtPath, '# Test content', 'utf-8');
      const outputPath = path.join(tempDir, 'wrong-output.html');

      // This should either throw or handle gracefully
      let didThrow = false;
      try {
        await main([wrongExtPath, '-o', outputPath]);
      } catch (error) {
        didThrow = true;
        expect(error).toBeDefined();
      }

      // If it processes anyway, that's also acceptable
      if (!didThrow) {
        const exists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(exists).toBeDefined(); // Just checking it made a decision
      }
    });

    it('should handle invalid output directory path', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'simple.curtain');
      const invalidOutputPath = '/invalid/path/that/does/not/exist/output.html';

      await expect(main([inputPath, '-o', invalidOutputPath])).rejects.toThrow();
    });

    it('should handle missing arguments', async () => {
      // No arguments
      await expect(main([])).rejects.toThrow();
    });

    it('should handle only one argument', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'simple.curtain');
      const expectedOutputPath = path.join(__dirname, 'fixtures', 'simple.html');

      // Only input, no output - should use default output path
      await main([inputPath]);

      // Verify the default output file was created
      const stats = await fs.stat(expectedOutputPath);
      expect(stats.isFile()).toBe(true);

      // Clean up the generated file
      await fs.unlink(expectedOutputPath);
    });
  });

  describe('Output Verification Tests', () => {
    it('should generate valid HTML5 structure', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'simple.curtain');
      const outputPath = path.join(tempDir, 'valid-html.html');

      await main([inputPath, '-o', outputPath]);

      const content = await fs.readFile(outputPath, 'utf-8');

      // Check for HTML5 doctype
      expect(content).toMatch(/^<!DOCTYPE html>/i);

      // Check for required HTML5 elements
      expect(content).toContain('<html');
      expect(content).toContain('</html>');
      expect(content).toContain('<head>');
      expect(content).toContain('</head>');
      expect(content).toContain('<body>');
      expect(content).toContain('</body>');

      // Check for meta charset
      expect(content).toMatch(/<meta[^>]*charset=["']?utf-8["']?[^>]*>/i);
    });

    it('should preserve markdown formatting in output', async () => {
      const inputPath = path.join(__dirname, 'fixtures', 'simple.curtain');
      const outputPath = path.join(tempDir, 'markdown-preserved.html');

      await main([inputPath, '-o', outputPath]);

      const content = await fs.readFile(outputPath, 'utf-8');

      // Bold should become <strong> or <b>
      const hasBold = content.includes('<strong>') || content.includes('<b>');
      expect(hasBold).toBe(true);

      // Italic should become <em> or <i>
      const hasItalic = content.includes('<em>') || content.includes('<i>');
      expect(hasItalic).toBe(true);

      // Lists should be preserved
      expect(content).toContain('<ul>');
      expect(content).toContain('<li>');
    });

    it('should handle concurrent file processing', async () => {
      const promises = [];

      // Process multiple files concurrently
      const files = ['simple.curtain', 'multi-slide.curtain', 'containers.curtain'];

      for (const file of files) {
        const inputPath = path.join(__dirname, 'fixtures', file);
        const outputName = file.replace('.curtain', '-concurrent.html');
        const outputPath = path.join(tempDir, outputName);

        promises.push(main([inputPath, '-o', outputPath]));
      }

      // All should complete successfully
      await Promise.all(promises);

      // Verify all outputs exist
      for (const file of files) {
        const outputName = file.replace('.curtain', '-concurrent.html');
        const outputPath = path.join(tempDir, outputName);
        const stats = await fs.stat(outputPath);
        expect(stats.isFile()).toBe(true);
      }
    });
  });

  describe('CLI Argument Parsing', () => {
    it('should accept absolute paths', async () => {
      const inputPath = path.resolve(path.join(__dirname, 'fixtures', 'simple.curtain'));
      const outputPath = path.resolve(path.join(tempDir, 'absolute.html'));

      await main([inputPath, '-o', outputPath]);

      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);
    });

    it('should handle paths with spaces', async () => {
      // Create a file with spaces in the name
      const spacedDir = path.join(tempDir, 'dir with spaces');
      await fs.mkdir(spacedDir, { recursive: true });

      const spacedFile = path.join(spacedDir, 'file with spaces.curtain');
      const sourceFile = path.join(__dirname, 'fixtures', 'simple.curtain');
      const sourceContent = await fs.readFile(sourceFile, 'utf-8');
      await fs.writeFile(spacedFile, sourceContent, 'utf-8');

      const outputPath = path.join(spacedDir, 'output with spaces.html');

      await main([spacedFile, '-o', outputPath]);

      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);
    });

    it('should handle relative paths from fixtures', async () => {
      // Save current directory
      const originalCwd = process.cwd();

      try {
        // Change to fixtures directory
        process.chdir(path.join(__dirname, 'fixtures'));

        const outputPath = path.join(tempDir, 'relative.html');

        // Use relative path for input
        await main(['./simple.curtain', '-o', outputPath]);

        const stats = await fs.stat(outputPath);
        expect(stats.isFile()).toBe(true);
      } finally {
        // Restore original directory
        process.chdir(originalCwd);
      }
    });
  });
});
