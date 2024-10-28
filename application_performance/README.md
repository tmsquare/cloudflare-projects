# Cloudflare Performance

Cloudflare Performance Services accelerate applications, improve mobile delivery, and ensure availability for Internet properties.

## 1. Challenges & Solutions

### 1.1 Challenges
 - **Accelerate Internet Applications**: Heavy pages and long distance from the origin slow down webpages, applications and APIs.
 - **Accelerate Mobile Experiences**: Mobile clients introduce performance and content delivery constraints (image size, webpage rendering, etc) which hurt user experiences. 
 - **Ensure Application Availability**: Overloaded or unavailable infrastructure prevents users from accessing applications.

### 1.2 Solutions
- Deliver fast Internet applications regardless of distance to origin servers, device types, or network health. 
- Deliver fast mobile experiences with optimized resource rendering that increase engagement and conversions.
- Keep Internet available and scalable, even during unexpected traffic spikes or infrastructure outages.

## 2. Cloudflare Services

### 2.1 DNS
- **Technology**: 
  - When trying to load a website, you type its `domain` (e.g. `apple.com`) and DNS is what happens behind (without you even knowing) to translate that domain to the `IP address` of the server hosting that website. 
  - That process is called `DNS lookup`. Just keep in mind that computers can communicate to each other over the Internet through their public IPs.
- **Challenges**:
    - `DNS lookup` should be lightning fast, consequently leading to faster load time of the website
    - `Authoritative DNS servers` should be highly available and globally distributed
    - It should also come with a built-in security 
- **Service Features**
    * `Optimal Redundancy`: global Anycast network that allows DNS resolution at the network edge in each of their data centers across 320+ cities.
    * `Security`:  built-in DDoS protection and one-click DNSSEC to ensure your applications are always safeguarded from DNS attacks.
    * `Performance`: fastest DNS in the world, offering DNS lookup speed of 11ms on average and worldwide DNS propagation in less than five seconds.
    * `Easy management`: user-friendly interfaces and access via API

### 2.2 CDN
- **Technology**: 
  - When loading a single web page, a bunch of subsquent requests are also sent from the browser to your origin server to get `static assets` (images, videos, css & js files). Those requests are sent either under mulitiple HTTP connections (HTTP/1) either under a single HTTP connection (HTTP2/3). Fecthing those `assets` from a remote origin can  overwhelm the server and have an impact on the page's load time. 
  - `CDN (Content Delivery Network)` comes to rescue by storing (caching) static assets of a webpage on a distributed "cluster" of machines around many locations of the world, closer to the users. Helping to improve long wait times and reduce the load on the server. 
- **Challenges**
- **Service Features**

### 2.3 Tiered Cache & Cache Reserve
- **Technology**
- **Challenges**
- **Service Features**

### 2.4 Argo Smart Routing
- **Technology**
- **Challenges**
- **Service Features**

### 2.5 Load Balancing
- **Technology**
- **Challenges**
- **Service Features**

### 2.6 Web Optimization
- **Technology**
- **Challenges**
- **Service Features**

### 2.7 Video Stream Delivery
- **Technology**
- **Challenges**
- **Service Features**

### 2.8 Waiting Room
- **Technology**
- **Challenges**
- **Service Features**

### 2.9 Zaraz
- **Technology**
- **Challenges**
- **Service Features**

### 2.10 Analytics
- **Technology**
- **Challenges**
- **Service Features**