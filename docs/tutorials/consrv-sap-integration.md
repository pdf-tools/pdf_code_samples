---
layout: default
title: Convert Documents in SAP to PDF with the Pdftools Conversion Service using ABAP
products: [convsrv]
---
## Convert Documents in SAP to PDF with the Pdftools Conversion Service using ABAP

{% include conversion-service-info.html %}

{% include disclaimer.html %}

## Introduction

This guide will walk you through integrating SAP with Pdftools Conversion Service, enabling you to convert all kinds of documents you have stored in SAP, such at Word, Excel, standard PDFs, images and more into [PDF/A formats](https://www.pdf-tools.com/docs/conversion-service/workflows/pdfa_2/) e.g. for archiving or merging in a [PDF Dossier](https://www.pdf-tools.com/docs/conversion-service/workflows/dossier/). The integration uses SAP's ABAP language to communicate with the Pdftools Conversion Service API endpoints.

### Prerequisites
- SAP NetWeaver system with ABAP development environment.
- Access to a Pdftools Conversion Service installation (with comes with REST API).
- API Base URL for your on-premise Conversion Service installation.

### Pdftools Conversion Service REST API

The Pdftools Conversion Service comes with a full REST API that you can use on-premise or in a secure private cloud.

- [REST API Getting Started Guide](https://www.pdf-tools.com/docs/conversion-service/getting-started/api/)
- [REST API Refenences](https://www.pdf-tools.com/docs/conversion-service/api/)

### 1. Create a New Job in ABAP

Create a new ABAP class or report that handles API calls. The following code demonstrates how to create a job via an HTTP POST request.

```abap
DATA: lv_url TYPE string,
      lo_http_client TYPE REF TO if_http_client,
      lv_response TYPE string,
      lv_status_code TYPE i.

lv_url = '<YOUR_BASE_URL>/jobs/?workflow=Archive PDF/A-2&profile=default'.

CALL METHOD cl_http_client=>create_by_url
  EXPORTING
    url = lv_url
  IMPORTING
    client = lo_http_client.

lo_http_client->request->set_method( 'POST' ).
lo_http_client->request->set_header_field( name = 'Content-Type' value = 'application/json' ).
lo_http_client->request->set_header_field( name = 'Accept' value = 'application/json' ).

CALL METHOD lo_http_client->send
  EXCEPTIONS
    http_communication_failure = 1
    http_invalid_state = 2.

CALL METHOD lo_http_client->receive
  EXCEPTIONS
    http_communication_failure = 1
    http_invalid_state = 2.

lv_response = lo_http_client->response->get_cdata( ).
lv_status_code = lo_http_client->response->get_status_code( ).

WRITE: / 'Status:', lv_status_code,
       / 'Response:', lv_response.
```

### 2. Upload Data to the Job

Once the job is created, you need to upload files. The example below demonstrates uploading a file in ABAP.

```abap
DATA: lv_job_id TYPE string VALUE '<JOB_ID>',
      lv_upload_url TYPE string,
      lv_file TYPE xstring.

lv_upload_url = '<YOUR_BASE_URL>/jobs/' && lv_job_id && '/data/'.

CALL METHOD cl_http_client=>create_by_url
  EXPORTING
    url = lv_upload_url
  IMPORTING
    client = lo_http_client.

lo_http_client->request->set_method( 'POST' ).
lo_http_client->request->set_header_field( name = 'Accept' value = 'application/json' ).
lo_http_client->request->set_file(
  data = lv_file
  filename = 'document.docx'
  content_type = 'application/octet-stream' ).

CALL METHOD lo_http_client->send.
CALL METHOD lo_http_client->receive.

WRITE: / 'File Upload Status:', lo_http_client->response->get_status_code( ).
```

### 3. Start the Job

After uploading data, the job must be started to initiate the conversion process.

```abap
DATA: lv_start_url TYPE string.

lv_start_url = '<YOUR_BASE_URL>/jobs/' && lv_job_id && ':start'.

CALL METHOD cl_http_client=>create_by_url
  EXPORTING
    url = lv_start_url
  IMPORTING
    client = lo_http_client.

lo_http_client->request->set_method( 'POST' ).
lo_http_client->request->set_header_field( name = 'Accept' value = 'application/json' ).

CALL METHOD lo_http_client->send.
CALL METHOD lo_http_client->receive.

WRITE: / 'Start Job Status:', lo_http_client->response->get_status_code( ).
```

### 4. Retrieve the Result
Once the job is completed, the result can be downloaded by querying the result endpoint.

```abap
DATA: lv_result_url TYPE string.

lv_result_url = '<YOUR_BASE_URL>/jobs/' && lv_job_id && '/result/'.

CALL METHOD cl_http_client=>create_by_url
  EXPORTING
    url = lv_result_url
  IMPORTING
    client = lo_http_client.

lo_http_client->request->set_method( 'GET' ).
lo_http_client->request->set_header_field( name = 'Accept' value = 'application/json' ).

CALL METHOD lo_http_client->send.
CALL METHOD lo_http_client->receive.

WRITE: / 'Job Result:', lo_http_client->response->get_cdata( ).
```

### 5. Delete the Job (Cleanup)

Once the result is retrieved, delete the job to ensure system hygiene.

```abap
DATA: lv_delete_url TYPE string.

lv_delete_url = '<YOUR_BASE_URL>/jobs/' && lv_job_id.

CALL METHOD cl_http_client=>create_by_url
  EXPORTING
    url = lv_delete_url
  IMPORTING
    client = lo_http_client.

lo_http_client->request->set_method( 'DELETE' ).
lo_http_client->request->set_header_field( name = 'Accept' value = 'application/json' ).

CALL METHOD lo_http_client->send.
CALL METHOD lo_http_client->receive.

WRITE: / 'Delete Job Status:', lo_http_client->response->get_status_code( ).
```

### SAP Configuration Tips
- Base URL Configuration: Store the base URL as a constant or in a custom table for easy modification.
- Error Handling: Implement checks for status codes (201, 204, 400, 404) to manage errors gracefully.
- Batch Processing: Use background jobs for bulk document conversions to avoid timeouts in the front end.
- Security: Ensure HTTPS is used for API communication to secure data in transit.
- Logging: Log API calls and responses to SAP application logs (SLG1) for traceability.

## SAP UI and ABAP Integration with PDF Tools Conversion Service

### Project Overview
The goal is to provide a simple UI for users to upload documents and convert them to PDF/A through the PDF Tools Conversion Service. This project will:

- Create an SAP UI5 (or GUI Dynpro) application for file upload.
- Implement ABAP logic to call the Conversion Service API.
- Handle job creation, file upload, job execution, and download of results.

### 1. UI Layer – SAP UI5 or Dynpro Interface

#### UI5 Example (File Upload)
Create a UI5 XML View that allows users to upload a file for conversion.

#### View (upload.view.xml):

```xml
<mvc:View
    xmlns:mvc="sap.ui.core.mvc"
    xmlns="sap.m">
    <Page title="Document Conversion">
        <content>
            <VBox>
                <FileUploader
                    id="fileUploader"
                    name="file"
                    width="100%"
                    tooltip="Upload a document to convert"
                    uploadUrl="/sap/opu/odata/PDF_CONVERSION/UploadFileSet"
                    change="onFileUpload"
                    style="Margin: 10px;" />
                <Button text="Convert to PDF" press="onConvertPress"/>
            </VBox>
        </content>
    </Page>
</mvc:View>
```

#### Controller (upload.controller.js):

```javascript
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("pdf.convert.controller.Upload", {
        onFileUpload: function (oEvent) {
            var oUploader = this.getView().byId("fileUploader");
            oUploader.upload();
        },

        onConvertPress: function () {
            var oUploader = this.getView().byId("fileUploader");
            var sFile = oUploader.getValue();
            
            if (!sFile) {
                sap.m.MessageToast.show("Please upload a file.");
                return;
            }

            $.ajax({
                url: "/sap/opu/odata/PDF_CONVERSION/ConvertDocumentSet",
                method: "POST",
                contentType: "application/json",
                success: function (oData) {
                    sap.m.MessageToast.show("File conversion started.");
                },
                error: function () {
                    sap.m.MessageToast.show("Conversion failed.");
                }
            });
        }
    });
});
```

### 2. Backend – ABAP Service Implementation

#### Create an OData Service for File Handling (SEGW transaction).

1. Create Entity Types and Sets:
-- Entity Type: UploadFile
-- Entity Set: UploadFileSet
-- Entity Type: ConvertDocument
-- Entity Set: ConvertDocumentSet

2. Implement Service Methods:

#### ZCL_UPLOAD_DPC_EXT (Data Provider Class – Method UPLOAD_FILE):

```abap
METHOD upload_file.
  DATA: lv_file_name TYPE string,
        lv_file TYPE xstring,
        lv_job_id TYPE string.

  lv_file_name = io_data_provider->get_property( 'Filename' ).
  lv_file = io_data_provider->get_property( 'File' ).

  "Step 1: Create Job
  DATA(lv_response) = zcl_pdf_conversion=>create_job( 'Archive PDF/A-2' ).

  lv_job_id = lv_response-jobid.

  "Step 2: Upload File to Job
  zcl_pdf_conversion=>upload_file( lv_job_id = lv_job_id
                                   iv_file_name = lv_file_name
                                   iv_file = lv_file ).

  "Step 3: Start the Job
  zcl_pdf_conversion=>start_job( lv_job_id ).

  "Return Job ID
  io_data_provider->set_property( 'JobId', lv_job_id ).
ENDMETHOD.
```

### 3. ABAP Class to Handle API Calls (ZCL_PDF_CONVERSION)

#### Class Definition (SE24):

```abap
CLASS zcl_pdf_conversion DEFINITION PUBLIC FINAL.
  PUBLIC SECTION.
    METHODS create_job
      IMPORTING iv_workflow TYPE string
      RETURNING VALUE(rv_response) TYPE string.
      
    METHODS upload_file
      IMPORTING lv_job_id TYPE string
                iv_file_name TYPE string
                iv_file TYPE xstring.

    METHODS start_job
      IMPORTING lv_job_id TYPE string.
      
    METHODS get_result
      IMPORTING lv_job_id TYPE string
      RETURNING VALUE(rv_result) TYPE xstring.
ENDCLASS.
```

#### Class Implementation:

```abap
CLASS zcl_pdf_conversion IMPLEMENTATION.

" Create Job
METHOD create_job.
  DATA: lv_url TYPE string,
        lo_http_client TYPE REF TO if_http_client,
        lv_response TYPE string.

  lv_url = '<BASE_URL>/jobs/?workflow=' && iv_workflow.

  CALL METHOD cl_http_client=>create_by_url
    EXPORTING
      url = lv_url
    IMPORTING
      client = lo_http_client.

  lo_http_client->request->set_method( 'POST' ).
  lo_http_client->request->set_header_field( name = 'Content-Type' value = 'application/json' ).

  CALL METHOD lo_http_client->send.
  CALL METHOD lo_http_client->receive.

  lv_response = lo_http_client->response->get_cdata( ).
  RETURN lv_response.
ENDMETHOD.

" Upload File to Job
METHOD upload_file.
  DATA: lv_url TYPE string.

  lv_url = '<BASE_URL>/jobs/' && lv_job_id && '/data/'.

  CALL METHOD cl_http_client=>create_by_url
    EXPORTING
      url = lv_url
    IMPORTING
      client = lo_http_client.

  lo_http_client->request->set_method( 'POST' ).
  lo_http_client->request->set_header_field( name = 'Accept' value = 'application/json' ).
  lo_http_client->request->set_file(
    data = iv_file
    filename = iv_file_name
    content_type = 'application/octet-stream' ).

  CALL METHOD lo_http_client->send.
ENDMETHOD.

" Start the Job
METHOD start_job.
  DATA: lv_url TYPE string.

  lv_url = '<BASE_URL>/jobs/' && lv_job_id && ':start'.

  CALL METHOD cl_http_client=>create_by_url
    EXPORTING
      url = lv_url
    IMPORTING
      client = lo_http_client.

  lo_http_client->request->set_method( 'POST' ).
  CALL METHOD lo_http_client->send.
ENDMETHOD.

" Retrieve Result
METHOD get_result.
  DATA: lv_url TYPE string.

  lv_url = '<BASE_URL>/jobs/' && lv_job_id && '/result/'.

  CALL METHOD cl_http_client=>create_by_url
    EXPORTING
      url = lv_url
    IMPORTING
      client = lo_http_client.

  lo_http_client->request->set_method( 'GET' ).
  CALL METHOD lo_http_client->send.
  rv_result = lo_http_client->response->get_binary( ).
ENDMETHOD.
ENDCLASS.
```

### 4. Testing and Deployment
1. Activate the ABAP OData service in /IWFND/MAINT_SERVICE.
2. Bind the service to the SAP UI5 app.
3. Users can now upload and convert documents to PDF/A directly from SAP.

### Key Considerations
- Error Handling: Implement response checks for each HTTP call.
- Security: Use OAuth2 or API key-based authentication for secure API communication.
- Logging: Log job statuses and errors to SAP application logs (SLG1).
- Batch Jobs: Implement background processing for large file conversions.


