# Technical Specification: Files and Directories to Delete

## Overview

This document provides the exact list of files and directories to DELETE when completing the abstraction layer replacement. These deletions should occur AFTER the new implementation is complete and tested.

## Complete Deletion List

### Parser Module - DELETE ENTIRELY
```
src/parser/
├── index.ts                 # DELETE
├── index.test.ts           # DELETE
├── markdown.ts             # DELETE
├── markdown.test.ts        # DELETE
├── containers.ts           # DELETE
├── containers.test.ts      # DELETE
├── slides.ts               # DELETE
├── slides.test.ts          # DELETE
├── styles.ts               # DELETE
├── styles.test.ts          # DELETE
├── validate.ts             # DELETE
└── validate.test.ts        # DELETE
```

### Transformer Module - DELETE ENTIRELY
```
src/transformer/
├── index.ts                # DELETE
├── index.test.ts          # DELETE
├── ast-to-html.ts         # DELETE
├── ast-to-html.test.ts    # DELETE
├── style-scoping.ts       # DELETE
└── style-scoping.test.ts  # DELETE
```

### Renderer Module - DELETE (Already Reimplemented)
```
src/renderer/
├── index.ts                # DELETE
├── index.test.ts          # DELETE
├── css-merger.ts          # DELETE
├── css-merger.test.ts     # DELETE
├── html-generator.ts      # DELETE
├── html-generator.test.ts # DELETE
├── runtime.ts             # DELETE
├── runtime.test.ts        # DELETE
├── schemas.ts             # DELETE
├── schemas.test.ts        # DELETE
├── template-builder.ts    # DELETE
└── template-builder.test.ts # DELETE
```

### Main Pipeline - DELETE
```
src/main/
└── pipeline.ts            # DELETE
```

### Old CLI Implementation - DELETE (Will be replaced)
```
src/cli.ts                 # DELETE (then recreate with new implementation)
src/cli.test.ts           # DELETE (then recreate with new tests)
```

## Files to Keep and Update

### Configuration Files - KEEP
```
src/config/
├── constants.ts          # KEEP - Update imports only
├── schemas.ts           # KEEP - May need minor updates
└── types.ts             # KEEP - May need minor updates
```

### AST Definitions - KEEP
```
src/ast/
├── schemas.ts           # KEEP - Referenced by abstractions
└── types.ts             # KEEP - Referenced by abstractions
```

### Templates - KEEP
```
src/templates/
└── style.css            # KEEP - Used by renderer
```

### Integration Directory - KEEP BUT EMPTY
```
src/integration/         # KEEP directory but empty (may be used for e2e tests)
```

## Verification Checklist

Before deletion, verify:

CHECK_BEFORE_DELETE:
  - [ ] All abstraction modules are complete
  - [ ] New parser adapter is functional
  - [ ] New transformer adapter is functional  
  - [ ] Renderer pipeline is integrated
  - [ ] CLI uses only abstractions
  - [ ] All tests pass with new implementation
  - [ ] No imports reference deleted files

## Import Update Requirements

Files that will need import updates:

UPDATE_IMPORTS_IN:
  - package.json (main entry point)
  - tsconfig.json (if it references specific files)
  - Any example or documentation files
  - Test setup files
  - Build configuration files

## Deletion Script

Create a deletion script for safety:

```bash
#!/bin/bash
# deletion-script.sh

echo "Starting deletion of old implementation..."

# Create backup first
echo "Creating backup..."
tar -czf backup-before-deletion.tar.gz src/

# Delete parser module
echo "Deleting parser module..."
rm -rf src/parser/

# Delete transformer module  
echo "Deleting transformer module..."
rm -rf src/transformer/

# Delete renderer module
echo "Deleting renderer module..."
rm -rf src/renderer/

# Delete main pipeline
echo "Deleting main pipeline..."
rm -f src/main/pipeline.ts

# Delete old CLI (will be replaced)
echo "Deleting old CLI..."
rm -f src/cli.ts src/cli.test.ts

echo "Deletion complete!"
echo "Backup saved as: backup-before-deletion.tar.gz"
```

## Post-Deletion Tasks

After deletion:

POST_DELETE_TASKS:
  1. Run type checking: `npx tsc --noEmit`
  2. Run all tests: `npm test`
  3. Build project: `npm run build`
  4. Test CLI commands: `node dist/cli.js build example.curtain`
  5. Verify no broken imports
  6. Update documentation
  7. Commit changes

## Directory Structure After Deletion

Final structure:
```
src/
├── abstractions/          # All new implementation
│   ├── containers/
│   ├── core/
│   ├── events/
│   ├── integration/
│   ├── parsers/          # NEW
│   ├── rendering/
│   ├── schemas/
│   ├── state/
│   └── transformers/     # NEW
├── ast/                  # KEPT
├── config/               # KEPT
├── integration/          # KEPT (empty)
├── templates/            # KEPT
└── cli.ts               # RECREATED with abstraction imports
```

## Risk Mitigation

SAFETY_MEASURES:
  - Create full backup before deletion
  - Delete in stages if preferred
  - Keep backup for at least 30 days
  - Document any custom modifications found
  - Verify git history is preserved

## Validation Commands

Run these after deletion:

```bash
# Check for broken imports
npx tsc --noEmit

# Find any remaining references
grep -r "from './parser" src/
grep -r "from './transformer" src/  
grep -r "from './renderer" src/
grep -r "from './main/pipeline" src/

# Verify abstractions work
npm test -- --coverage

# Test build
npm run build

# Test CLI
./dist/cli.js build examples/test.curtain -o test.html
```

## Rollback Plan

If issues occur:

```bash
# Restore from backup
tar -xzf backup-before-deletion.tar.gz

# Or use git
git checkout -- src/parser src/transformer src/renderer src/main/pipeline.ts
```

## Final Notes

IMPORTANT:
  - This is a ONE-WAY operation
  - Ensure new implementation is fully tested
  - Keep backups until confident in new system
  - Update all documentation after deletion
  - Tag the commit before deletion for easy rollback