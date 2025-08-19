# Implementation Checklist

## Phase 1: Project Foundation
- [X] Initialize TypeScript project
- [X] Install dependencies: remark, rehype, commander

## Phase 2: Core Parser
- [X] Read .curtain file
- [X] Split on === delimiters
- [X] Extract style blocks
- [X] Parse container elements
- [X] Parse Markdown with remark
- [X] Build combined AST
- [X] Test: Basic .curtain file parsing
- [X] Test: Container nesting

## Phase 3: Transformer Pipeline
- [X] Convert AST to HTML with rehype
- [X] Transform containers to divs
- [X] Add target="_blank" to external links
- [X] Scope slide styles with nth-child
- [X] Test: Style scoping

## Phase 4: HTML Renderer
- [X] Build HTML slide structure
- [X] Merge CSS in correct order
- [X] Inject into template
- [X] Embed runtime JavaScript

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
- [ ] Set up build scripts
