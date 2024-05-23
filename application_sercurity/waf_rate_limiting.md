
# WAF & Rate_L Demo setup

Get automatic protection from vulnerabilities and the flexibility to create custom rules.

## Prerequisites

 *  Sign up for a Cloudflare Account : `https://dash.cloudflare.com/sign-up`
 *  Register `YOUR_DOMAIN` on Cloudflare DNS


## 1. Main Features
Cloudflare WAF protection is set up with just a few simple clicks. Nothing to deploy, no weeks-long training or professional services expenses. You have a single control pane to easily manage it all.

* `Cloudflare managed rules` offer advanced zero-day vulnerability protections.
* `Core OWASP rules` block familiar “Top 10” attack techniques.
* `Custom rulesets` deliver tailored protections to block any threat.
* `WAF Machine Learning` complements WAF rulesets by detecting bypasses and attack variations of RCE, XSS and SQLi attacks.
* `Exposed credential checks`monitor and block use of stolen/exposed credentials for account takeover. 
* `Sensitive data detection` alerts on responses containing sensitive data.
* `Advanced rate limiting` prevents abuse, DDoS, brute force attempts along with API-centric controls.
* `Flexible response options` allow for blocking, logging, rate limiting or challenging.


## 2. Get starting with WAF (in construction)

Custom rules (block req from your country)
```
curl https://YOUR_DOMAIN
```
WAF scores
```
cd ./waf_rl
python3 waf_attack_tests.py
```

Rate limiting rule (block 5min if requests > 100req / 1min)
```
ab -n 500 https://YOUR_DOMAIN
```