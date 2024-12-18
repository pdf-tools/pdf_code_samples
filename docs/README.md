# PDF Tools Code Samples Documentation

To see the contents of this documentation, click [here](https://pdf-tools.github.io/pdf_code_samples/).

## Local Development

To run this site locally:

```bash
bundle exec jekyll serve --config _config.yml,_config_local.yml
```

The site will be available at http://localhost:4000

For GitHub Pages deployment, the site will automatically use the main `_config.yml` which includes the correct baseurl for the production environment.

## Contributing Content

### Adding Tutorials

Place tutorial files in the `tutorials` folder using [Markdown](https://www.markdownguide.org/) format. Each tutorial should include front matter tags to associate it with specific products:

```yaml
---
layout: default
title: Your Tutorial Title
products: [convsrv]    # Single product
---
```

or for multiple products:

```yaml
---
layout: default
title: Your Tutorial Title
products: [convsrv, sdk, webviewer]    # Multiple products
---
```

### Adding Images

Place tutorial images in the `assets/images/tutorials` folder and reference them in your markdown using:

```markdown
<img src="{{ site.baseurl }}/assets/images/tutorials/your-image.png" alt="Image Description" width="25%" />
```

## Resources

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Pages](https://docs.github.com/en/pages)
- [Markdown Guide](https://www.markdownguide.org/)
- [PDF Tools Website](https://www.pdf-tools.com/)

## License

This theme is available under the MIT License. See the LICENSE file for more info.
