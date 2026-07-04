"""Cloudflare DNS + Pages custom domain for the static Tigers & Goats site.

The Pages project itself is created and deployed with wrangler; this stack only
defines the DNS record and attaches the custom domain to the project. The
`tomv.uk` zone is managed by another stack, so it is looked up read-only here.

Auth: set `CLOUDFLARE_API_TOKEN` (with Zone:Read, DNS:Edit, and Pages:Edit) in
the environment — the cloudflare provider reads it automatically.
"""

import pulumi
import pulumi_cloudflare as cloudflare

config = pulumi.Config()
account_id = config.require("cloudflareAccountId")
zone_name = config.get("zoneName") or "tomv.uk"
subdomain = config.get("subdomain") or "tigergoat"
pages_project = config.get("pagesProject") or "tigergoat"

fqdn = f"{subdomain}.{zone_name}"
zone = cloudflare.get_zone(name=zone_name)

# tigergoat.tomv.uk -> the Pages project. Proxied so Cloudflare serves it and
# provisions the edge certificate (a proxied record must use ttl=1).
record = cloudflare.Record(
    "pages-cname",
    zone_id=zone.zone_id,
    name=subdomain,
    type="CNAME",
    content=f"{pages_project}.pages.dev",
    proxied=True,
    ttl=1,
)

# Register the custom domain on the Pages project (certificate + routing).
domain = cloudflare.PagesDomain(
    "pages-domain",
    account_id=account_id,
    project_name=pages_project,
    domain=fqdn,
    opts=pulumi.ResourceOptions(depends_on=[record]),
)

pulumi.export("fqdn", fqdn)
pulumi.export("pages_dev", f"{pages_project}.pages.dev")
pulumi.export("dns_record", record.hostname)
