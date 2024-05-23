
# Cloudflare Load Balancing

Maximize application performance and availability.

## Prerequisites

*  Sign up for a Cloudflare Account : `https://dash.cloudflare.com/sign-up`
*  Create a least two origin servers and take note of their IPs


## 1. Main Features
Cloudflare Load Balancing distributes traffic across your servers, which reduces server strain and latency and improves the experience for end users.

* `Load balancing and failover`: Distribute traffic evenly across your healthy servers, automatically failing over when a server is unhealthy or unresponsive.
* `​​Active monitoring`:  Monitor your servers at configurable intervals and across multiple data centers to look for specific status codes, response text, and timeouts.
* `Intelligent routing`: Choose whether to distribute requests based on server latency, a visitor’s geographic region, or even a visitor’s GPS coordinates.
* `Custom rules`: Customize the behavior of your load balancer based on the characteristics of individual requests.
* `Analytics`: Review comprehensive analytics to evaluate traffic flow, assess origin health status, and review changes in pools and pool health over time.

## 2. Global Network and Steering Policies
### 2.1 Global Network
By using Cloudflare Load Balancing, you can also benefit from a big range or security and performance services (WAF, CDN, DDoS, etc) in a single and unified platform
![Primary DNS](../assets/load_balancing.png)

### 2.2 Steering Policies
* Traffic steering (between mutliple pools)
     * Standard: route pools in failover order
     * Geo: route to specific pools based on the Cloudflare region serving the request
     * Dynamic: route traffic to the fastest pool based on measured latency from health checks
     * Proximity: route requests to the closest physical pool
     * Least Outstanding Request: route traffic based on pool weights and number of pending requests


* Origin steering (between mutliple origins within a pool)
    * Random: send requests to origins purely based on origin weights
    * Hash: send requests to origins based on a combination of origin weights and previous requests from that IP address
    * Least Outstanding Request: send traffic to origins that currently have the fewest number of outstanding requests

## 3. Getting started (code in construction...)

Go back to the parent folder of this github repository, edit the `main.py` file with the following code:
```
# Load Balancer example
lb = Client(scope="load_balancer").get()
us_server = "0.0.0.0",
eu_server = "0.0.0.0"
lb_name   = "app" 
domain    = "YOUR_DOMAIN.com"

# Create two Monitors
monitor1_data = {
    "expected_codes" : '2xx', 
    "description"    : 'US Pool Monitor test',
    "type"           : 'http',
    "port"           : '80',
    "interval"       : '60',
    "timeout"        : '5',
    "retries"        : '2',
}
monitor2_data = {
    "expected_codes" : '2xx', 
    "description"    : 'EU Pool Monitor test',
    "type"           : 'http',
    "port"           : '80',
    "interval"       : '60',
    "timeout"        : '5',
    "retries"        : '2',
}
monitor1 = lb.create_monitor(data=monitor1_data)
monitor2 = lb.create_monitor(data=monitor2_data)


# Create two Pools
pool1_data = {
    "name"           : "primary-us-1",
    "description"    : "Primary US Pool",
    "check_regions"  : ["ALL_REGIONS"],
    "monitor"        : monitor1.id,
    "origin_steering": {
        "policy": "random"
    },
    "origins"        : [
        {
            "address": us_server,
            "name": "app-server-1"
        }
    ]
}
pool2_data = {
    "name"           : "primary-eu-1",
    "description"    : "Primary EU Pool",
    "check_regions"  : ["ALL_REGIONS"],
    "monitor"        : monitor2.id,
    "origin_steering": {
        "policy": "random"
    },
    "origins"        : [
        {
            "address": eu_server,
            "name": "app-server-1"
        }
    ]
}
pool1 = lb.create_pool(data=pool1_data)
pool2 = lb.create_pool(data=pool2_data)

 
# Create a Load Balancer
lb_data = {
    "name"           : lb_name,
    "description"    : f'Load Balancer for www.{domain}',
    "default_pools"  : [
        pool1.id,
        pool2.id,
    ], 
    "fallback_pool"  : 'null',
    "steering_policy": "dynamic_latency",
}
my_lb = lb.create_load_balancer(zone_name=domain, data=lb_data)
```

Export your credentials and execute the script:
```
$ export CF_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
$ export CF_EMAIL="xxxxxx@xyz.yz"

python3 main.py
```

Your load balancer is now accessible via `app.YOUR_DOMAIN.com`

US requests will be routed to the US Poll and likewise for the EU requests 