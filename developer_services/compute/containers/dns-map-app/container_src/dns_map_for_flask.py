import re, requests, os
from typing import List, Tuple, Optional, Dict, Any
from collections import Counter, defaultdict
import dns.resolver
import dns.exception
import logging
import ipaddress
import json
import time
from ipwhois import IPWhois
from ipwhois.exceptions import IPDefinedError, HTTPLookupError, ASNRegistryError

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('DNS_MAP')

class DNS_MAP:
    """
    A class to map DNS information for a given apex domain, including
    DNS providers (NS records), Email hosting (MX records), IT workload hosting (A records),
    and special subdomains (API, Zero Trust).
    """

    def __init__(self, **kwargs):
        """
        Initialize the DNS_MAP class.
        
        Args:
            apex_domain (str): The apex domain to analyze (e.g., example.com)
            security_trails_api_keys (List[str], optional): List of API keys for Security Trails
        """
        self.a_records = []
        self.ns_records = []
        self.mx_records = []
        self.apex_domain = kwargs.get('apex_domain', '')
        self.security_trails_api_keys = kwargs.get('security_trails_api_keys', [])
        self.security_trails_error = None
        
        # Validate the apex domain
        if not self._validate_apex_domain(self.apex_domain):
            raise ValueError(f"Invalid apex domain format: {self.apex_domain}")
            
        logger.info(f"Initializing DNS_MAP for domain: {self.apex_domain}")

        # DNS provider mapping dictionary
        self.mapped_DNS_providers = {
            "CLOUDFLARENET": "Cloudflare",
            "AMAZON-02": "Route53",
            "AMAZON-AES": "Route53",
            "SECURITYSERVICES": "UltraDNS",
            "DIGITALOCEAN-ASN": "DigitalOcean",
            "DNSIMPLE": "dnsimple",
            "MICROSOFT-CORP-MSN-AS-BLOCK": "Azure",
            "NSONE": "NS1",
            "AKAMAI-ASN2": "Akamai",
            "GODADDY-DNS": "GoDaddy",
            "GOOGLE": "Google",
            "EDGECAST": "Edgecast",
            "RACKSPACE-LON": "Rackspace",
            "RMH-14": "Rackspace",
            "RACKSPACE": "Rackspace",
            "LUMEN-LEGACY-L3-": "Lumen Technologies",
            "DEFENSE-NET": "Defense.Net (F5)",
            "EDNS": "EasyDNS",
            "RCODEZERO-ANYCAST-SEC1-TLD RcodeZero Anycast DNS": "RcodeZero",
            "RCODEZERO-ANYCAST-SEC2 RcodeZero Anycast DNS": "RcodeZero",
            "TIGEE" : "DNSMadeEasy"
        }
        
        # Email hosting provider mapping
        self.email_providers = {
            "google": "Google Workspace",
            "googlemail": "Google Workspace",
            "gmail": "Google Workspace",
            "outlook": "Microsoft 365",
            "hotmail": "Microsoft 365",
            "office365": "Microsoft 365",
            "microsoft": "Microsoft 365",
            "live.com": "Microsoft 365",
            "mimecast": "Mimecast",
            "proofpoint": "Proofpoint",
            "pphosted": "Proofpoint",
            "protection.outlook.com": "Microsoft 365",
            "mx.protection.outlook.com": "Microsoft 365",
            "messagelabs": "Symantec",
            "zoho": "Zoho Mail",
            "amazonses": "Amazon SES",
            "mailgun": "Mailgun",
            "sendgrid": "SendGrid",
            "postmarkapp": "Postmark",
            "aspmx.l.google.com": "Google Workspace",
            "mx.yandex": "Yandex Mail",
            "mail.ru": "Mail.ru",
            "yahoodns": "Yahoo Mail",
            "mx.mail.yahoo.com": "Yahoo Mail",
            "mx1.ovh": "OVH",
            "gmx": "GMX",
            "mailhostbox": "Hostbox",
            "mx.zoho": "Zoho Mail",
            "barracuda": "Barracuda",
            "spamexperts": "SpamExperts",
            "kaspersky": "Kaspersky",
            "hostedemail": "Rackspace Email",
            "exchangelabs": "Microsoft 365",
            "emailsrvr": "Rackspace Email",
            "mxroute": "MXroute",
            "fastmail": "FastMail"
        }

    def _validate_apex_domain(self, domain: str) -> bool:
        """
        Validate that the input is a proper apex domain format (e.g., example.com).
        
        Args:
            domain (str): The domain to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not domain:
            return False
            
        # Basic regex for domain validation
        pattern = r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}'
        
        # Make sure it's not starting with www or other subdomains
        if domain.startswith('www.'):
            return False
            
        return bool(re.match(pattern, domain))

    def get_all_subdomains(self) -> Tuple[List[str], List[str], List[str], List[str], List[str], List[str]]:
        """
        Get subdomains from Security Trails API.
        
        Returns:
            Tuple of lists containing different types of subdomains:
            (secure_subdomains, access_subdomains, remote_subdomains, api_subdomains, vpn_subdomains, all_subdomains)
        """
        logger.info(f"Fetching subdomains for {self.apex_domain} from Security Trails API")
        
        if not self.security_trails_api_keys:
            logger.warning("No Security Trails API keys provided")
            self.security_trails_error = "No Security Trails API keys provided"
            # If no API keys, create some basic subdomain entries for the main domain
            all_subdomains = [self.apex_domain, f"www.{self.apex_domain}", f"mail.{self.apex_domain}"]
            return [], [], [], [], [], all_subdomains
        
        # Try each API key in sequence
        for i, api_key in enumerate(self.security_trails_api_keys):
            try:
                logger.info(f"Trying Security Trails API key {i+1}/{len(self.security_trails_api_keys)}")
                
                # API endpoint
                url = f"https://api.securitytrails.com/v1/domain/{self.apex_domain}/subdomains?children_only=false"
                
                # Set headers with API key
                headers = {
                    "accept": "application/json", 
                    "apikey": api_key
                }
                
                # Make the API request
                response = requests.get(url, headers=headers)
                
                # Check if the request was successful
                if response.status_code == 200:
                    # Parse JSON response
                    data = response.json()
                    
                    # Extract subdomains
                    subdomain_list = data.get('subdomains', [])
                    
                    # Convert to fully qualified domain names
                    all_subdomains = [f"{s}.{self.apex_domain}" for s in subdomain_list]
                    
                    # Filter for special subdomain types
                    secure_subdomains = [s for s in all_subdomains if any(keyword in s.lower() for keyword in ["secure"])]
                    access_subdomains = [s for s in all_subdomains if any(keyword in s.lower() for keyword in ["access"])]
                    remote_subdomains = [s for s in all_subdomains if any(keyword in s.lower() for keyword in ["remote"])]
                    
                    # For API subdomains, exclude some false positives
                    api_subdomains_raw = [s for s in all_subdomains if any(keyword in s.lower() for keyword in ["api"])]
                    api_subdomains = [s for s in api_subdomains_raw if "capital" not in s.lower() and "rapid" not in s.lower() and "capitol" not in s.lower()]
                    
                    vpn_subdomains = [s for s in all_subdomains if any(keyword in s.lower() for keyword in ["vpn"])]
                    
                    logger.info(f"Found {len(all_subdomains)} subdomains for {self.apex_domain}")
                    
                    return secure_subdomains, access_subdomains, remote_subdomains, api_subdomains, vpn_subdomains, all_subdomains
                
                # Handle specific error codes
                elif response.status_code == 401:
                    # Authentication error - try next API key
                    logger.warning(f"API key {i+1} unauthorized, trying next key if available")
                    continue
                    
                elif response.status_code == 429:
                    # Rate limit exceeded - try next API key
                    logger.warning(f"API key {i+1} rate limit exceeded, trying next key if available")
                    continue
                    
                else:
                    # Other error - log and try next key
                    logger.warning(f"API key {i+1} returned status code {response.status_code}: {response.text}")
                    continue
                    
            except Exception as e:
                # Exception with this API key - try next one
                logger.warning(f"Error with API key {i+1}: {str(e)}")
                continue
        
        # If we've tried all keys without success, report the error
        error_msg = "All Security Trails API keys failed. Please check your API keys and try again."
        logger.error(error_msg)
        self.security_trails_error = error_msg
        
        # If all API calls fail, create some basic subdomain entries for the main domain
        all_subdomains = [self.apex_domain, f"www.{self.apex_domain}", f"mail.{self.apex_domain}"]
        return [], [], [], [], [], all_subdomains

    def dns_map(self) -> Tuple[List[str], List[str], List[str], List[str], List[str], List[str], List[str], List[str], List[str], Optional[str]]:
        """
        Generate a comprehensive DNS map for the apex domain.
        
        Returns:
            Tuple containing:
            (mapped_dns_hosts, mx_records, a_records, secure_subdomains, access_subdomains, 
             remote_subdomains, api_subdomains, vpn_subdomains, all_subdomains, security_trails_error)
        """
        logger.info(f"Generating DNS map for {self.apex_domain}")
        
        try:
            # Get subdomains
            secure_subdomains, access_subdomains, remote_subdomains, api_subdomains, vpn_subdomains, all_subdomains = self.get_all_subdomains()
            
            # Parse NS & MX records
            self.mx_records, self.ns_records = self._get_dns_records()
            
            # Parse A records by digging all subdomains
            company_to_ips = self._dig_all_subdomains(all_subdomains)
            
            # Transform company-to-IPs mapping into formatted A records
            self.a_records = self._format_company_ips(company_to_ips)
            
            # Map DNS providers
            mapped_dns_hosts = self._map_dns_providers()
            
            # Map email providers
            self.mx_records = self._map_email_providers(self.mx_records)
            
            return (
                mapped_dns_hosts,
                self.mx_records,
                self.a_records,
                secure_subdomains, 
                access_subdomains, 
                remote_subdomains, 
                api_subdomains, 
                vpn_subdomains, 
                all_subdomains,
                self.security_trails_error
            )
            
        except Exception as e:
            logger.error(f"Error generating DNS map: {str(e)}")
            raise RuntimeError(f"Failed to generate DNS map: {str(e)}")

    def _get_dns_records(self) -> Tuple[List[str], List[str]]:
        """
        Get MX and NS records for the domain.
        
        Returns:
            Tuple of (mx_records, ns_records)
        """
        logger.info(f"Fetching MX and NS records for {self.apex_domain}")
        
        mx_records = []
        ns_records = []
        
        try:
            # Get MX records
            try:
                mx_answers = dns.resolver.resolve(self.apex_domain, 'MX')
                for rdata in mx_answers:
                    priority = rdata.preference
                    exchange = rdata.exchange.to_text().rstrip('.')
                    mx_records.append(f"Priority: {priority}, Server: {exchange}")
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.DNSException) as e:
                logger.warning(f"No MX records found for {self.apex_domain}: {str(e)}")
            
            # Get NS records
            try:
                ns_answers = dns.resolver.resolve(self.apex_domain, 'NS')
                for rdata in ns_answers:
                    ns_server = rdata.to_text().rstrip('.')
                    ns_records.append(f"Name Server: {ns_server}")
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.DNSException) as e:
                logger.warning(f"No NS records found for {self.apex_domain}: {str(e)}")
                
            return mx_records, ns_records
            
        except Exception as e:
            logger.error(f"Error getting DNS records: {str(e)}")
            return [], []

    def _map_email_providers(self, mx_records: List[str]) -> List[str]:
        """
        Map MX records to email providers, returning only provider names.
        
        Args:
            mx_records (List[str]): List of MX records
            
        Returns:
            List[str]: List of email provider names
        """
        providers = set()
        
        for record in mx_records:
            provider_found = False
            
            # Check if the record matches any known email provider
            for provider_key, provider_name in self.email_providers.items():
                if provider_key.lower() in record.lower():
                    providers.add(provider_name)
                    provider_found = True
                    break
            
            # If no provider match found, add generic provider
            if not provider_found:
                providers.add("Custom Email Server")
        
        # Convert set to list
        provider_list = list(providers)
        
        # If no providers found, return empty list
        if not provider_list:
            return []
            
        return provider_list

    def _dig_ip(self, subdomain: str) -> Tuple[Optional[str], str]:
        """
        Use dnspython to resolve the IP address for a subdomain.
        Completely replaced the 'dig' command with pure Python implementation.
        
        Args:
            subdomain (str): The subdomain to query
            
        Returns:
            Tuple[Optional[str], str]: The IP address if found and the full output
        """
        try:
            # Configure resolver with longer timeout
            resolver = dns.resolver.Resolver()
            resolver.timeout = 10
            resolver.lifetime = 10
            
            answers = resolver.resolve(subdomain, 'A')
            dns_python_output = []
            
            # Get the first IP address (we can only return one)
            for rdata in answers:
                ip = rdata.address
                dns_python_output.append(f"dnspython: {ip}")
                # Return the first IP address and the full output
                return ip, "\n".join(dns_python_output)
                
            return None, "No results found"
            
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN) as e:
            return None, f"DNS resolution error: {str(e)}"
        except dns.exception.DNSException as e:
            return None, f"DNS exception: {str(e)}"
        except Exception as e:
            return None, f"Error resolving {subdomain}: {str(e)}"

    def _dig_all_subdomains(self, subdomains: List[str]) -> Dict[str, List[str]]:
        """
        Resolve all subdomains to get IPs and organize by company.
        
        Args:
            subdomains (List[str]): List of subdomains to resolve
            
        Returns:
            Dict[str, List[str]]: A mapping of company names to lists of IP addresses
        """
        total_subdomains = len(subdomains)
        logger.info(f"Resolving {total_subdomains} subdomains for IP information. This may take some time.")
        
        # Dictionary to store company -> IPs mapping
        company_to_ips = defaultdict(list)
        
        # Initialize progress tracking dictionary
        progress = {
            'total': total_subdomains,
            'current': 0,
            'percent': 0,
            'status': 'Starting DNS lookups...',
            'last_domain': '',
            'companies_found': 0,
        }
        
        # Save initial progress to a file for UI to read
        self._save_progress(progress)
        
        # Process all subdomains without limitation
        for i, subdomain in enumerate(subdomains):
            try:
                # Update progress
                progress['current'] = i + 1
                progress['percent'] = round((i + 1) / total_subdomains * 100, 1)
                progress['last_domain'] = subdomain
                progress['status'] = f"Resolving {i+1}/{total_subdomains} ({progress['percent']}%)"
                
                # Get IP address and full dig output for subdomain
                ip, resolution_output = self._dig_ip(subdomain)
                
                
                if ip:
                    # Get company name for this IP
                    company = self._get_organization_for_ip(ip)
                    
                    
                    # Add IP to the company's list
                    company_to_ips[company].append(ip)
                    
                    # Update companies found count
                    progress['companies_found'] = len(company_to_ips)
                    
                    # Update progress with latest company found
                    if i % 5 == 0 or i == total_subdomains - 1:
                        progress['status'] = f"Resolving {i+1}/{total_subdomains} ({progress['percent']}%) - Found {company}"
                        logger.info(progress['status'])
                        self._save_progress(progress)
                else:
                    # Update progress periodically even if no IP found
                    if i % 5 == 0 or i == total_subdomains - 1:
                        logger.info(progress['status'])
                        self._save_progress(progress)
                
            except Exception as e:
                logger.warning(f"Error resolving subdomain {subdomain}: {str(e)}")
                # Log the error
                self._save_progress(progress)
                continue
        
        # Final progress update
        progress['status'] = f"Completed resolving {total_subdomains} subdomains. Found {len(company_to_ips)} companies."
        progress['percent'] = 100
        self._save_progress(progress)
                
        logger.info(f"Found IPs belonging to {len(company_to_ips)} different companies")
        return company_to_ips

    def _get_organization_for_ip(self, ip: str) -> str:
        """
        Get organization information for an IP address using ipwhois library.
        Completely replaced the 'whois' command with pure Python implementation.
        
        Args:
            ip (str): The IP address
            
        Returns:
            str: The organization name or "Unknown Company"
        """
        try:
            # Validate IP address format
            ipaddress.ip_address(ip)
            
            # Define a list of common hosting providers for backup matching
            hosting_providers = {
                "amazon": "Amazon AWS",
                "aws": "Amazon AWS",
                "amazon web services": "Amazon AWS",
                "azure": "Microsoft Azure",
                "microsoft": "Microsoft",
                "google": "Google Cloud",
                "googlecloud": "Google Cloud",
                "cloudflare": "Cloudflare",
                "digitalocean": "DigitalOcean",
                "linode": "Linode",
                "ovh": "OVH",
                "rackspace": "Rackspace",
                "vultr": "Vultr",
                "hetzner": "Hetzner",
                "godaddy": "GoDaddy",
                "hostgator": "HostGator",
                "namecheap": "Namecheap",
                "gandi": "Gandi",
                "ionos": "IONOS",
                "dreamhost": "DreamHost",
                "bluehost": "Bluehost"
            }
            
            # Use IPWhois to get organization information
            try:
                obj = IPWhois(ip)
                results = obj.lookup_rdap(depth=1, retry_count=2, asn_methods=['whois', 'http'])
                
                # Try to extract organization name from different fields
                if results.get('network', {}).get('name'):
                    return results['network']['name']
                elif results.get('asn_description'):
                    return results['asn_description']
                elif results.get('network', {}).get('remarks'):
                    remarks = ' '.join(results['network']['remarks'])
                    for provider, name in hosting_providers.items():
                        if provider.lower() in remarks.lower():
                            return name
                    return remarks[:50]  # Truncate to 50 chars if too long
                elif results.get('objects'):
                    # Try to extract from objects
                    for obj_key, obj_data in results['objects'].items():
                        if obj_data.get('contact', {}).get('name'):
                            return obj_data['contact']['name']
                
                # Fall back to ASN information
                if results.get('asn_registry') and results.get('asn'):
                    return f"{results['asn_registry']} ASN {results['asn']}"
                
                # Check if any common provider is in the raw results
                raw_data = str(results)
                for provider, name in hosting_providers.items():
                    if provider.lower() in raw_data.lower():
                        return name
                
                return "Unknown Company"
                
            except (IPDefinedError, HTTPLookupError, ASNRegistryError) as e:
                # If IPWhois lookup fails, try to extract common hosting provider from error message
                error_str = str(e)
                for provider, name in hosting_providers.items():
                    if provider.lower() in error_str.lower():
                        return name
                
                # Try a fallback approach just based on IP range
                if ip.startswith('13.') or ip.startswith('52.') or ip.startswith('54.'):
                    return "Amazon AWS"
                elif ip.startswith('35.') or ip.startswith('34.'):
                    return "Google Cloud"
                elif ip.startswith('40.') or ip.startswith('20.'):
                    return "Microsoft Azure"
                elif ip.startswith('104.16.') or ip.startswith('104.17.'):
                    return "Cloudflare"
                
                return "Unknown Company"
                
        except ValueError:
            return "Invalid IP Format"
        except Exception as e:
            logger.error(f"Error getting organization for IP {ip}: {str(e)}")
            return "Error in IP Lookup"

    def _format_company_ips(self, company_to_ips: Dict[str, List[str]]) -> List[str]:
        """
        Format the company-to-IPs mapping into readable A records.
        
        Args:
            company_to_ips (Dict[str, List[str]]): Mapping of companies to IP lists
            
        Returns:
            List[str]: Formatted A records
        """
        formatted_records = []
        
        for company, ips in company_to_ips.items():
            # Count unique IPs
            ip_count = len(set(ips))
            
            # Format the record
            record = f"{company}: {ip_count} IP(s) found"
            formatted_records.append(record)
            
        return formatted_records

    def _map_dns_providers(self) -> List[str]:
        """
        Map NS records to DNS providers.
        
        Returns:
            List[str]: Mapped DNS providers
        """
        dns_hosts = set()
        
        for record in self.ns_records:
            parts = record.split(":")
            if len(parts) > 1:
                server = parts[1].strip()
                
                # First check for exact matches in our mapping dictionary
                for key, provider in self.mapped_DNS_providers.items():
                    if key in server.upper():
                        dns_hosts.add(provider)
                        break
                else:
                    # If no exact match, check for common DNS providers in the server name
                    common_providers = {
                        "cloudflare": "Cloudflare",
                        "awsdns": "Amazon Route53",
                        "amazon": "Amazon Route53",
                        "azure": "Microsoft Azure",
                        "microsoft": "Microsoft Azure",
                        "google": "Google Cloud DNS",
                        "googledomains": "Google Domains",
                        "godaddy": "GoDaddy",
                        "domaincontrol": "GoDaddy",
                        "ns1": "NS1",
                        "ns2": "NS1",
                        "dnsmadeeasy": "DNS Made Easy",
                        "dnsimple": "DNSimple",
                        "cloudns": "ClouDNS",
                        "namecheap": "Namecheap",
                        "hostgator": "HostGator",
                        "digitalocean": "DigitalOcean",
                        "linode": "Linode",
                        "dyn": "Oracle Dyn",
                        "nsone": "NS1",
                        "akamai": "Akamai",
                        "ultradns": "UltraDNS",
                        "rackspace": "Rackspace",
                        "zonomi": "Zonomi",
                        "easydns": "EasyDNS",
                        "hover": "Hover",
                        "rage4": "Rage4",
                        "constellix": "Constellix",
                        "rcodezero": "RcodeZero"
                    }
                    
                    for provider_key, provider_name in common_providers.items():
                        if provider_key.lower() in server.lower():
                            dns_hosts.add(provider_name)
                            break
                    else:
                        # If still no match, use the server domain
                        dns_hosts.add(server.split()[0])
                    
        return list(dns_hosts)
        
    def _save_progress(self, progress: Dict[str, Any]) -> None:
        """
        Save progress information to a temporary file for the UI to read.
        
        Args:
            progress (Dict): Dictionary containing progress information
        """
        try:
            # Create a temporary directory if it doesn't exist
            os.makedirs('temp', exist_ok=True)
            
            # Save progress to a JSON file
            with open(f'temp/progress_{self.apex_domain}.json', 'w') as f:
                json.dump(progress, f)
                
        except Exception as e:
            logger.warning(f"Error saving progress: {str(e)}")
            pass