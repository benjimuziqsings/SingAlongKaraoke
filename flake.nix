{
  description = "A Next.js application for karaoke song requests.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, deploy-rs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
      };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        name = "karaoke-dev-shell";
        packages = [
          pkgs.nodejs_20
          pkgs.deploy-rs
        ];
      };

      deploy = {
        nodes = {
          app = {
            hostname = "localhost";
            deployment = deploy-rs.lib.${system}.mkDeployment {
              inherit pkgs;
              # Add specific deployment steps here if needed in the future
            };
          };
        };
      };
    };
}
