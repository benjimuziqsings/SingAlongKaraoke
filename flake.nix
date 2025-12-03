
{
  description = "Sing A Long Karaoke Deployment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, deploy-rs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };

      deployment = deploy-rs.lib.${system}.mkDeployment {
        inherit pkgs;
        deploymentName = "sing-a-long-karaoke-deployment";

        nodes = {
          app = {
            # This configuration does not define a real machine.
            # It's used by the build system to understand how to
            # build and run the application.
            config = {
              services.sing-a-long-karaoke = {
                enable = true;
                package = self.packages.${system}.default;
              };
            };
          };
        };

        magicRollback = false;
      };
    in
    {
      packages.x86_64-linux.default = pkgs.stdenv.mkDerivation {
        name = "sing-a-long-karaoke";
        src = ./.;
        buildInputs = [ pkgs.nodejs-20_x ];
        buildPhase = ''
          export HOME=$(mktemp -d)
          npm install
          npm run build
        '';
        installPhase = ''
          mkdir -p $out
          cp -R . $out/
        '';
      };

      # This is the deploy attribute the build system is looking for.
      packages.x86_64-linux.deploy = deployment;

      devShells.x86_64-linux.default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs-20_x
          pkgs.nodePackages.npm
        ];
      };
    };
}
