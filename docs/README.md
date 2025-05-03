# Fast Planner Documentation

This folder contains documentation and utilities for the Fast Planner application refactoring project.

## Documentation Files

1. **application-map.md** - Comprehensive overview of the project structure, architecture, and refactoring strategy.
2. **knowledge-base.md** - Detailed information about components, data flow, and developer notes.
3. **component-navigator.js** - Utility script to help navigate between original and refactored components.

## How to Use These Resources

### Application Map

Use the application map to understand the overall project structure and refactoring approach. This document provides:
- Entry points to the application
- Core architecture overview
- Refactoring guidelines
- Step-by-step refactoring plan

Reference this document when starting new refactoring work to maintain consistency with the overall strategy.

### Knowledge Base

The knowledge base contains detailed information about specific components and modules. It's designed to be updated regularly as the project evolves.

This document will help you:
- Understand what each component does
- Track refactoring progress
- Remember common issues and solutions
- Find relevant resources and documentation

### Component Navigator Script

This utility script helps you navigate between the original monolithic component and the refactored versions. To use it:

1. Copy the script to the project root or src directory:
   ```
   cp docs/component-navigator.js src/componentNavigator.js
   ```

2. Run it with Node.js:
   ```
   node src/componentNavigator.js
   ```

3. To find information about a specific component:
   ```
   node src/componentNavigator.js leftPanel
   ```

4. To search for functions in the original component:
   ```
   node src/componentNavigator.js search aircraft
   ```

5. To generate a full component report:
   ```
   node src/componentNavigator.js report
   ```

## Keeping Documentation Updated

These documents should be treated as living documentation. Please update them when:

1. Adding new components or modules
2. Refactoring existing components
3. Changing data flow or dependencies
4. Discovering new patterns or solutions to common problems

Keeping these documents up-to-date ensures consistent progress and makes onboarding new developers easier.

## Next Steps

1. Customize the knowledge base with project-specific details
2. Update the component navigator script with mappings for all components
3. Consider moving this documentation to a tool like Notion or GitBook for better organization