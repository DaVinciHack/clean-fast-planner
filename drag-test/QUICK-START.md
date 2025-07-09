# Quick Commands to Start Test Server

## Option 1: Simple Python Server
```bash
cd /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/drag-test
python3 -m http.server 9001
```

## Option 2: Find Your IP Address for iPad
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## Then on iPad:
Open Safari and go to: `http://YOUR_IP:9001`

Example: If your IP is 192.168.1.100, use `http://192.168.1.100:9001`

## Test the Map Locally First:
```bash
open index.html
```

---

## Quick Fix Instructions

**Current Issue**: The line still adds segments at the end instead of dragging from middle.

**What You Should See**: 
- 5 red line segments in Gulf Coast area
- When you drag from MIDDLE of any segment, it should add a waypoint there
- Line should turn green during drag

**If it's still not working right**: Let me know and I can fix the dragging logic further!
