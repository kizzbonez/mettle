# Nightly job: build the sales report. Tonight there is no data, so it fails.
echo "building the sales report"
echo "report: no sales data for yesterday" >&2
exit 3
