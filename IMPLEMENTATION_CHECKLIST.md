# Implementation Checklist

## Setup
- [ ] Initialize TypeScript project
- [ ] Install dependencies: remark, rehype, commander
- [ ] Set up build scripts

## CLI Layer
- [ ] Parse command arguments
- [ ] Validate input/output paths
- [ ] Read .curtain file
- [ ] Handle exit codes
- [ ] Write output file

## Parser
- [ ] Split on === delimiters
- [ ] Extract style blocks
- [ ] Parse container elements
- [ ] Parse Markdown with remark
- [ ] Build combined AST

## Transformer
- [ ] Convert AST to HTML with rehype
- [ ] Transform containers to divs
- [ ] Add target="_blank" to external links
- [ ] Scope slide styles with nth-child

## Renderer
- [ ] Merge CSS in correct order
- [ ] Build HTML slide structure
- [ ] Inject into template
- [ ] Embed runtime JavaScript

## Runtime (Browser)
- [ ] Arrow key navigation
- [ ] Click navigation
- [ ] Fullscreen toggle (F key)
- [ ] Update slide counter
- [ ] Wrap-around navigation

## Testing
- [ ] Basic .curtain file parsing
- [ ] Container nesting
- [ ] Style scoping
- [ ] Navigation works
- [ ] Counter updates

## Polish
- [ ] Error messages
- [ ] Help text
- [ ] Version command
- [ ] Success confirmation