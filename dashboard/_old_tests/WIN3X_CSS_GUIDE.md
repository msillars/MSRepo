# Windows 3.1 CSS Integration Guide

## What You Got

Three CSS files that recreate the authentic Windows 3.1 look and feel:

1. **layout.css** - Layout utilities (flexbox, grid, spacing)
2. **win3x-theme.css** - Complete Windows 3.x theme (buttons, windows, scrollbars, etc.)
3. **win3x-skin-3.1.css** - Windows 3.1 color scheme (that iconic gray and blue)

## How to Use

### In Your HTML Files

Add these lines in the `<head>` section of your HTML files:

```html
<link rel="stylesheet" href="layout.css">
<link rel="stylesheet" href="win3x-theme.css">
<link rel="stylesheet" href="win3x-skin-3.1.css">
```

**Important:** The order matters! Load them in this exact sequence.

### Key CSS Classes Available

**Window Elements:**
- `.window` - Main window container
- `.title-bar` - Window title bar
- `.title-bar-text` - Title text
- `.window-body` - Window content area
- `.title-bar-buttons` - Container for minimize/maximize/close buttons

**Buttons:**
- `<button>` - Styled automatically with 3D raised effect
- `.primary` - Primary button style (default focus appearance)

**Layout Utilities:**
- `.flex-row` / `.flex-column` - Flexbox containers
- `.padding` / `.margin` - Standard spacing
- `.raised` - Raised panel effect
- `.lowered` - Lowered/inset panel effect

**Lists and Grids:**
- `.list` - List container
- `.icon-grid` - Grid layout for icons

### Example Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Windows 3.1 App</title>
    <link rel="stylesheet" href="layout.css">
    <link rel="stylesheet" href="win3x-theme.css">
    <link rel="stylesheet" href="win3x-skin-3.1.css">
</head>
<body>
    <div class="window">
        <div class="title-bar">
            <div class="title-bar-text">My Application</div>
            <div class="title-bar-buttons">
                <button data-minimize></button>
                <button data-maximize></button>
                <button data-close></button>
            </div>
        </div>
        <div class="window-body">
            <p>Hello, Windows 3.1!</p>
            <button>OK</button>
            <button>Cancel</button>
        </div>
    </div>
</body>
</html>
```

### Color Variables (from win3x-skin-3.1.css)

You can reference these CSS variables in your custom styles:

- `--desktop-bg: #C0C0C0` - Classic gray background
- `--window-bg: #FFFFFF` - Window background
- `--title-bar-active-bg: #0000C0` - Active title bar blue
- `--title-bar-active-fg: #FFFFFF` - Active title bar text
- `--selection-bg: #0000C0` - Selection background
- `--button-bg: #C0C0C0` - Button background

### Notes

- The theme includes SVG references for icons (arrows, checkmarks, etc.) - these reference external SVG files that you may need to provide or replace
- Native form elements (buttons, inputs, checkboxes, radio buttons) are automatically styled
- The theme uses CSS custom properties (variables) for easy customization

## Source

These stylesheets are from the [classic-stylesheets](https://github.com/nielssp/classic-stylesheets) project by nielssp, specifically version 2.0+ which includes improved HiDPI support with SVG icons.

## Demo

View the official demo at: https://nielssp.github.io/classic-stylesheets/?theme=win3x&skin=3.1
