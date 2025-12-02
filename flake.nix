{
  description = "A Nix flake for deploying a Next.js application with deploy-rs";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, deploy-rs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};

      deployment = deploy-rs.lib.${system}.mkDeployment {
        inherit pkgs;
        deploymentName = "sing-a-long-karaoke";

        steps = [
          (deploy-rs.lib.steps.build {
            src = ./.;
            buildCommands = [
              "npm install"
              "npm run build"
            ];
          })
          (deploy-rs.lib.steps.copy {
            src = ./.;
            path = "/app";
          })
        ];

        services = {
          app = {
            command = "npm run start";
            path = [ pkgs.nodejs-20_x ];
          };
        };
      };
    in
    {
      packages.${system}.deploy = deployment;

      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs-20_x
        ];
      };
    };
}
