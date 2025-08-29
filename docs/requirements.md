# Curtains System Requirements Specification

## 1. System Overview

### 1.1 Purpose
Curtains is a command-line tool that converts Markdown-based presentation files (.curtain) into self-contained HTML presentations with custom styling, containers, and keyboard navigation.

### 1.2 Architecture
The system follows a four-phase processing pipeline:
1. **Parser** - Converts .curtain input to Abstract Syntax Tree (AST)
2. **Transformer** - Converts AST to HTML with scoped CSS
3. **Renderer** - Assembles complete HTML presentation
4. **CLI** - Command-line interface for user interaction

## 2. Functional Requirements

### 2.1 Command-Line Interface (CLI) Requirements

#### REQ-001: CLI Command Support
- **Description**: System shall accept 'build' command to convert .curtain files to HTML
- **Module**: src/cli.ts
- **Type**: Functional

#### REQ-002: Input File Validation
- **Description**: System shall validate that input files have .curtain extension
- **Module**: src/cli.ts, src/config/schemas.ts
- **Type**: Functional

#### REQ-003: Output File Validation
- **Description**: System shall validate that output files have .html extension
- **Module**: src/cli.ts, src/config/schemas.ts
- **Type**: Functional

#### REQ-004: Theme Selection
- **Description**: System shall support 'light' and 'dark' themes via --theme flag
- **Module**: src/cli.ts, src/config/schemas.ts
- **Type**: Functional

#### REQ-005: Help Display
- **Description**: System shall display help text when -h or --help flag is provided
- **Module**: src/cli.ts
- **Type**: Functional

#### REQ-006: Version Display
- **Description**: System shall display version information when -v or --version flag is provided
- **Module**: src/cli.ts
- **Type**: Functional

#### REQ-007: Default Output Naming
- **Description**: System shall default output filename to input filename with .html extension if -o flag not provided
- **Module**: src/cli.ts
- **Type**: Functional

#### REQ-008: Error Exit Codes
- **Description**: System shall return specific exit codes for different error types (1=invalid args, 2=file access, 3=parse error, 4=no slides, 5=output error)
- **Module**: src/cli.ts, src/config/schemas.ts
- **Type**: Functional

### 2.2 Parser Requirements

#### REQ-009: Slide Delimiter Recognition
- **Description**: System shall recognize '===' as slide delimiter pattern
- **Module**: src/parser/slides.ts, src/config/constants.ts
- **Type**: Functional

#### REQ-010: Global Content Extraction
- **Description**: System shall extract content before first delimiter as global content
- **Module**: src/parser/slides.ts
- **Type**: Functional

#### REQ-011: Slide Content Splitting
- **Description**: System shall split content after delimiters into individual slides
- **Module**: src/parser/slides.ts
- **Type**: Functional

#### REQ-012: Maximum Slide Limit
- **Description**: System shall enforce maximum of 99 slides per presentation
- **Module**: src/parser/validate.ts, src/config/constants.ts
- **Type**: Functional

#### REQ-013: Minimum Slide Requirement
- **Description**: System shall require at least one slide in presentation
- **Module**: src/parser/validate.ts
- **Type**: Functional

#### REQ-014: Container Tag Parsing
- **Description**: System shall parse <container class="..."> tags with CSS classes
- **Module**: src/parser/containers.ts
- **Type**: Functional

#### REQ-015: Container Nesting Support
- **Description**: System shall support nested containers up to 10 levels deep
- **Module**: src/parser/containers.ts, src/config/constants.ts
- **Type**: Functional

#### REQ-016: Container Class Validation
- **Description**: System shall validate container class names match pattern [a-zA-Z0-9_-]+
- **Module**: src/parser/validate.ts, src/config/constants.ts
- **Type**: Functional

#### REQ-017: Style Tag Extraction
- **Description**: System shall extract <style> tags from content
- **Module**: src/parser/styles.ts
- **Type**: Functional

#### REQ-018: Global Style Separation
- **Description**: System shall separate global styles from slide-specific styles
- **Module**: src/parser/styles.ts
- **Type**: Functional

