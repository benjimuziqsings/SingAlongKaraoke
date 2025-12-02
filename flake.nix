
{
  description = "A deployment flake for a Next.js application.";

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
        devShell = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_20 # Provides node, npm, etc.
            pkgs.deploy-rs
          ];
        };

        packages.deploy = deploy-rs.lib.${system}.mkDeployment {
          inherit pkgs;

          deployment.name = "singalong-karaoke-deployment";

          deployment.steps = [
            (pkgs.runCommand "yarn-deps" { } ''
              mkdir -p $out
              cp package.json yarn.lock $out/ || true
              cp package.json $out/ || true
            '')
            (pkgs.runCommand "build-app" { } ''
              # Copy source files
              cp -r ${./.}/* .

              # Install dependencies and build
              npm install
              npm run build

              # Copy build artifacts to output
              mkdir -p $out
              cp -r ./.next $out/
              cp -r ./node_modules $out/
              cp ./package.json $out/
              cp ./next.config.js $out/
              cp -r ./public $out/ || true
            '')
          ];

          service = {
            name = "singalong-karaoke";
            exec = "npm run start";
          };

          rollback.magic = true;
        };
      });
}
