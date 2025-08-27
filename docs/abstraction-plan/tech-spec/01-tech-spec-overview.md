# Technical Specification: Complete Abstraction Layer Replacement

## Executive Summary

This specification details the complete replacement of the existing Curtains codebase with a fully abstraction-based implementation. The new architecture eliminates direct module coupling, introduces a plugin-ready interface system, and provides a unified pipeline for all processing phases.

## Current State Analysis

### Existing Implementation
- Direct coupling between parser, transformer, and renderer modules
- Monolithic function calls without abstraction interfaces
- Hard-coded pipeline in `src/main/pipeline.ts` and `src/cli.ts`
- Limited extensibility for new formats or processors
- Mixed concerns between business logic and infrastructure

### New Abstraction Implementation
- Complete abstraction layer in `src/abstractions/`
- Registry-based adapter pattern for all components
- Event-driven architecture with state management
- Container factory system for element composition
- Fully validated with Zod schemas throughout

## Architecture Transformation

### Core Components to Replace

PIPELINE_COMPONENTS:
  OLD:
    - src/parser/* (direct markdown parsing)
    - src/transformer/* (direct AST transformation)
    - src/renderer/* (partially reimplemented)
    - src/main/pipeline.ts (monolithic pipeline)
    - src/cli.ts (direct module imports)
  
  NEW:
    - abstractions/integration/coordinator.ts (unified pipeline)
    - abstractions/integration/adapters/* (wrapped modules)
    - abstractions/rendering/pipeline.ts (complete renderer)
    - abstractions/core/registry.ts (adapter management)
    - abstractions/state/store.ts (state management)

### Key Architectural Changes

INTERFACE_LAYER:
  - All modules accessed through interfaces
  - No direct imports of implementation modules
  - Registry-based adapter resolution
  - Middleware support at each phase
  - Plugin architecture ready

VALIDATION_STRATEGY:
  - Zod schemas for all data structures
  - Runtime validation at boundaries
  - No type casting or any types
  - Functional programming patterns
  - Immutable data flow

## Implementation Strategy

### Phase 1: Parser Abstraction
Replace direct parser usage with abstraction-based parser that:
- Implements standard parser interface
- Supports multiple markdown flavors
- Validates all inputs/outputs with Zod
- Provides plugin hooks for custom elements

### Phase 2: Transformer Abstraction  
Create new transformer implementation that:
- Uses visitor pattern for AST traversal
- Supports transformation middleware
- Handles container processing through factory
- Maintains immutable AST structure

### Phase 3: CLI Integration
Update CLI to use only abstraction layer:
- Import coordinator instead of direct modules
- Configure pipeline through registry
- Support adapter selection via CLI flags
- Enable plugin loading from configuration

### Phase 4: Deletion and Cleanup
Remove all old implementation code:
- Delete parser, transformer directories
- Remove main/pipeline.ts
- Clean up unused dependencies
- Update all imports and tests

## Benefits of Complete Replacement

### Extensibility
- Plugin architecture for custom elements
- Multiple parser/renderer support
- Middleware injection points
- Event-driven customization

### Maintainability
- Clear separation of concerns
- Interface-based contracts
- Centralized validation
- Functional, testable components

### Type Safety
- No type casting anywhere
- Zod validation at boundaries
- Inferred types from schemas
- No any or unknown in implementation

## Success Criteria

VALIDATION_METRICS:
  - All tests pass with new implementation
  - Zero type casting in codebase
  - 100% Zod validation coverage
  - No direct module imports in CLI
  - Plugin loading functional
  - State management operational
  - Event system responsive

## Technical Constraints

IMPLEMENTATION_RULES:
  - Use functional programming (no classes)
  - Validate all external data with Zod
  - Use camelCase consistently
  - Return validated data structures
  - Handle errors through result types
  - Maintain immutability

## Migration Approach

This is a COMPLETE REPLACEMENT, not a gradual migration:
1. Implement all missing abstractions
2. Update CLI to use coordinator
3. Delete old implementation entirely
4. Update tests for new architecture
5. Validate functionality end-to-end

No hybrid states, no backwards compatibility layer, no gradual transition - complete architectural replacement in one coordinated change.