#### REQ-019: Markdown Parsing
- **Description**: System shall parse Markdown content using remark/unified ecosystem
- **Module**: src/parser/markdown.ts
- **Type**: Functional

#### REQ-020: GitHub Flavored Markdown Support
- **Description**: System shall support GitHub Flavored Markdown (GFM) including tables
- **Module**: src/parser/markdown.ts
- **Type**: Functional

#### REQ-021: HTML Image Tag Support
- **Description**: System shall parse HTML <img> tags and sanitize attributes (src, alt, class only)
- **Module**: src/parser/markdown.ts
- **Type**: Functional

#### REQ-022: Container Content Dedentation
- **Description**: System shall remove common leading whitespace from container content
- **Module**: src/parser/containers.ts
- **Type**: Functional

#### REQ-023: Inline Container Expansion
- **Description**: System shall expand inline containers to multi-line format for processing
- **Module**: src/parser/containers.ts
- **Type**: Functional

### 2.3 AST Requirements

#### REQ-024: AST Node Types
- **Description**: System shall support node types: root, container, heading, paragraph, list, listItem, link, image, code, text, table, tableRow, tableCell
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-025: Text Node Formatting
- **Description**: Text nodes shall support bold and italic formatting flags
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-026: Heading Depth Support
- **Description**: Heading nodes shall support depth levels 1-6
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-027: List Type Support
- **Description**: List nodes shall support ordered and unordered types
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-028: Link URL Support
- **Description**: Link nodes shall store URL and support both internal and external links
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-029: Image Attributes
- **Description**: Image nodes shall support url, alt, title, and classes attributes
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-030: Code Block Language
- **Description**: Code nodes shall support optional language specification
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-031: Table Cell Alignment
- **Description**: Table cell nodes shall support left, center, and right alignment
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-032: Table Header Detection
- **Description**: Table cell nodes shall support header flag for header cells
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-033: Container Classes Storage
- **Description**: Container nodes shall store array of CSS class names
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-034: Document Version
- **Description**: CurtainsDocument shall include version field (currently '0.1')
- **Module**: src/ast/schemas.ts
- **Type**: Functional

#### REQ-035: Slide Indexing
- **Description**: Each slide shall have 0-based index from 0 to 98
- **Module**: src/ast/schemas.ts
- **Type**: Functional

### 2.4 Transformer Requirements

#### REQ-036: AST to HTML Conversion
- **Description**: System shall convert AST nodes to corresponding HTML elements
- **Module**: src/transformer/ast-to-html.ts
- **Type**: Functional

#### REQ-037: Container to Div Conversion
- **Description**: Container nodes shall convert to <div> elements with classes
- **Module**: src/transformer/ast-to-html.ts
- **Type**: Functional

#### REQ-038: Content Wrapper Application
- **Description**: Non-container content shall be wrapped in .curtains-content div
- **Module**: src/transformer/ast-to-html.ts
- **Type**: Functional

#### REQ-039: External Link Handling
- **Description**: External links shall include target="_blank" and rel="noopener noreferrer"
- **Module**: src/transformer/ast-to-html.ts
- **Type**: Functional

