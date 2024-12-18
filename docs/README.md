# Documentation Portal Theme for GitHub Pages

This theme provides a clean, modern design for your GitHub Pages documentation website. It's extracted from a professional documentation portal and optimized for GitHub Pages using Jekyll.

## Structure

```
jekyll/
├── _includes/           # Reusable components
│   ├── header.html     # Site header (without search/login)
│   └── footer.html     # Site footer (without Ask AI)
├── _layouts/           # Page layouts
│   └── default.html    # Default page layout
├── assets/            # Static assets
│   ├── css/          # Stylesheets
│   │   ├── main.scss # Main stylesheet
│   │   ├── navbar.scss # Navigation styles
│   │   └── footer.scss # Footer styles
│   └── icons/        # SVG icons
└── _sass/            # Sass partials
    └── custom/       # Custom styles
        ├── _variables.scss  # CSS variables
        └── _layout.scss     # Layout styles
```

## Usage

1. Copy this theme to your GitHub Pages repository
2. Configure your `_config.yml` to use this theme:

```yaml
remote_theme: your-username/repository-name
```

3. Create your content in markdown files

### Header

The header component (`_includes/header.html`) provides a clean navigation bar with:
- Logo support
- Responsive design
- Mobile-friendly navigation

To customize the header:
1. Add your logo to `assets/images/`
2. Update the logo path in `_includes/header.html`
3. Modify navigation items in your `_config.yml`

### Footer

The footer component (`_includes/footer.html`) includes:
- Copyright information
- Social media links
- Secondary navigation
- Responsive layout

To customize the footer:
1. Update social media links in `_config.yml`
2. Modify footer navigation in `_config.yml`
3. Update copyright text

### Styling

The theme uses CSS custom properties for easy customization. Main colors and styles can be modified in `_sass/custom/_variables.scss`:

```scss
:root {
  --color-primary: #0D59F2;
  --color-secondary: #8b8b89;
  --color-text: #0d0d0d;
  --color-background: #fff;
}
```

## Icons

The theme includes a set of SVG icons for common use cases:
- Social media (Facebook, LinkedIn, Twitter)
- UI elements (Plus, Minus, Download)
- Platform indicators (Windows, macOS, Linux)

Icons are located in `assets/icons/` and can be used in your templates:

```html
{% include icon.html name="download" %}
```

## Local Development

To run this site locally:

1. Install Ruby and Bundler if you haven't already
2. Clone this repository
3. Navigate to the docs directory:
   ```bash
   cd docs
   ```
4. Install dependencies:
   ```bash
   bundle install
   ```
5. Start the local server:
   ```bash
   bundle exec jekyll serve --config _config.yml,_config_local.yml
   ```

The site will be available at http://localhost:4000

For GitHub Pages deployment, the site will automatically use the main `_config.yml` which includes the correct baseurl for the production environment.

## License

This theme is available under the MIT License. See the LICENSE file for more info.
