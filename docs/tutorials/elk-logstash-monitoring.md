---
layout: default
title: Monitoring Conversion Service with ELK Logstash
products: [convsrv]
---

# Monitoring Pdftools Conversion Service Logs with ELK Stack

{% include conversion-service-info.html %}

{% include disclaimer.html %}

## Introduction

This tutorial guides you through the process of integrating the Elastic Search ELK stack to monitor logs from the Pdftools Conversion Service. It includes a quick setup for immediate use and a more detailed example tailored to the structure of Conversion Service logs.

## Prerequisites

- **ELK Stack**: Ensure that Elasticsearch, Logstash, and Kibana are installed and running. [ELK Stack Quickstart Guide](https://www.elastic.co/guide/en/elastic-stack-get-started/current/get-started-elastic-stack.html)
- **Basic Knowledge**: Familiarity with the ELK stack and Conversion Service.
- **Access**: Ensure access to the Conversion Service log files (or Docker container logs).

## Quick Start Example

### Step 1: Collect Logs from Conversion Service

#### Windows
```shell
# Example log location
C:\Program Files\Pdftools\ConversionService\Logs\ConversionService-Service.log
```

#### Docker
```shell
# Example log command
sudo docker exec <container_name> tail -f /var/log/convsrv/ConversionService-Service.log
```

### Step 2: Configure Logstash to Parse Conversion Service Logs

Create a Logstash configuration file `conversion-service-logstash.conf`:

```json
input {
  file {
    path => "/path/to/ConversionService-Service.log"
    start_position => "beginning"
    sincedb_path => "/dev/null"
  }
}

filter {
  csv {
    separator => ","
    columns => ["Timestamp", "Level", "ProcessName", "Message", "Exception", "JobID", "TaskID", "RemoteID"]
  }
  mutate {
    convert => { "Level" => "string" }
  }
}

output {
  elasticsearch {
    hosts => ["http://localhost:9200"]
    index => "conversion-service-logs"
  }
  stdout {
    codec => rubydebug
  }
}
```

### Step 3: Start Logstash
Run Logstash with the above configuration:

```shell
bin/logstash -f conversion-service-logstash.conf
```

### Step 4: Visualize Logs in Kibana

1. Open Kibana.
2. Create an index pattern for `conversion-service-logs`.
3. Visualize logs using Kibana dashboards (e.g., filter by `Level` to view `ERROR` or `FATAL` messages).

---

## Detailed Example: Leveraging Conversion Service Log Structure

The Conversion Service logs includes multiple properties such as `Timestamp`, `Level`, `ProcessName`, `Message`, `Exception`, `JobID`, `TaskID`, and `RemoteID` - see <a href="https://www.pdftools.com/docs/conversion-service/monitor/service-log/#log-properties">Conversion Service Log Properties</a>. These can be used to filter and visualize logs in Kibana.

### Enhanced Logstash Configuration

For structured parsing and advanced use, include additional processing in your Logstash configuration:

```json
filter {
  csv {
    separator => ","
    columns => ["Timestamp", "Level", "ProcessName", "Message", "Exception", "JobID", "TaskID", "RemoteID"]
  }

  if [Level] == "ERROR" or [Level] == "FATAL" {
    mutate {
      add_field => { "alert" => "Critical issue detected" }
    }
  }

  date {
    match => ["Timestamp", "yyyy-MM-dd HH:mm:ss"]
  }
}
```

### Advanced Visualization in Kibana

For creating more advanced visualizations in Kibana, refer to [Kibana Guide on Visualizations](https://www.elastic.co/guide/en/kibana/current/dashboard.html).

1. **Custom Dashboard**:
   - Create a heatmap showing error frequency over time.
   - Add pie charts to show log distribution by `ProcessName`.

2. **Alerts**:
   - Set alerts for `ERROR` or `FATAL` messages using Kibana's alerting feature.

3. **Detailed Steps for Advanced Visualization**:
   - Use the Kibana Lens feature to create a time-series visualization of error logs.
   - Combine filters to focus on critical severities like `ERROR` and `FATAL`.

### Example for Debugging Specific Job

A "job" is a task submitted to the Conversion Service which can contain one or more files. When jobs are submitted to the Conversion Service, the logs will look something like this:

```log
2024-12-11 16:40:53 2024-12-11 15:40:53.0595,INFO,job3_ekdh4fjuwiv,"Added file ""example.webp"" (id ""2dffplrzb0r-0-vyrbh5cy24q"") to job ""job3_ekdh4fjuwiv""",,::ffff:172.19.0.3
2024-12-11 16:40:53 2024-12-11 15:40:53.0668,INFO,job3_ekdh4fjuwiv,"Starting job ""job3_ekdh4fjuwiv""",,::ffff:172.19.0.3
2024-12-11 16:40:53 2024-12-11 15:40:53.6953,INFO,job3_ekdh4fjuwiv,"Job ""job3_ekdh4fjuwiv"" has finished",,::ffff:172.19.0.3
```

This means you can use a query like the following to find all logs related to a specific `JobID`:
```shell
GET /conversion-service-logs/_search
{
  "query": {
    "match": {
      "JobID": "12345"
    }
  }
}
```

Similar tracking can be done using the REST endpoint for the Conversion Service - "<a href="https://www.pdftools.com/docs/conversion-service/api/advanced-api/get-job-info/">Get Job Info</a>" although this only shows the _current_ status of the job.