{
  description = "Karaoke Queue Master";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    flake-utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, flake-utils, deploy-rs, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ deploy-rs.overlay ];
        pkgs = import nixpkgs {
          inherit system;
          inherit overlays;
        };

        deployment = pkgs.mkDeployment {
          name = "karaoke-queue-master-deployment";
          
          # This defines the environment where the build and run steps will execute.
          buildInputs = [ 
            pkgs.nodejs_20 
            pkgs.openssl 
          ];

          # These steps build your Next.js application.
          build = {
            # Install npm dependencies
            install = {
              command = [ "npm" "install" ];
            };
            # Build the Next.js app
            build = {
              command = [ "npm" "run" "build" ];
            };
          };

          # This specifies the command to start your application server.
          run = {
            command = [ "npm" "start" ];
          };
          
          # This specifies that the deployment is a long-running service.
          services.app = { };
        };
      in
      {
        # This is the deploy attribute the build system is looking for.
        packages.deploy = deployment;
      }
    );
}
