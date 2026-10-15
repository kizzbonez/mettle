# new_permissions(): missing keys, both lists counted together, duplicates and sorting.
assert new_permissions({"permissions": ["storage"]}, {"permissions": ["storage"]}) == [], (
    "nothing new when the permissions match and neither has host_permissions"
)
assert new_permissions({"permissions": ["tabs", "storage"], "host_permissions": ["<all_urls>"]}, {}) == [
    "<all_urls>", "storage", "tabs"
], "against an empty reviewed entry, everything is new, sorted"
assert new_permissions({}, {"permissions": ["cookies"]}) == [], "an extension that asks for nothing adds nothing"
assert new_permissions(
    {"permissions": ["<all_urls>"], "host_permissions": ["cookies"]},
    {"permissions": ["cookies"], "host_permissions": ["<all_urls>"]},
) == [], "a string approved in either list of the reviewed entry is not new"
assert new_permissions(
    {"permissions": ["webRequest", "webRequest", "debugger"], "host_permissions": ["https://*/*", "https://*/*"]},
    {"permissions": ["webRequest"]},
) == ["debugger", "https://*/*"], "duplicates are listed once"
assert new_permissions(
    {"permissions": ["Cookies"]}, {"permissions": ["cookies"]}
) == ["Cookies"], "permission names are compared exactly"
