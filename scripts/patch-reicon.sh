#!/bin/bash
# Patch reicon-svelte to fix duplicate `Icon` export
# The package has `export { default as Icon }` on both line 2 and line 1281,
# causing a [PARSE_ERROR] Duplicated export 'Icon' during build.
FILE="node_modules/reicon-svelte/index.js"
if [ -f "$FILE" ]; then
  sed -i 's/ export { default as Icon } from '"'"'.\/icons\/Icon\.svelte'"'"';/export { default as IconIcon } from '"'"'.\/icons\/Icon\.svelte'"'"';/' "$FILE"
  echo "Patched reicon-svelte: duplicate Icon export renamed to IconIcon"
fi
