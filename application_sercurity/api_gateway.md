
# API Gateway Demo Setup

Cloudflare API Gateway protects your API from malicious traffic with API Discovery, Schema Validation, mTLS validation, and more. It also helps to maintain high performing APIs with powerful monitoring and management. 

This guide shows how to set up publicly accessible API server, which can be used to test the API Gateway service.

## Prerequisites

 *  Sign up for a Cloudflare Account : `https://dash.cloudflare.com/sign-up`
 *  Register `YOUR_DOMAIN` on Cloudflare DNS
 *  Install docker: `https://www.docker.com/products/docker-desktop/` or Create a GCP account and login from the terminal: `https://cloud.google.com/sdk/docs/install`
 
We will use `Mockoon` to create our server. Mockoon is a set of free and open-source API mocking tools. (https://mockoon.com/)
The configuration of the server is all defined on the `data.json` file. (feel free to update the endpoints)

![Demo options](../../assets/api_gateway.png)

## 1. Demo Setup

```
# Go to the api-gateway folder
$ cd ./api-gateway
```

### Option 1: Expose local server via Cloudflare Tunnel

#### Create a Cloudflare Tunnel
- 1. Log into the dashboard (Zero Trust section)
- 2. Click on Access, then Tunnels
- 3. `Create Tunnel`, give it a name: `api-gateway` and Save
- 4. Select `Docker` from the available connectors and take note of the Token 

#### Run the local container
Add your token on `docker-compose.yml` (line 23) and run the docker containers (make sure Docker Desktop is launched)
```
# Run the container and test the following endpoints: http://localhost:3000/posts & http://localhost:3000/products
$ docker-compose up -d
```

#### Link to a public hostname
- 1. Return to the dashboard (your tunnel should be connecting to Cloudflare's edge.)
- 2. Configure your Tunnel
- 3. Click on `Public hostnames` then `add public hostname`
- 4. Provide the following infos:
    - Subdomain: `api`
    - Domain: Select one of your registered cloudflare domain
    - Type: `http`
    - URL: `api:3000`
- 5. Now your server is publicly accessible via `https://api.YOUR_DOMAIN`

Note: You will need to start and stop your Docker compose stack everytime you want to test your APIs

### Option 2: Deploy an API server on GCP

#### Create the container
`Option 1:` Create a new image from scratch: you can customise your API endpoints from the `data.json` file
```
# Create the Dockerfile
$ mockoon-cli dockerize --data ./data.json --port 3000 --output ./tmp/Dockerfile

# Build the image
$ cd tmp
$ docker build -t mockoon-image .

# Run the container and test the following endpoints: http://localhost:3000/posts & http://localhost:3000/products
$ docker run -d -p 3000:3000 mockoon-image
```


`Option 2:` Use an existing image from DockerHub
```
# Pull the image from an existing Docker repository
$ docker pull tmsquare/mockoon-image:latest

# Run the container and test the following endpoints: http://localhost:3000/posts & http://localhost:3000/products
$ docker run -d -p 3000:3000 tmsquare/mockoon-image
```

#### Deploy the image on GCP
```
# Authenticate and set the project ID
$ gcloud auth login
$ gcloud config set project PROJECT_ID

# Create a Docker repository in Artifact Registry
$ gcloud artifacts repositories create mockoon-docker-repo --repository-format=docker \
    --location=us-west2 --description="Mockoon Docker repository"

# Verify that the repository is created
$ gcloud artifacts repositories list

# Build an image using Dockerfile
$ cd tmp
$ gcloud builds submit --region=us-west2 --tag us-west2-docker.pkg.dev/PROJECT_ID/mockoon-docker-repo/mockoon-image:latest
```

#### Create a Cloud Run service to publicly expose the API server
```
gcloud run deploy mockoon-image	\
 --image us-west2-docker.pkg.dev/PROJECT_ID/mockoon-docker-repo/mockoon-image:latest \
 --port='3000' \
 --allow-unauthenticated
```
Wait for the deployment to finish. Upon successful completion, a success message is displayed along with the `URL` of the deployed service.


#### Create CNAME record to proxy your traffic from Cloudflare
- 1. Log into the dashboard 
- 2. Go to your zone (e.g `example.com`) and click on `DNS`
- 3. `Add record`: Type -> `CNAME` , Name: `my-api` and Target: `YOUR_CLOUD_RUN_URL` (remove the https)
- 4. Click on `Rules` (left panel) and then `Origin Rules`
- 5. `Create rule` 
    - expression: `(http.host eq "my-api.YOUR_DOMAIN")`
    - rewrite to: `YOUR_CLOUD_RUN_URL` (remove the https)
    - Deploy
- 6. Now your server is publicly accessible via `https://my-api.YOUR_DOMAIN`


## 2. Generate API traffic on your zone

### 2.1 Bypass your traffic generator requests
By default Cloudflare will block requests coming from your traffic generator as they are considered as bot traffic. That can be avoided by creating a custom WAF rule to skip those rules. 
- 1. Log into the dashboard 
- 2. Go to your zone (e.g `example.com`) and click on `Security` (left panel)
- 4. Click on `WAF`  and then `Create rule` 
    - expression: `(http.host eq "api.YOUR_DOMAIN" and ip.src eq GENERATOR_IP)`
    - action: `Skip`
    - WAF components to skip: tick all the boxes
    - Deploy

### 2.2 Set up session identifiers
While not strictly required, it is recommended that you configure your session identifiers when getting started with API Gateway. When Cloudflare inspects your API traffic for individual sessions, more visibility and management can be offered.
- 1. Log in to the Cloudflare dashboard and select your account and domain.
- 2. Go to Security > API Shield.
- 3. Select Settings.
- 4. On Endpoint settings, select Manage identifiers.
- 5. Enter the necessary information: (Name: `my-apis-session-identifier`)
- 6. Select Save.

### 2.3 Traffic generation
We will use Apache benchmark as traffic generator (https://httpd.apache.org/docs/2.4/programs/ab.html)

Open the `./traffic_generation/sequence-traffic.sh` file and edit `domain` with your current domain 
```
# Execute the following commands to generate traffic
$ chmod +x ./traffic_generation/sequence-traffic.sh
$ ./traffic_generation/sequence-traffic.sh
```

Note: You will need wait between 12 to 48 hours to see your API traffic discoverable from the Cloudflare Dashboard (API GATEWAY)

## 3. API Gateway main features (January 2024)
* `API Discovery` : Most development teams struggle to keep track of their APIs. Cloudflare API Discovery helps you map out and understand your attack surface area.

* `Volumetric Abuse Detection` : Cloudflare Volumetric Abuse Detection helps you set up a system of adaptive rate limiting.

* `Sequence Analytics` : A sequence is a time-ordered list of HTTP API requests made by a specific visitor as they browse a website, use a mobile app, or interact with a B2B partner via API. Sequence Analytics surfaces a subset of important API request sequences found in your API traffic over time.

* `Schema Validation` : Schema Validation allows you to check if incoming traffic complies with a previously supplied API schema (arget endpoint, path or query variable format, and HTTP method)

* `Sensitive Data Detection` : API Gateway can alert users to the presence of sensitive data in the response body of API endpoints listed in Endpoint Management (financial and personally identifiable information)

* `Jwt validation` : API Shield’s JWT Validation stops JWT replay attacks and JWT tampering by cryptographically verifying incoming JWTs before they are passed to your API origin. JWT Validation will also stop requests with expired tokens or tokens that are not yet valid.

* `mTLS` : Mutual TLS (mTLS) authentication uses client certificates to ensure traffic between client and server is bidirectionally secure and trusted. mTLS also allows requests that do not authenticate via an identity provider — such as Internet-of-things (IoT) devices — to demonstrate they can reach a given resource.

* `Easy Management` : On a single dashboard you can keep track of the health of your API endpoints by saving, updating, and monitoring performance metrics (total requests, error rate, latency & response size) per endpoint.

Lean more : `https://developers.cloudflare.com/api-shield/`
