{
  description = "Karaoke Queue Master";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/f720de59066162ee879adcc8c79e15c51fe6bfb4";
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
          name = "sing-a-long-karaoke";

          deployment.services.app = {
            # This is the main service for your Next.js app.
            # It will be started automatically.
          };

          # The profile defines the packages and files that will be available
          # in your deployment environment.
          profile.packages = with pkgs; [
            nodejs-20_x # Provides Node.js and npm
          ];

          # Build steps for your Next.js application
          build = {
            # Install npm dependencies
            # The node_modules directory will be cached between builds.
            pre-build.command = [ "npm" "install" "--legacy-peer-deps" ];
            # Build the Next.js application for production
            build.command = [ "npm" "run" "build" ];
          };

          # How to run your application
          run = {
            command = [ "npm" "start" ];
          };
        };
      in
      {
        # This is the deploy attribute the build system is looking for.
        packages.deploy = deployment;

        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs-20_x
          ];
        };
      }
    );
}
