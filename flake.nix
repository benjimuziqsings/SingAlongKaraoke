{
  description = "Singalong Karaoke Deployment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    flake-utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, flake-utils, deploy-rs }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages.deploy = deploy-rs.lib.${system}.mkDeployment {
          inherit pkgs;
          deployment.name = "singalong-karaoke-deployment";

          deployment.build = {
            copy = [
              ./apphosting.yaml
              ./package.json
              ./package-lock.json
              ./next.config.js
              ./tsconfig.json
              ./public
              ./src
            ];
            buildCommands = [
              ''
                # Remove node_modules if it exists to ensure a clean install
                rm -rf node_modules
                # Set a specific path for the npm cache
                export NPM_CONFIG_CACHE=$(mktemp -d)
                npm install --legacy-peer-deps
                npm run build
              ''
            ];
          };

          deployment.start = {
            exec = "npm run start";
          };
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_20
            pkgs.deploy-rs
          ];
        };
      });
}
