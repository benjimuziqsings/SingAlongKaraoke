
{
  description = "Karaoke Queue Master";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/f720de59066162ee879adcc8c79e15c51fe6bfb4"; # nixos-23.11
    flake-utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, flake-utils, deploy-rs }:
    flake-utils.lib.eachSystem [ "x86_64-linux" ] (system:
      let
        overlays = [ deploy-rs.overlay ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };

        deployment = pkgs.mkDeployment {
          name = "sing-a-long-karaoke";
          
          # Build steps for the Next.js application
          build = {
            # This assumes a standard Next.js project with a `build` script in package.json
            command = "npm run build";
            # List files and directories from the source to be included in the build environment
            sources = [
              ./package.json
              ./package-lock.json
              ./next.config.js
              ./tsconfig.json
              ./src
              ./public
              ./apphosting.yaml
              ./firebase.json
            ];
          };

          # The packages required at runtime
          buildInputs = [ 
            pkgs.nodejs 
          ];

          # Deployment target configuration
          target = "local";

          # How to run the application
          run = {
            command = [ "npm" "start" ];
          };
        };
      in
      {
        # This is the deploy attribute the build system is looking for.
        packages.deploy = deployment;
      }
    );
}
