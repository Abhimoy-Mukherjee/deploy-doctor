import { SampleScenario } from '../types/diagnosis';

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'missing-config',
    category: 'missing_config',
    label: 'Missing env var',
    rawLog: `2026-09-19T14:22:01.412Z [INFO]  Starting CI/CD Deployment Job #4812 [main]
2026-09-19T14:22:03.189Z [INFO]  Building production container image: ghcr.io/acme/shop:v2.4.1
2026-09-19T14:22:15.820Z [INFO]  Validating production bootstrap dependencies...
2026-09-19T14:22:16.104Z [INFO]  Initializing payment gateway client at /app/server/billing/stripe.ts
2026-09-19T14:22:16.291Z [ERROR] Uncaught Exception during container bootstrap:
Error: Neither apiKey nor config.authenticator provided at Stripe.init (/app/node_modules/stripe/lib/stripe.js:68:13)
    at new StripeClient (/app/server/billing/stripe.ts:14:22)
    at Module.initializeGateway (/app/server/billing/index.ts:39:15)
    at Object.<anonymous> (/app/server/index.ts:88:5)
2026-09-19T14:22:16.302Z [FATAL] Process exited with status code 1. Health check aborting.`
  },
  {
    id: 'port-conflict',
    category: 'port_conflict',
    label: 'Port conflict',
    rawLog: `Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1740:16)
    at listenInCluster (node:net:1788:12)
    at Server.listen (node:net:1876:7)
    at /app/dist/server.js:45:10
2026-09-19T11:05:11.050Z [FATAL] Container instance failed to bind listening port. Exiting.`
  },
  {
    id: 'oom-kill',
    category: 'resource_limit',
    label: 'OOM kill',
    rawLog: `2026-09-19T16:44:12Z [build] Starting source compilation and sourcemap indexing...
2026-09-19T16:45:01Z [build] Compiling 2,840 modules for production bundle...
<--- Last few GCs --->
[14:0x7f9812]    45120 ms: Mark-Compact (reduce) 2041.2 (2048.0) -> 2038.5 (2048.0) MB, 912.4 ms allocation failure

FATAL ERROR: JavaScript heap out of memory
Process terminated with signal SIGKILL`
  },
  {
    id: 'dependency-conflict',
    category: 'dependency_conflict',
    label: 'Dependency conflict',
    rawLog: `npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! 
npm ERR! While resolving: acme-frontend@3.0.0
npm ERR! Found: react@18.3.1
npm ERR! node_modules/react
npm ERR!   react@"18.3.1" from the root project
npm ERR! 
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^16.8.0 || ^17.0.0" from legacy-charts@1.4.2
npm ERR! node_modules/legacy-charts
npm ERR!   legacy-charts@"^1.4.2" from the root project
npm ERR! 
npm ERR! Fix the upstream dependency conflict, or retry this command with --force or --legacy-peer-deps`
  },
  {
    id: 'failed-health-check',
    category: 'health_check_failure',
    label: 'Failed health check',
    rawLog: `2026-09-19T09:12:30Z [k8s-controller] Creating replica pod cart-service-78dfb9-v9x2
2026-09-19T09:12:35Z [k8s-kubelet] Started container cart-service
2026-09-19T09:12:45Z [k8s-kubelet] Warning: Readiness probe failed: HTTP probe failed with statuscode: 503
Container failed readiness probe
2026-09-19T09:13:05Z [k8s-kubelet] Readiness probe failed 3 times consecutively. Marking pod as Unready.`
  },
  {
    id: 'build-failure',
    category: 'build_failure',
    label: 'Build failure',
    rawLog: `[12:14:02] Running "npm run build" in /workspace/frontend
> webapp@2.1.0 build
> tsc --noEmit && vite build

Build failed with exit code 1
Error: Module not found: Can't resolve './components/NonExistentComponent' in '/workspace/frontend/src'
npm ERR! Lifecycle script \`build\` failed with error code 1.`
  }
];
