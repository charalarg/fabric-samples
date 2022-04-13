#!/usr/bin/env bash
#
# SPDX-License-Identifier: Apache-2.0
#
set -euo pipefail
: ${DEBUG:="true"}

if [ "${DEBUG,,}" = "true" ]; then
   npm run debug-server
else
   npm run start-server
fi
