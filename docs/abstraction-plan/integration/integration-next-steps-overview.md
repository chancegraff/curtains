# Integration Next Steps - Overview

## Current Status

The abstraction layer has been fully implemented with:
- **Core Registry**: Manages parser, transformer, and renderer adapters
- **State Store**: Functional state management for presentation flow
- **Event Bus**: Decoupled event handling system
- **Rendering Pipeline**: Modular HTML/CSS/JS generation
- **Container Factory**: Element and container creation system
- **Integration Coordinator**: Orchestrates the entire pipeline

## Integration Architecture

```
CLI Entry Point
    ↓
Integrated Pipeline (NEW)
    ↓
Pipeline Coordinator
    ├── Registry (adapters)
    ├── State Manager
    ├── Event Coordinator
    └── Container System
         ↓
    Parse Phase → Transform Phase → Render Phase → Finalize Phase
         ↓              ↓               ↓              ↓
    ParserAdapter  TransformerAdapter  RendererAdapter  Output
```

## Key Integration Tasks

### 1. Adapter Creation
Create adapter wrappers for existing modules:
- **ParserAdapter**: Wraps `src/parser/index.ts`
- **TransformerAdapter**: Wraps `src/transformer/index.ts`
- **RendererAdapter**: Wraps `src/renderer/index.ts`

### 2. Pipeline Wiring
Connect the abstraction layer to existing code:
- Replace direct function calls with pipeline.process()
- Register default adapters in the global registry
- Initialize middleware for validation and logging

### 3. Event System Integration
Wire runtime events to the UI:
- Connect keyboard navigation
- Enable touch/swipe support
- Implement fullscreen toggling
- Add accessibility announcements

### 4. State Management Connection
Link state to presentation flow:
- Track current slide position
- Manage navigation history
- Persist user preferences
- Sync UI with state changes

### 5. Entry Point Modification
Update CLI to use abstraction layer:
- Create integrated pipeline instance
- Register all adapters
- Process input through coordinated pipeline
- Handle errors consistently

## Implementation Order

### Phase 1: Adapter Implementation
1. Create parser adapter wrapper
2. Create transformer adapter wrapper  
3. Create renderer adapter wrapper
4. Register adapters with global registry

### Phase 2: Pipeline Integration
1. Initialize integrated pipeline
2. Wire up middleware chain
3. Connect state and events
4. Update error handling

### Phase 3: Runtime Connection
1. Connect event bus to DOM events
2. Wire state changes to UI updates
3. Implement navigation controls
4. Add keyboard/touch handlers

### Phase 4: CLI Migration
1. Update cli.ts to use integrated pipeline
2. Remove direct module imports
3. Add adapter selection options
4. Implement plugin loading

## Success Criteria

The integration is complete when:
- All existing functionality works through the abstraction layer
- Direct module coupling is eliminated
- Adapters can be swapped at runtime
- Events flow through the event bus
- State changes trigger UI updates
- Errors are handled consistently
- The pipeline is fully testable

## Risk Areas

### Compatibility Risks
- AST structure differences between parser outputs
- CSS scoping incompatibilities
- Runtime JavaScript injection conflicts

### Performance Risks
- Additional abstraction overhead
- Multiple AST traversals
- Event propagation delays

### Mitigation Strategies
- Create compatibility shims where needed
- Cache adapter instances
- Use direct references for hot paths
- Implement performance monitoring

## Next Documents

The following documents provide detailed implementation plans:
- `integration-main-pipeline.md`: Main pipeline setup and coordination
- `integration-parser-bridge.md`: Parser adapter implementation
- `integration-renderer-bridge.md`: Renderer adapter implementation
- `integration-event-wiring.md`: Event system connection
- `integration-state-management.md`: State synchronization
- `integration-entry-point.md`: CLI modifications