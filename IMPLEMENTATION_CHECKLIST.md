# Implementation Checklist

## Phase 1: Project Foundation
- [ ] Initialize TypeScript project
- [ ] Install dependencies: remark, rehype, commander
- [ ] Set up build scripts

## Phase 2: Core Parser
- [ ] Read .curtain file
- [ ] Split on === delimiters
- [ ] Extract style blocks
- [ ] Parse container elements
- [ ] Parse Markdown with remark
- [ ] Build combined AST
- [ ] Test: Basic .curtain file parsing
- [ ] Test: Container nesting

## Phase 3: Transformer Pipeline
- [ ] Convert AST to HTML with rehype
- [ ] Transform containers to divs
- [ ] Add target="_blank" to external links
- [ ] Scope slide styles with nth-child
- [ ] Test: Style scoping

## Phase 4: HTML Renderer
- [ ] Build HTML slide structure
- [ ] Merge CSS in correct order
- [ ] Inject into template
- [ ] Embed runtime JavaScript

## Phase 5: Runtime Implementation
- [ ] Update slide counter
- [ ] Arrow key navigation
- [ ] Click navigation
- [ ] Wrap-around navigation
- [ ] Fullscreen toggle (F key)
- [ ] Test: Navigation works
- [ ] Test: Counter updates

## Phase 6: CLI Integration
- [ ] Parse command arguments
- [ ] Validate input/output paths
- [ ] Write output file
- [ ] Handle exit codes
- [ ] Error messages
- [ ] Help text
- [ ] Version command
- [ ] Success confirmation