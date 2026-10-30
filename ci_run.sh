#!/bin/bash
# CI: run one suite; on failure, surface its FAIL / error lines as annotations (the raw logs are not always reachable)
node "$@" 2>&1 | tee ci_out.txt; s=${PIPESTATUS[0]}
if [ "$s" -ne 0 ]; then grep -E 'FAIL|Error|error:|exit=' ci_out.txt | grep -v -E 'agent-proxy|connect_rejected' | head -20 | sed "s/^/::error title=$1::/"; fi
exit $s
