{
  description = "A flake for deploying a Next.js application with deploy-rs";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, flake-utils, deploy-rs }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        
        # Define the deployment using deploy-rs
        deployment = deploy-rs.lib.mkDeployment {
          nodes = {
            # Since App Hosting is a single-node environment, we define one node.
            app = {
              # This assumes deployment via SSH is not needed as App Hosting handles it.
              # We focus on the build steps.
            };
          };

          steps = [
            # Step 1: Copy the entire project source to the build environment.
            deploy-rs.lib.steps.copy {
              name = "copy-source";
              node = "app";
              src = ./.;
              dest = "/app";
            }
            # Step 2: Run npm install and build inside the environment.
            deploy-rs.lib.steps.run {
              name = "build-app";
              node = "app";
              command = ''
                cd /app
                npm install
                npm run build
              '';
            }
          ];
        };
      in
      {
        packages = {
          # This is the deploy attribute the build system is looking for.
          deploy = deployment;

          # Development shell for local use.
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_20
            ];
          };
        };

        # This allows running 'nix run .#deploy' locally if needed for testing.
        apps.deploy = deploy-rs.lib.apps.deploy {
          inherit deployment;
          node = "app";
        };

      });
}
