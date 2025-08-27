# Technical Specification: Implementation Order

## Overview

Step-by-step implementation plan for completely replacing the existing Curtains codebase with the abstraction layer implementation. Each step builds on the previous, ensuring a systematic and testable transition.

## Phase 1: Complete Parser Abstraction (Day 1-2)

### Step 1.1: Create Parser Interface
```
CREATE src/abstractions/parsers/interface.ts
  - Define IParser interface
  - Define ParserCapabilities type
  - Define ParserOptions type
  - Export validated schemas
```

### Step 1.2: Implement Base Parser
```
CREATE src/abstractions/parsers/baseParser.ts
  - Implement plugin system
  - Implement middleware hooks
  - Implement validation pipeline
  - Create visitor registry
```

### Step 1.3: Implement Curtains Parser
```
CREATE src/abstractions/parsers/curtainsParser.ts
  - Import existing parser logic
  - Wrap in abstraction interface
  - Add slide splitting
  - Add style extraction
  - Add container processing
```

### Step 1.4: Create Parser Utilities
```
CREATE src/abstractions/parsers/validators.ts
  - Input validation schemas
  - AST validation schemas
  - Error creation helpers
  
CREATE src/abstractions/parsers/astBuilder.ts
  - Node creation functions
  - Tree building utilities
  - Validation wrappers
```

### Step 1.5: Update Parser Adapter
```
UPDATE src/abstractions/integration/adapters/parserAdapter.ts
  - Use new curtainsParser
  - Remove old parser imports
  - Add capability reporting
  - Add plugin support
```

### Step 1.6: Test Parser Implementation
```
RUN_TESTS:
  - Unit test new parser modules
  - Integration test with coordinator
  - Validate AST output format
  - Test error handling
```

## Phase 2: Complete Transformer Abstraction (Day 2-3)

### Step 2.1: Create Transformer Interface
```
CREATE src/abstractions/transformers/interface.ts
  - Define ITransformer interface
  - Define TransformerCapabilities
  - Define visitor pattern types
  - Export validated schemas
```

### Step 2.2: Implement Base Transformer
```
CREATE src/abstractions/transformers/baseTransformer.ts
  - Implement visitor pattern
  - Create visitor registry
  - Implement middleware system
  - Add validation pipeline
```

### Step 2.3: Implement HTML Transformer
```
CREATE src/abstractions/transformers/htmlTransformer.ts
  - Register HTML visitors for all node types
  - Implement HTML generation
  - Add escaping utilities
  - Support custom visitors
```

### Step 2.4: Create Style Processor
```
CREATE src/abstractions/transformers/styleProcessor.ts
  - CSS parsing logic
  - Scope generation
  - Style optimization
  - At-rule handling
```

### Step 2.5: Create Transformer Adapter
```
CREATE src/abstractions/integration/adapters/transformerAdapter.ts
  - Wrap htmlTransformer
  - Implement adapter interface
  - Add capability reporting
```

### Step 2.6: Test Transformer Implementation
```
RUN_TESTS:
  - Unit test visitor functions
  - Test HTML generation
  - Test CSS scoping
  - Integration test with pipeline
```

## Phase 3: Finalize Renderer Integration (Day 3)

### Step 3.1: Verify Renderer Pipeline
```
VERIFY src/abstractions/rendering/pipeline.ts
  - Ensure all components work
  - Test with real data
  - Validate output format
```

### Step 3.2: Update Renderer Adapter
```
UPDATE src/abstractions/integration/adapters/rendererAdapter.ts
  - Use rendering pipeline
  - Add theme support
  - Implement options handling
```

### Step 3.3: Test Complete Pipeline
```
RUN_TESTS:
  - End-to-end pipeline test
  - Parser -> Transformer -> Renderer
  - Validate final HTML output
  - Test with various inputs
```

## Phase 4: Update CLI Implementation (Day 4)

### Step 4.1: Backup Current CLI
```
BACKUP:
  cp src/cli.ts src/cli.old.ts
  cp src/cli.test.ts src/cli.test.old.ts
```

### Step 4.2: Rewrite CLI with Abstractions
```
REWRITE src/cli.ts
  - Import only from abstractions
  - Use createIntegratedPipeline
  - Implement adapter selection
  - Add plugin loading
  - Update error handling
```

### Step 4.3: Create CLI Support Modules
```
CREATE src/abstractions/cli/commands.ts
  - Build command
  - Watch command
  - Serve command
  - Validate command

CREATE src/abstractions/cli/config.ts
  - Configuration loading
  - Default config
  - Config validation

CREATE src/abstractions/cli/plugins.ts
  - Plugin discovery
  - Plugin loading
  - Plugin registration
```

### Step 4.4: Update CLI Tests
```
UPDATE src/cli.test.ts
  - Test with new implementation
  - Mock abstractions properly
  - Test all commands
  - Test error scenarios
```

