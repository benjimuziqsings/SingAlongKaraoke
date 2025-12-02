
{
  description = "Karaoke Queue Master Deployment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    flake-utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, flake-utils, deploy-rs }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };

        deployment = deploy-rs.lib.mkDeployment {
          inherit pkgs;
          
          deploymentName = "karaoke-queue-master-deployment";

          steps = [
            # Step 1: Copy source code to the deployment environment
            (deploy-rs.lib.steps.copy {
              name = "copy-source";
              src = ./.;
            })
            # Step 2: Install npm dependencies
            (deploy-rs.lib.steps.run {
              name = "npm-install";
              command = "npm install";
            })
            # Step 3: Build the Next.js application
            (deploy-rs.lib.steps.run {
              name = "npm-build";
              command = "npm run build";
            })
          ];

          services.app = {
            # Define how to start the application
            command = ["npm" "run" "start"];
            # Ensure Node.js is available in the environment
            path = [ pkgs.nodejs_20 ]; 
          };
        };
      in
      {
        packages = {
          # This is the deploy attribute the build system is looking for.
          deploy = deployment;
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_20
          ];
        };
      }
    );
}
