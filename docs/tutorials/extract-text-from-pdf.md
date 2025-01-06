---
layout: default
title: Extract Text from PDFs with the Pdftools SDK
products: [sdk]
---
## Extract Text from PDFs with the Pdftools SDK

{% include sdk-info.html %}

{% include disclaimer.html %}

### Introduction

Extracting text from PDFs can unlock a wealth of possibilities, from building searchable archives to powering machine learning pipelines. This tutorial introduces PDFIngestor, a C# application that leverages the Pdftools SDK and Pdf Toolbox Add-On to extract and structure text from PDF files.

<img src="{{ site.baseurl }}/assets/images/tutorials/sdk-pdf-text-extraction.png" alt="PDF Text Extraction with the Pdftools SDK code sample" width="50%" />

**PDFIngestor** demonstrates how to:
- Extract raw text from PDFs
- Convert extracted text into a structured format
- Retrieve and export PDF metadata
- Output results as JSON for indexing in search engines like Elasticsearch or powering your LLM RAG pipelines.

### Source Code

The full application is available on GitHub:
- **[PDFIngestor Code](https://github.com/pdf-tools/pdf_code_samples/tree/main/elasticsearch/PDFIngestor)**
- **[Build and Run PDFIngestor Guide](https://github.com/pdf-tools/pdf_code_samples/tree/main/elasticsearch#build-and-run-pdfingestor)**

See also [PDF Search Engine with Pdftools Conversion Service and Elasticsearch](./pdf-search-engine.md).

### Why Extract PDF Text?

Extracting and structuring text from PDFs has several practical applications:
- **Search Engine Indexing** – Make PDF content searchable in Elasticsearch or other search platforms.
- **Machine Learning Pipelines** – Use structured PDF content to train models or provide data for Retrieval-Augmented Generation (RAG) in large language models (LLMs).
- **Content Summarization** – Extract relevant data from large PDF archives and generate concise summaries.

### How PDFIngestor Works

**PDFIngestor** is a lightweight C# application that processes PDFs using the Pdftools SDK and Pdf Toolbox Add-On. It extracts text, metadata, and formatting information, outputting everything in JSON format.

The application utilizes the following namespaces from the Pdftools SDK:
```csharp
using PdfTools.FourHeights.PdfToolbox;
using PdfTools.FourHeights.PdfToolbox.Geometry.Real;
using PdfTools.FourHeights.PdfToolbox.Pdf.Content;
using Document = PdfTools.FourHeights.PdfToolbox.Pdf.Document;
```

### Key Features

- **Text Extraction** – Extracts plain and structured text from PDFs.
- **Metadata Retrieval** – Captures information such as author, conformance level, and fonts used.
- **JSON Output** – Converts extracted data to JSON for easy indexing or further processing.
- **Integration Ready** – Directly integrates with Elasticsearch or other data storage systems.

### Use Cases

- **Enterprise Document Management** – Process large volumes of documents and make them easily searchable.
- **Legal and Compliance** – Extract key clauses, terms, and metadata from PDFs.
- **AI/ML Pipelines** – Provide PDF content as input to AI models for summarization, question answering, or data augmentation.

### Building and Running PDFIngestor

To build and run the application, follow the step-by-step guide available in the GitHub repository:
- **[PDFIngestor Build and Run Instructions](https://github.com/pdf-tools/pdf_code_samples/tree/main/elasticsearch#build-and-run-pdfingestor)**

This guide covers prerequisites, configuring the Pdftools SDK, adding license keys, and running the application in different modes (watch/execute).

### Getting Started with Pdftools SDK

PDFIngestor requires the Pdftools SDK and Pdf Toolbox Add-On. These tools provide a comprehensive suite for PDF manipulation and text extraction.
- **[Pdftools SDK Documentation](https://www.pdf-tools.com/docs/pdf-tools-sdk/)**
- **[Toolbox Add-On Documentation](https://www.pdf-tools.com/docs/pdf-tools-sdk/getting-started/toolbox/)**

### Example Workflow

1. Convert incoming documents to PDF using Pdftools Conversion Service.
2. Use PDFIngestor to extract text and metadata.
3. Index extracted data into Elasticsearch.
4. Power search engines, AI pipelines, or reporting systems with structured PDF data.

### Related Projects

For a complete PDF search engine using Pdftools Conversion Service, Elasticsearch, and PDFIngestor, check out:
- **[PDF Search Engine Tutorial](pdf-search-engine.md)**