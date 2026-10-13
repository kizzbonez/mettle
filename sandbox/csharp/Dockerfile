# Sandbox image for C# labs: the .NET runtime, the C# compiler and the reference
# assemblies. No MSBuild and no NuGet, so nothing here ever needs the network.
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS sdk

# Take the compiler out of the SDK, without Visual Basic or the translated
# messages, and write a response file that names every reference assembly.
RUN mkdir -p /out/roslyn /out/ref \
 && cp /usr/share/dotnet/sdk/*/Roslyn/bincore/csc.* /usr/share/dotnet/sdk/*/Roslyn/bincore/Microsoft.CodeAnalysis.dll \
       /usr/share/dotnet/sdk/*/Roslyn/bincore/Microsoft.CodeAnalysis.CSharp.dll /out/roslyn/ \
 && cp /usr/share/dotnet/packs/Microsoft.NETCore.App.Ref/*/ref/net*/*.dll /out/ref/ \
 && { printf '%s\n' -nologo -target:exe -nullable:enable -langversion:latest -optimize+ -debug- -utf8output; \
      for file in /out/ref/*.dll; do printf -- '-r:/opt/dotnet-lab/ref/%s\n' "$(basename "$file")"; done; } > /out/csc.rsp \
 && printf '%s\n' '{' '  "runtimeOptions": {' "    \"tfm\": \"net$(dotnet --version | cut -d. -f1).0\"," \
      '    "framework": { "name": "Microsoft.NETCore.App", "version": "'"$(dotnet --version | cut -d. -f1)"'.0.0" },' \
      '    "configProperties": { "System.GC.Server": false, "System.GC.Concurrent": false }' '  }' '}' > /out/lab.runtimeconfig.json \
 && printf '%s\n' '#!/bin/sh' '# Compiles the given sources against the reference assemblies.' \
      'exec dotnet /opt/dotnet-lab/roslyn/csc.dll @/opt/dotnet-lab/csc.rsp "$@"' > /out/csc \
 && chmod 0755 /out/csc

FROM mcr.microsoft.com/dotnet/runtime:10.0-alpine

COPY --from=sdk /out/roslyn /opt/dotnet-lab/roslyn
COPY --from=sdk /out/ref /opt/dotnet-lab/ref
COPY --from=sdk /out/csc.rsp /out/lab.runtimeconfig.json /opt/dotnet-lab/
COPY --from=sdk /out/csc /usr/local/bin/csc

RUN adduser -D -H -u 10001 -h /work -s /sbin/nologin sandbox \
 && mkdir /work && chown sandbox:sandbox /work

# The runtime must not look for a writable home, phone home, or open the
# diagnostic pipes it would normally create under /tmp.
ENV HOME=/work \
    TMPDIR=/tmp \
    LANG=C.UTF-8 \
    DOTNET_NOLOGO=1 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_EnableDiagnostics=0 \
    DOTNET_TieredPGO=0

WORKDIR /work
USER 10001:10001
# A sandbox lives for one submission, a few seconds. There is nothing to probe.
# checkov:skip=CKV_DOCKER_2: single-use container, never a running service
HEALTHCHECK NONE
CMD ["true"]
