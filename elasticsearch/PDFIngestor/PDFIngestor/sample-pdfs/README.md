# Sample PDFs Directory

This directory is used for storing test PDFs during development. When running the application through Visual Studio or other IDEs using the launch settings, PDFs placed in this directory will be processed and indexed into Elasticsearch.

## Usage

1. Place your test PDF files directly in this directory
2. The application will process all PDF files in this directory when launched through Visual Studio
3. Files will be indexed into Elasticsearch using the credentials and endpoint specified in `launchSettings.json`

## Important Notes

- This directory is meant for development and testing only
- Do not commit PDF files to this directory in source control
- When running the application from the command line, you can specify any directory path as the first argument
