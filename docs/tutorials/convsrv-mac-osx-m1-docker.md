---
layout: default
title: Running the Pdftools Conversion Service on MacBook with M1 Chip
products: [convsrv]
---
# Tutorial: Running the Pdftools Conversion Service on MacBook with M1 Chip

{% include conversion-service-info.html %}

{% include disclaimer.html %}

## Prerequisites
1. A MacBook with an M1 chip running macOS.
2. Docker Desktop installed and set up on your MacBook.
3. A valid license key for the Conversion Service. [Contact us](https://www.pdf-tools.com/contact/) to get one.

### Step 1: Install Docker Desktop
Docker Desktop is required to run containers on your MacBook. Follow these steps to install Docker:

1. Visit the [Docker Desktop for Mac download page](https://www.docker.com/products/docker-desktop/).
2. Download the version for macOS with Apple silicon.
3. Install Docker by following the on-screen instructions.
4. Once installed, start Docker Desktop and ensure it is running.

### Step 2: Create a `docker-compose.yml` File
The `docker-compose.yml` file defines the services needed to run the Conversion Service and the Connector Service.

1. Open the Terminal app on your MacBook.
2. Create a new directory to store the configuration files:
   ```bash
   mkdir conversion-service-setup
   cd conversion-service-setup
   ```
3. Use a text editor like `nano` or `vim` to create the `docker-compose.yml` file:
   ```bash
   nano docker-compose.yml
   ```
4. Copy and paste the following content into the file:
   ```yaml
   volumes:
       vol-conversion-srv-app-data: {}
   services:
       conversion-service:
           # Conversion Service image - Converts files to PDF format.
           image: pdftoolsag/conversion-service
           platform: linux/amd64
           environment:
               # To activate the license, pass the value of the license key.
               LICENSEKEY: <INSERT LICENSE KEY HERE>
           ports:
               # Exposes port 13033 for external communication.
               - "13033:13033"
           volumes:
               - vol-conversion-srv-app-data:/etc/convsrv
       connector-service:
           # Connector Service image:
           # Enables REST Input connectors, the REST input plain HTTP, and REST input JSON.
           image: pdftoolsag/connector-service
           platform: linux/amd64
           ports:
               # Expose port 13034 for external communication.
               - "13034:13034"
   ```
5. Save and close the file (in `nano`, press `CTRL+O` to save and `CTRL+X` to exit).

### Step 3: Start the Services
1. In the Terminal, ensure you are in the directory containing the `docker-compose.yml` file.
2. Start the services using the following command:
   ```bash
   docker-compose up
   ```
   Docker will pull the required images and start the Conversion Service and Connector Service.

### Step 4: Verify the Services
1. Open a web browser and navigate to the following URLs to ensure the services are running:
   - Conversion Service: [http://localhost:13033](http://localhost:13033)
   - Connector Service: [http://localhost:13034](http://localhost:13034)

2. If the services are running correctly, you should see confirmation responses from each service.

### Step 5: Stopping the Services
To stop the running services:
1. In the Terminal, press `CTRL+C` to stop the containers.
2. Run the following command to remove the containers:
   ```bash
   docker-compose down
   ```

## Additional Notes
- Ensure you replace `<INSERT LICENSE KEY HERE>` in the `docker-compose.yml` file with your actual license key.
- If you encounter issues running these containers on an M1 chip, Docker's `platform: linux/amd64` ensures compatibility by emulating the required architecture.

You're all set to use the Conversion Service and Connector Service on your MacBook with an M1 chip!