#### REQ-040: HTML Character Escaping
- **Description**: System shall escape HTML special characters in code blocks (&, <, >, ", ')
- **Module**: src/transformer/ast-to-html.ts
- **Type**: Functional

#### REQ-041: Table Structure Generation
- **Description**: Tables with header rows shall generate <thead> and <tbody> sections
- **Module**: src/transformer/ast-to-html.ts
- **Type**: Functional

#### REQ-042: CSS Scoping with nth-child
- **Description**: Slide-specific CSS shall be scoped using .curtains-slide:nth-child(n) selectors
- **Module**: src/transformer/style-scoping.ts
- **Type**: Functional

#### REQ-043: Global CSS Rule Preservation
- **Description**: @keyframes, @media, @import, @charset, @namespace, @supports, @page, @font-face rules shall not be scoped
- **Module**: src/transformer/style-scoping.ts
- **Type**: Functional

#### REQ-044: Multiple Selector Scoping
- **Description**: Comma-separated selectors shall each be scoped individually
- **Module**: src/transformer/style-scoping.ts
- **Type**: Functional

#### REQ-045: Pseudo-Element Handling
- **Description**: Pseudo-elements (::before, ::after) shall be properly scoped
- **Module**: src/transformer/style-scoping.ts
- **Type**: Functional

### 2.5 Renderer Requirements

#### REQ-046: HTML5 Document Structure
- **Description**: System shall generate valid HTML5 document with DOCTYPE declaration
- **Module**: src/renderer/template-builder.ts
- **Type**: Functional

#### REQ-047: Viewport Meta Tag
- **Description**: HTML shall include viewport meta tag for responsive display
- **Module**: src/renderer/template-builder.ts
- **Type**: Functional

#### REQ-048: Slide Section Generation
- **Description**: Each slide shall be wrapped in <section class="curtains-slide"> element
- **Module**: src/renderer/html-generator.ts
- **Type**: Functional

#### REQ-049: CSS Cascade Order
- **Description**: CSS shall be merged in order: base layout → theme variables → global CSS → slide CSS
- **Module**: src/renderer/css-merger.ts
- **Type**: Functional

#### REQ-050: Base Layout CSS
- **Description**: System shall include base layout CSS for presentation structure
- **Module**: src/renderer/css-merger.ts
- **Type**: Functional

#### REQ-051: Theme CSS Variables
- **Description**: System shall load theme-specific CSS variables from style.css template
- **Module**: src/renderer/css-merger.ts, src/templates/style.css
- **Type**: Functional

#### REQ-052: Runtime JavaScript Embedding
- **Description**: System shall embed runtime JavaScript for navigation and controls
- **Module**: src/renderer/runtime.ts
- **Type**: Functional

#### REQ-053: Runtime Configuration
- **Description**: Runtime config shall include totalSlides, theme, and startSlide
- **Module**: src/renderer/schemas.ts
- **Type**: Functional

### 2.6 Runtime Navigation Requirements

#### REQ-054: Keyboard Navigation
- **Description**: System shall support keyboard navigation (Arrow keys, Space, Home, End, F for fullscreen)
- **Module**: src/renderer/runtime.ts
- **Type**: Functional

#### REQ-055: Click Navigation
- **Description**: System shall support click navigation (left half = previous, right half = next)
- **Module**: src/renderer/runtime.ts
- **Type**: Functional

#### REQ-056: Touch/Swipe Navigation
- **Description**: System shall support horizontal swipe gestures for slide navigation
- **Module**: src/renderer/runtime.ts
- **Type**: Functional

#### REQ-057: Slide Counter Display
- **Description**: System shall display current slide number and total (e.g., "1/5")
- **Module**: src/renderer/runtime.ts
- **Type**: Functional

#### REQ-058: Wrap-Around Navigation
- **Description**: Navigation shall wrap from last slide to first and vice versa
- **Module**: src/renderer/runtime.ts
- **Type**: Functional

#### REQ-059: Fullscreen Toggle
- **Description**: System shall support fullscreen mode toggle with F key
- **Module**: src/renderer/runtime.ts
- **Type**: Functional

#### REQ-060: Responsive Scaling
- **Description**: Slides shall scale to fit viewport while maintaining 16:9 aspect ratio (1920x1080)
- **Module**: src/renderer/runtime.ts
- **Type**: Functional

#### REQ-061: Screen Reader Announcements
- **Description**: Slide changes shall be announced to screen readers via aria-live region
- **Module**: src/renderer/runtime.ts
- **Type**: Functional

#### REQ-062: Document Title Updates
- **Description**: Document title shall update to show current slide number
- **Module**: src/renderer/runtime.ts
- **Type**: Functional

### 2.7 Theme Requirements

#### REQ-063: Light Theme Variables
- **Description**: Light theme shall define CSS variables for backgrounds, text, accents, borders, shadows
- **Module**: src/templates/style.css
- **Type**: Functional

#### REQ-064: Dark Theme Variables
- **Description**: Dark theme shall define CSS variables for dark mode appearance
- **Module**: src/templates/style.css
- **Type**: Functional

#### REQ-065: Theme Data Attribute
- **Description**: Theme shall be applied via data-theme attribute on .curtains-root element
- **Module**: src/renderer/template-builder.ts, src/templates/style.css
- **Type**: Functional

#### REQ-066: Theme Transition Effects
- **Description**: Theme changes shall include smooth CSS transitions
- **Module**: src/templates/style.css
- **Type**: Functional

## 3. Non-Functional Requirements

### 3.1 Data Validation Requirements

#### REQ-067: Zod Schema Validation
- **Description**: All data structures shall be validated using Zod schemas at runtime
- **Module**: All schema files (*.schemas.ts)
- **Type**: Non-Functional

#### REQ-068: Type Inference from Schemas
- **Description**: TypeScript types shall be inferred from Zod schemas for compile-time safety
- **Module**: All type files (*.types.ts)
- **Type**: Non-Functional

#### REQ-069: Input Sanitization
- **Description**: User input shall be sanitized and validated before processing
- **Module**: src/parser/validate.ts
- **Type**: Non-Functional

### 3.2 Error Handling Requirements

#### REQ-070: Structured Error Objects
- **Description**: Errors shall use CurtainsError structure with code, message, and exitCode
- **Module**: src/cli.ts, src/config/schemas.ts
- **Type**: Non-Functional

#### REQ-071: Error Message Formatting
- **Description**: Zod validation errors shall be formatted into readable messages
- **Module**: src/cli.ts
- **Type**: Non-Functional

#### REQ-072: Graceful Error Recovery
- **Description**: Parser shall handle unclosed containers by treating as regular content
- **Module**: src/parser/containers.ts
- **Type**: Non-Functional

### 3.3 Performance Requirements

#### REQ-073: CSS Transition Performance
- **Description**: Slide transitions shall use CSS transforms for hardware acceleration
- **Module**: src/renderer/runtime.ts
- **Type**: Non-Functional

#### REQ-074: Resize Throttling
- **Description**: Window resize handling shall be throttled with 100ms delay
- **Module**: src/renderer/runtime.ts
- **Type**: Non-Functional

### 3.4 Accessibility Requirements

#### REQ-075: ARIA Live Regions
- **Description**: System shall use ARIA live regions for screen reader announcements
- **Module**: src/renderer/runtime.ts
- **Type**: Non-Functional

#### REQ-076: Focus States
- **Description**: Interactive elements shall have visible focus states
- **Module**: src/templates/style.css
- **Type**: Non-Functional

#### REQ-077: Semantic HTML
- **Description**: Generated HTML shall use semantic elements (section, nav, etc.)
- **Module**: src/transformer/ast-to-html.ts, src/renderer/html-generator.ts
- **Type**: Non-Functional

### 3.5 Code Quality Requirements

#### REQ-078: No Type Casting
- **Description**: Code shall not use type casting (as, <Type>)
- **Module**: All TypeScript files
- **Type**: Non-Functional

#### REQ-079: No Any/Unknown Types
- **Description**: Code shall not use 'any' or 'unknown' types
- **Module**: All TypeScript files
- **Type**: Non-Functional

#### REQ-080: No Ternary Operators
- **Description**: Code shall use if/else statements instead of ternary operators
- **Module**: All TypeScript files
- **Type**: Non-Functional

#### REQ-081: Explicit Type Safety
- **Description**: All functions shall have explicit parameter and return types via Zod inference
- **Module**: All TypeScript files
- **Type**: Non-Functional

### 3.6 Output Requirements

#### REQ-082: Self-Contained HTML
- **Description**: Generated HTML shall be self-contained with embedded CSS and JavaScript
- **Module**: src/renderer/template-builder.ts
- **Type**: Non-Functional

#### REQ-083: No External Dependencies
- **Description**: Generated presentations shall not require external files or network access
- **Module**: src/renderer/index.ts
- **Type**: Non-Functional

#### REQ-084: UTF-8 Encoding
- **Description**: All file I/O shall use UTF-8 encoding
- **Module**: src/cli.ts
- **Type**: Non-Functional

## 4. Configuration Constants

### 4.1 System Limits

#### REQ-085: Maximum Slides Constant
- **Description**: MAX_SLIDES shall be set to 99
- **Module**: src/config/constants.ts
- **Type**: Non-Functional

#### REQ-086: Maximum Nesting Depth
- **Description**: MAX_NESTING_DEPTH shall be set to 10
- **Module**: src/config/constants.ts
- **Type**: Non-Functional

#### REQ-087: Default Theme
- **Description**: Default theme shall be 'light'
- **Module**: src/config/constants.ts
- **Type**: Non-Functional

### 4.2 Regular Expression Patterns

#### REQ-088: Delimiter Pattern
- **Description**: DELIMITER regex shall match '===' with optional whitespace
- **Module**: src/config/constants.ts
- **Type**: Non-Functional

#### REQ-089: Container Pattern
- **Description**: CONTAINER regex shall match <container> tags with optional class attribute
- **Module**: src/config/constants.ts
- **Type**: Non-Functional

#### REQ-090: Style Pattern
- **Description**: STYLE regex shall match <style> tags and capture content
- **Module**: src/config/constants.ts
- **Type**: Non-Functional

#### REQ-091: Class Name Pattern
- **Description**: CLASS_NAME regex shall validate alphanumeric with dash and underscore
- **Module**: src/config/constants.ts
- **Type**: Non-Functional

## 5. Module Dependencies

### 5.1 External Dependencies

#### REQ-092: Commander CLI Framework
- **Description**: System shall use Commander.js for CLI argument parsing
- **Module**: package.json
- **Type**: Non-Functional

#### REQ-093: Unified/Remark Ecosystem
- **Description**: System shall use unified, remark, and rehype for markdown processing
- **Module**: package.json, src/parser/markdown.ts
- **Type**: Non-Functional

#### REQ-094: Zod Validation Library
- **Description**: System shall use Zod v4 for runtime validation
- **Module**: package.json, all schema files
- **Type**: Non-Functional

### 5.2 Build Requirements

#### REQ-095: TypeScript Compilation
- **Description**: System shall compile TypeScript to JavaScript for distribution
- **Module**: package.json, tsconfig.json
- **Type**: Non-Functional

#### REQ-096: ESBuild Bundling
- **Description**: System shall use ESBuild for bundling distribution files
- **Module**: package.json, esbuild.config.js
- **Type**: Non-Functional

#### REQ-097: Template File Copying
- **Description**: Build process shall copy style.css template to distribution
- **Module**: package.json (copy:templates script)
- **Type**: Non-Functional

## 6. Testing Requirements

### 6.1 Test Framework

#### REQ-098: Vitest Test Runner
- **Description**: System shall use Vitest for unit and integration testing
- **Module**: package.json
- **Type**: Non-Functional

#### REQ-099: Test Coverage Tracking
- **Description**: System shall track test coverage using Vitest coverage
- **Module**: package.json
- **Type**: Non-Functional

### 6.2 Code Quality Checks

#### REQ-100: ESLint Linting
- **Description**: Code shall pass ESLint checks with TypeScript configuration
- **Module**: package.json, eslint configuration
- **Type**: Non-Functional

#### REQ-101: Prettier Formatting
- **Description**: Code shall be formatted according to Prettier configuration
- **Module**: package.json
- **Type**: Non-Functional

#### REQ-102: Type Checking
- **Description**: Code shall pass TypeScript type checking with --noEmit
- **Module**: package.json (type-check script)
- **Type**: Non-Functional

## 7. File Format Requirements

### 7.1 Input Format

#### REQ-103: Curtain File Extension
- **Description**: Input files shall use .curtain extension
- **Module**: src/cli.ts
- **Type**: Functional

#### REQ-104: Markdown Content Support
- **Description**: Input files shall contain Markdown-formatted content
- **Module**: src/parser/markdown.ts
- **Type**: Functional

### 7.2 Output Format

#### REQ-105: HTML5 Compliance
- **Description**: Output shall be valid HTML5 documents
- **Module**: src/renderer/template-builder.ts
- **Type**: Functional

#### REQ-106: HTML File Extension
- **Description**: Output files shall use .html extension
- **Module**: src/cli.ts
- **Type**: Functional