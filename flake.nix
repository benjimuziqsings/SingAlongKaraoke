{
  description = "A Next.js application for Sing A Long Karaoke";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    flake-utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, flake-utils, deploy-rs }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        deployment = deploy-rs.lib.${system}.mkDeployment {
          inherit pkgs;
          deploymentName = "sing-a-long-karaoke-deployment";

          steps = [
            (deploy-rs.lib.steps.build {
              # build the Next.js app
              buildCommand = ''
                npm install
                npm run build
              '';
              # specify the paths that should be copied to the deployment
              copyPaths = [
                { from = ./public; to = ./public; }
                { from = ./package.json; to = ./package.json; }
                { from = ./.next/standalone; to = ./.next/standalone; }
                { from = ./.next/static; to = ./.next/static; }
              ];
            })

            (deploy-rs.lib.steps.run {
              # run the Next.js app
              runCommand = "npm run start";

              serviceConfig = {
                # these are systemd service options
                Restart = "always";
                RestartSec = 5;
              };
            })
          ];
        };
      in
      {
        packages = {
          # this is the deploy attribute the build system is looking for
          deploy = deployment;
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_20
          ];
        };
      });
}
