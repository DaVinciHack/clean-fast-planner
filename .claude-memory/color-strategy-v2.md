# Better Color Strategy - Keeping Your Existing Scheme

## Current Colors (from what I can see):
- Airports: Blue icons
- Fixed Platforms: Cyan/turquoise dots  
- Movable Rigs: Orange/red dots
- Blocks: Grey dots
- Bases: Purple/magenta rings
- Waypoints: Purple markers

## Proposed Subtle Improvements:

### 1. Keep all existing colors but add contrast
- Add subtle dark stroke to all elements (better visibility on light backgrounds)
- Slightly increase opacity for important items
- Slightly decrease opacity for less important items

### 2. Size hierarchy (most important)
```
Bases: size 8-10 (largest)
Airports: size 7-8  
Movable rigs: size 6
Fixed platforms: size 5
Blocks: size 4 (smallest)
```

### 3. Special indicators
- Fuel: Add subtle green glow/ring (not changing base color)
- Bases: Keep magenta but maybe add a star shape overlay

### 4. Smart opacity based on zoom
- At low zoom: Show only bases, airports, and fuel
- At medium zoom: Add platforms and movable rigs
- At high zoom: Show everything including blocks

Would you like me to implement just these subtle enhancements without changing the core colors?
