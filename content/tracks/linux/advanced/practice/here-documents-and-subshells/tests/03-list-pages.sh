sourced=$(source ./solution.sh 2>&1; echo "end of source")
assert_eq "$sourced" "end of source" "sourcing solution.sh must print nothing and must not run main"
source ./solution.sh
# The script's own strict mode must not change how this test runs.
set +e +o pipefail

mkdir -p work/www/docs/v1.2 work/www/empty work/www/x.html work/other
touch work/www/index.html 'work/www/docs/v1.2/api ref.html' work/www/docs/notes.txt \
  work/www/docs/page.htm work/www/-dash.html work/www/Zeta.html work/www/x.html/inner.html

cd work/other || fail "the test could not enter its own directory"
start=$PWD
list_pages ../www > ../pages.txt
assert_eq "$PWD" "$start" "the caller's current directory after calling list_pages"
assert_eq "$(cat ../pages.txt)" "./-dash.html
./Zeta.html
./docs/v1.2/api ref.html
./index.html
./x.html/inner.html" "the pages list_pages prints for a site with nested, odd and non-page names"

list_pages ../www/empty > ../empty.txt
assert_eq "$PWD" "$start" "the caller's current directory after listing an empty site"
assert_eq "$(cat ../empty.txt)" "" "list_pages prints nothing for a site without pages"
