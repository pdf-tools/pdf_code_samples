---
layout: default
title: PDF Search Engine with Pdftools Conversion Service and Elasticsearch
products: [convsrv]
---
# PDF Search Engine with Pdftools Conversion Service and Elasticsearch

{% include conversion-service-info.html %}

{% include disclaimer.html %}

Managing and searching through large archives of PDF documents can be a challenging task. Pdftools Conversion Service, combined with Elasticsearch, offers a powerful solution to this problem by enabling full-text search, metadata filtering, and seamless PDF archiving. This tutorial introduces a project that demonstrates how to build a simple yet effective PDF search engine using these tools.

<img src="{{ site.baseurl }}/assets/images/tutorials/convsrv-elasticsearch.png" alt="PDF Search Engine Screenshot" width="50%" />

The project includes:

PDFIngestor – A C# application that processes PDF files by extracting text and metadata, then indexes them into Elasticsearch.

Frontend – A modern React-based search interface built with Next.js and powered by [Searchkit](https://www.searchkit.co/) for filtering and faceted search.

## Source Code

The complete source code for this product is available in our GitHub repository:
[🔍 PDF Search Engine with Pdftools Conversion Service and Elasticsearch](https://github.com/pdf-tools/pdf_code_samples/tree/main/elasticsearch).

See also [Monitoring Pdftools Conversion Service Logs with ELK Stack](./elk-stack-logs.md).

## Key Use Cases

- **Understand Your PDF Archives** – Want to know exactly what's in your PDF/A archive? This project lets you index and search PDF contents, extracting key metadata such as authors, number of pages, and fonts.

- **Search Across Multiple Document Types** – The Pdftools Conversion Service can handle Word, Excel, PowerPoint, images, and more, converting them into PDF for a uniform and consistent search experience.

- **Efficient Document Management** – Struggling to search a large archive of PDFs? Elasticsearch and Kibana offer robust filtering and analytics, making it easy to manage and retrieve documents.

By using Elasticsearch as a scalable and powerful search engine, combined with Pdftools Conversion Service to standardize document formats into PDF, developers can create efficient solutions for:

- **Archiving government and corporate records**
- **Legal document management**
- **Cataloging research papers**

## How It Works

The architecture of the project is straightforward:

1. Documents are processed by Pdftools Conversion Service and converted to PDFs.
2. The PDFIngestor extracts text and metadata from the PDFs.
3. Extracted data is indexed in Elasticsearch for fast, searchable access.
4. A React-based frontend powered by Searchkit allows users to search, filter, and visualize the documents.

   ```
   (Incoming Documents) -->
       [Pdftools Conversion Service] -->
           (Converted PDFs) -->
               [PDFIngestor] -->
                   (PDF to Text and Metadata) -->
                       [Elasticsearch] <-- [React Frontend]
   ```

## Getting Started

For full instructions on how to set up Elasticsearch, run the PDFIngestor, and deploy the frontend, visit the GitHub repository: [https://github.com/pdf-tools/pdf_code_samples/tree/main/elasticsearch](https://github.com/pdf-tools/pdf_code_samples/tree/main/elasticsearch)

This project is an excellent starting point for developers looking to build document search engines and explore the power of Elasticsearch combined with Pdftools Conversion Service.
