{
  description = "A Next.js application for Sing A Long Karaoke";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, flake-utils, deploy-rs }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.nodejs-20_x.enable = true;
        };

        deployment = deploy-rs.lib.${system}.mkDeployment {
          inherit pkgs;

          deployment.name = "sing-a-long-karaoke-deployment";

          # This section tells deploy-rs how to build the app
          steps = [
            {
              # Copy all source files to the deployment environment
              name = "Copy sources";
              type = "copy";
              paths = [ ./apphosting.yaml ./next.config.js ./package.json ./public ./src ./tailwind.config.ts ./tsconfig.json ];
            }
            {
              # Install npm dependencies
              name = "NPM install";
              type = "shell";
              command = "npm install";
            }
            {
              # Build the Next.js application
              name = "NPM build";
              type = "shell";
              command = "npm run build";
            }
          ];

          # This section defines the service that will be run
          services."sing-a-long-karaoke" = {
            # This is the command that starts the Next.js server
            command = "npm run start";
            # This tells the service what port to expose.
            # $PORT is automatically provided by the App Hosting environment.
            listen = "$PORT";
          };
        };
      in
      {
        # This is the deploy attribute the build system is looking for.
        packages.deploy = deployment;

        # A development shell for local use
        devShell = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_20_x
          ];
        };
      });
}