### Step 4.5: Manual CLI Testing
```
TEST_COMMANDS:
  node src/cli.js build examples/test.curtain -o test.html
  node src/cli.js validate examples/test.curtain
  node src/cli.js build --parser markdown examples/test.md
  node src/cli.js build --help
```

## Phase 5: Migration Testing (Day 4-5)

### Step 5.1: Create Test Suite
```
CREATE src/abstractions/tests/migration.test.ts
  - Test old vs new output comparison
  - Validate identical HTML generation
  - Check CSS scoping consistency
  - Verify runtime functionality
```

### Step 5.2: Performance Testing
```
BENCHMARK:
  - Measure old pipeline performance
  - Measure new pipeline performance
  - Compare memory usage
  - Document any differences
```

### Step 5.3: Integration Testing
```
TEST_SCENARIOS:
  - Large documents (100+ slides)
  - Complex nesting
  - Multiple style blocks
  - Various markdown features
  - Edge cases and errors
```

## Phase 6: Deletion and Cleanup (Day 5)

### Step 6.1: Final Validation
```
VALIDATE:
  - All tests pass
  - No type errors
  - Build succeeds
  - CLI works correctly
  - Documentation updated
```

### Step 6.2: Create Backup
```
BACKUP:
  tar -czf pre-deletion-backup.tar.gz src/
  git add -A
  git commit -m "feat: complete abstraction implementation"
  git tag pre-deletion
```

### Step 6.3: Execute Deletion
```
DELETE:
  rm -rf src/parser/
  rm -rf src/transformer/
  rm -rf src/renderer/
  rm -f src/main/pipeline.ts
```

### Step 6.4: Verify Clean State
```
VERIFY:
  npx tsc --noEmit
  npm test
  npm run build
  ./dist/cli.js build examples/test.curtain
```

### Step 6.5: Final Commit
```
COMMIT:
  git add -A
  git commit -m "feat: remove old implementation, fully migrated to abstractions"
```

## Phase 7: Documentation and Release (Day 5-6)

### Step 7.1: Update Documentation
```
UPDATE:
  - README.md with new architecture
  - API documentation
  - Plugin development guide
  - Migration guide for users
```

### Step 7.2: Update Examples
```
UPDATE:
  - Example configurations
  - Plugin examples
  - Usage examples
  - Test fixtures
```

### Step 7.3: Prepare Release
```
RELEASE:
  - Update CHANGELOG.md
  - Bump version in package.json
  - Create release notes
  - Tag release version
```

## Implementation Schedule

### Day 1: Parser Foundation
- Morning: Parser interface and base implementation
- Afternoon: Curtains parser and utilities
- Evening: Testing and validation

### Day 2: Transformer Implementation
- Morning: Transformer interface and base
- Afternoon: HTML transformer and style processor
- Evening: Testing and integration

### Day 3: Pipeline Integration
- Morning: Renderer verification
- Afternoon: Complete pipeline testing
- Evening: End-to-end validation

### Day 4: CLI Migration
- Morning: CLI rewrite
- Afternoon: Command implementation
- Evening: CLI testing

### Day 5: Migration Completion
- Morning: Migration testing
- Afternoon: Deletion and cleanup
- Evening: Final validation

### Day 6: Documentation
- Morning: Documentation updates
- Afternoon: Examples and guides
- Evening: Release preparation

## Testing Checklist at Each Phase

PHASE_TESTS:
  Parser:
    - [ ] Parse simple document
    - [ ] Parse complex document
    - [ ] Handle invalid input
    - [ ] Extract styles correctly
    - [ ] Process containers
  
  Transformer:
    - [ ] Transform all node types
    - [ ] Generate valid HTML
    - [ ] Scope CSS correctly
    - [ ] Handle custom visitors
    - [ ] Apply middleware
  
  Renderer:
    - [ ] Generate complete HTML
    - [ ] Include runtime code
    - [ ] Apply theme styles
    - [ ] Validate output
  
  CLI:
    - [ ] Build command works
    - [ ] Watch mode works
    - [ ] Serve mode works
    - [ ] Validation works
    - [ ] Plugin loading works
  
  Migration:
    - [ ] Output matches old system
    - [ ] Performance acceptable
    - [ ] All tests pass
    - [ ] No regressions

## Risk Mitigation

AT_EACH_PHASE:
  - Create git commits after each successful step
  - Run tests before proceeding
  - Keep backups of working state
  - Document any issues found
  - Have rollback plan ready

## Success Metrics

COMPLETION_CRITERIA:
  - Zero direct module imports in CLI
  - All functionality through abstractions
  - 100% test coverage maintained
  - No type casting in codebase
  - Plugin system operational
  - Performance within 10% of original
  - Documentation complete

## Post-Implementation Tasks

FOLLOW_UP:
  - Monitor for issues
  - Gather performance metrics
  - Document lessons learned
  - Plan future enhancements
  - Create plugin starter template
  - Publish to npm if applicable