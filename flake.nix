{
  description = "A Next.js application for karaoke song requests.";

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
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_20
            deploy-rs.packages.${system}.deploy-rs
          ];
        };

        packages.${system}.deploy = deploy-rs.lib.${system}.mkDeployment {
          inherit pkgs;
          deployment = {
            name = "singalong-karaoke";
            user = "root";
            userHome = "/root";
            
            steps = [
              {
                name = "Install dependencies";
                run = "npm install";
              }
              {
                name = "Build Next.js app";
                run = "npm run build";
              }
            ];
            
            services.app = {
              type = "simple";
              exec = "npm run start";
            };

            rollback.magic = true;
          };
        };
      }
    );
}
