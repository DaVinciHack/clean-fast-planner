# Claude Memory System

This directory maintains context and progress tracking across sessions for the FastPlannerV5 project.

## Structure

- `session-logs/` - Daily session summaries
- `refactoring-progress/` - Track ongoing refactoring efforts
- `code-analysis/` - Analysis of complex modules
- `decision-log.md` - Important architectural decisions
- `current-focus.md` - What we're currently working on
- `known-issues.md` - Active issues and their status

## Usage

Each session begins by reading `current-focus.md` to understand the immediate task.
Session work is logged with timestamps for continuity.

## Principles

1. No dummy data or mock values
2. Aviation safety standards - no shortcuts
3. One change at a time with testing
4. Clean, maintainable code structure
5. Real OSDK data only
